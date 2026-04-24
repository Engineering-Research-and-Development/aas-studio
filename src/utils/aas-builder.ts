import { SubmodelTemplate, AssetKind, SubmodelElement } from '@/context/AASContext';

export interface IDTAReference {
  type: string;
  keys: Array<{ type: string; value: string }>;
}

export interface IDTASubmodelElement {
  idShort: string;
  modelType: string;
  semanticId?: IDTAReference;
  valueType?: string;
  value?: string | unknown[] | IDTAReference;
  contentType?: string;
  inoutputVariables?: unknown[];
}

export interface IDTASubmodel {
  modelType: 'Submodel';
  id: string;
  idShort: string;
  semanticId?: IDTAReference;
  description?: Array<{ language: string; text: string }>;
  submodelElements: IDTASubmodelElement[];
}

export interface IDTAShell {
  modelType: 'AssetAdministrationShell';
  id: string;
  idShort: string;
  description?: Array<{ language: string; text: string }>;
  assetInformation: {
    assetKind: AssetKind;
    globalAssetId: string;
  };
  submodels: IDTAReference[];
}

export interface IDTAEnvironment {
  assetAdministrationShells: IDTAShell[];
  submodels: IDTASubmodel[];
  conceptDescriptions: unknown[];
}

function buildReference(value: string): IDTAReference {
  return {
    type: 'ExternalReference',
    keys: [{ type: 'GlobalReference', value }],
  };
}

function mapSubmodelElement(el: SubmodelElement): IDTASubmodelElement {
  const base = {
    idShort: el.idShort,
    semanticId: el.semanticId ? buildReference(el.semanticId) : undefined,
  };

  switch (el.type) {
    case 'Property':
      return {
        ...base,
        modelType: 'Property',
        valueType: el.valueType || 'xs:string',
        value: el.value !== undefined && el.value !== '' ? String(el.value) : undefined,
      };
    case 'MultiLanguageProperty':
      return {
        ...base,
        modelType: 'MultiLanguageProperty',
        value: [],
      };
    case 'SubmodelElementCollection':
      return {
        ...base,
        modelType: 'SubmodelElementCollection',
        value: (el.children || []).map((child) => mapSubmodelElement(child as SubmodelElement)),
      };
    case 'File':
      return {
        ...base,
        modelType: 'File',
        value: '',
        contentType: 'application/octet-stream',
      };
    case 'Operation':
      return {
        ...base,
        modelType: 'Operation',
        inoutputVariables: [],
      };
    case 'ReferenceElement':
      return {
        ...base,
        modelType: 'ReferenceElement',
        value: { type: 'ExternalReference', keys: [] },
      };
    default:
      return {
        ...base,
        modelType: el.type,
      };
  }
}

export function buildAasEnvironment(
  aasIdShort: string,
  aasAssetId: string,
  aasDescription: string,
  assetKind: AssetKind,
  submodels: SubmodelTemplate[]
): IDTAEnvironment {
  const mappedSubmodels: IDTASubmodel[] = submodels.map((sm) => {
    const isStandardId = sm.id.startsWith('urn:') || sm.id.startsWith('https:');
    return {
      modelType: 'Submodel',
      id: isStandardId ? sm.id : `https://aas-studio.local/submodels/${sm.id}`,
      idShort: sm.idShort,
      semanticId: sm.semanticId ? buildReference(sm.semanticId) : undefined,
      description: sm.description ? [{ language: 'en', text: sm.description }] : undefined,
      submodelElements: (sm.elements || []).map(mapSubmodelElement).filter(Boolean) as IDTASubmodelElement[],
    };
  });

  const shell: IDTAShell = {
    modelType: 'AssetAdministrationShell',
    id: `https://aas-studio.local/shells/${aasIdShort || 'default'}`,
    idShort: aasIdShort,
    description: aasDescription ? [{ language: 'en', text: aasDescription }] : undefined,
    assetInformation: {
      assetKind: assetKind || 'Instance',
      globalAssetId: aasAssetId || 'https://aas-studio.local/assets/default',
    },
    submodels: mappedSubmodels.map((sm) => ({
      type: 'ModelReference',
      keys: [{ type: 'Submodel', value: sm.id }],
    })),
  };

  return {
    assetAdministrationShells: [shell],
    submodels: mappedSubmodels,
    conceptDescriptions: [],
  };
}
