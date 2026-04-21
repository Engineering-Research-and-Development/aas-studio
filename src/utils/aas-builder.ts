import { SubmodelTemplate, AssetKind, SubmodelElement } from '@/context/AASContext';

function mapSubmodelElement(el: SubmodelElement): any {
  const base = {
    idShort: el.idShort,
    semanticId: el.semanticId ? { type: 'ExternalReference', keys: [{ type: 'GlobalReference', value: el.semanticId }] } : undefined,
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
        value: [], // Placeholder
      };
    case 'SubmodelElementCollection':
      return {
        ...base,
        modelType: 'SubmodelElementCollection',
        value: (el.children || []).map(child => mapSubmodelElement(child as unknown as SubmodelElement)),
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
        value: { type: 'ExternalReference', keys: [] }
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
): any {
  // 1. Map Submodels
  const mappedSubmodels = submodels.map((sm) => {
    return {
      modelType: 'Submodel',
      id: sm.id.startsWith('urn:') || sm.id.startsWith('https:') ? sm.id : `https://aas-studio.local/submodels/${sm.id}`,
      idShort: sm.idShort,
      semanticId: sm.semanticId ? { type: 'ExternalReference', keys: [{ type: 'GlobalReference', value: sm.semanticId }] } : undefined,
      description: sm.description ? [{ language: 'en', text: sm.description }] : undefined,
      submodelElements: (sm.elements || []).map(mapSubmodelElement).filter(Boolean)
    };
  });

  // 2. Map AAS Shell
  const shell = {
    modelType: 'AssetAdministrationShell',
    id: `https://aas-studio.local/shells/${aasIdShort || 'default'}`,
    idShort: aasIdShort,
    description: aasDescription ? [{ language: 'en', text: aasDescription }] : undefined,
    assetInformation: {
      assetKind: assetKind || 'Instance',
      globalAssetId: aasAssetId || `https://aas-studio.local/assets/default`
    },
    submodels: mappedSubmodels.map(sm => ({
      type: 'ModelReference',
      keys: [{ type: 'Submodel', value: sm.id }]
    }))
  };

  // 3. Assemble Environment
  return {
    assetAdministrationShells: [shell],
    submodels: mappedSubmodels,
    conceptDescriptions: []
  };
}
