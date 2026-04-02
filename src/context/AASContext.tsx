import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// ═══════════════════════════════════
// TYPES
// ═══════════════════════════════════

export type VersionStatus = 'Draft' | 'Active' | 'Deprecated';
export type AssetKind = 'Instance' | 'Type';
export type ChangeType = 'added' | 'modified' | 'removed';
export type ElementType =
  | 'Property'
  | 'MultiLanguageProperty'
  | 'SubmodelElementCollection'
  | 'Operation'
  | 'File'
  | 'Blob'
  | 'ReferenceElement';
export type XsdValueType =
  | 'xs:string'
  | 'xs:int'
  | 'xs:double'
  | 'xs:float'
  | 'xs:boolean'
  | 'xs:date'
  | 'xs:dateTime'
  | 'xs:long'
  | 'xs:short'
  | 'xs:byte'
  | 'xs:anyURI'
  | 'xs:duration'
  | 'xs:decimal';

export interface ChangeDetail {
  type: ChangeType;
  target: string;
  name: string;
  desc: string;
}

export interface AASVersion {
  version: string;
  revision: string;
  date: string;
  status: VersionStatus;
  author: string;
  changes: string;
  details: ChangeDetail[];
}

export interface AASModel {
  id: string;
  idShort: string;
  assetId: string;
  description: string;
  assetKind: AssetKind;
  versions: AASVersion[];
}

export interface SubmodelElementChild {
  idShort: string;
  type: ElementType;
  valueType?: XsdValueType;
  semanticId?: string;
  required: boolean;
}

export interface SubmodelElement {
  idShort: string;
  type: ElementType;
  valueType?: XsdValueType;
  semanticId?: string;
  required: boolean;
  value?: string | Record<string, string>;
  contentType?: string;
  children?: SubmodelElementChild[];
}

export interface SubmodelTemplate {
  id: string;
  idShort: string;
  semanticId: string;
  description: string;
  category: string;
  elements: SubmodelElement[];
}

export interface ValidationFinding {
  path: string;
  msg: string;
  rule: string;
}

export interface ValidationResult {
  errors: ValidationFinding[];
  warnings: ValidationFinding[];
  infos: ValidationFinding[];
  valid: boolean;
}

// ═══════════════════════════════════
// MOCK DATABASE
// ═══════════════════════════════════

export const MOCK_AAS_DB: AASModel[] = [
  {
    id: 'aas-pump-001',
    idShort: 'AAS_CentrifugalPump_CP200',
    assetId: 'urn:mfr:siemens:pump:cp200:sn-44821',
    description: 'Digital twin — Centrifugal Pump CP200 Line',
    assetKind: 'Instance',
    versions: [
      {
        version: '3.0.0', revision: 'A', date: '2026-03-10T14:22:00Z', status: 'Draft',
        author: 'M. Pistone',
        changes: 'Aggiunto submodel PredictiveMaintenance con semanticId ECLASS',
        details: [
          { type: 'added', target: 'Submodel', name: 'PredictiveMaintenance', desc: 'Nuovo submodel manutenzione predittiva con HealthIndex e RUL' },
          { type: 'added', target: 'Property', name: 'PredictiveMaintenance.HealthIndex', desc: 'Indice salute asset (0-100)' },
          { type: 'added', target: 'Property', name: 'PredictiveMaintenance.RemainingUsefulLife', desc: 'Vita utile residua in ore' },
          { type: 'added', target: 'Collection', name: 'PredictiveMaintenance.MaintenanceSchedule', desc: 'Scheduling manutenzione' },
        ],
      },
      {
        version: '2.1.0', revision: 'B', date: '2026-02-18T09:15:00Z', status: 'Active',
        author: 'M. Pistone',
        changes: 'Aggiornato Nameplate con nuovi campi IEC 61360',
        details: [
          { type: 'modified', target: 'Property', name: 'Nameplate.SerialNumber', desc: 'Aggiunto semanticId ECLASS 0173-1#02-AAM556#002' },
          { type: 'added', target: 'Property', name: 'Nameplate.BatchNumber', desc: 'Numero lotto produzione' },
          { type: 'modified', target: 'Submodel', name: 'Nameplate', desc: 'Aggiornato semanticId a versione 2.0 IDTA' },
        ],
      },
      {
        version: '2.0.0', revision: 'A', date: '2026-01-05T11:30:00Z', status: 'Active',
        author: 'M. Pistone',
        changes: 'Ristrutturato Documentation submodel, aggiunto TechnicalData',
        details: [
          { type: 'added', target: 'Submodel', name: 'TechnicalData', desc: 'Nuovo submodel proprietà tecniche IEC 61360' },
          { type: 'modified', target: 'Submodel', name: 'HandoverDocumentation', desc: 'Ristrutturato con DocumentationCollection' },
          { type: 'removed', target: 'Property', name: 'Documentation.LegacyField', desc: 'Rimosso campo legacy non conforme' },
        ],
      },
      {
        version: '1.0.0', revision: 'C', date: '2025-10-20T16:45:00Z', status: 'Deprecated',
        author: 'M. Pistone',
        changes: 'Release iniziale con Nameplate e Identification',
        details: [
          { type: 'added', target: 'Submodel', name: 'Nameplate', desc: 'Nameplate produttore IEC 61406' },
          { type: 'added', target: 'Submodel', name: 'Identification', desc: 'Identificazione asset ECLASS' },
        ],
      },
    ],
  },
  {
    id: 'aas-robot-002',
    idShort: 'AAS_IndustrialRobot_KR60',
    assetId: 'urn:mfr:kuka:robot:kr60:sn-88412',
    description: 'Digital twin — KUKA KR 60 HA',
    assetKind: 'Instance',
    versions: [
      {
        version: '1.2.0', revision: 'A', date: '2026-03-01T10:00:00Z', status: 'Active',
        author: 'L. Ferrara',
        changes: 'Aggiunto OperationalData submodel',
        details: [
          { type: 'added', target: 'Submodel', name: 'OperationalData', desc: 'Dati operativi real-time' },
          { type: 'added', target: 'Property', name: 'OperationalData.OperatingHours', desc: 'Ore di funzionamento' },
        ],
      },
      {
        version: '1.0.0', revision: 'A', date: '2025-11-01T12:00:00Z', status: 'Deprecated',
        author: 'L. Ferrara',
        changes: 'Prima versione',
        details: [
          { type: 'added', target: 'Submodel', name: 'Nameplate', desc: 'Nameplate KUKA' },
          { type: 'added', target: 'Submodel', name: 'Identification', desc: 'Identificazione robot' },
        ],
      },
    ],
  },
  {
    id: 'aas-sensor-003',
    idShort: 'AAS_TempSensor_TS400',
    assetId: 'urn:mfr:bosch:sensor:ts400:sn-12093',
    description: 'Digital twin — Bosch TS400 Temperature Sensor',
    assetKind: 'Instance',
    versions: [
      {
        version: '2.0.0', revision: 'A', date: '2026-02-28T15:20:00Z', status: 'Active',
        author: 'M. Pistone',
        changes: 'Migrazione a AAS v3 metamodel',
        details: [
          { type: 'modified', target: 'Submodel', name: 'Nameplate', desc: 'Migrato a schema AAS v3' },
          { type: 'modified', target: 'Submodel', name: 'TechnicalData', desc: 'Allineato a IDTA template v1.2' },
        ],
      },
      {
        version: '1.0.0', revision: 'B', date: '2025-09-10T09:00:00Z', status: 'Deprecated',
        author: 'M. Pistone',
        changes: 'Release iniziale',
        details: [
          { type: 'added', target: 'Submodel', name: 'Nameplate', desc: 'Nameplate Bosch' },
          { type: 'added', target: 'Submodel', name: 'TechnicalData', desc: 'Dati tecnici sensore' },
        ],
      },
    ],
  },
  {
    id: 'aas-conveyor-004',
    idShort: 'AAS_ConveyorBelt_CB100',
    assetId: 'urn:mfr:festo:conveyor:cb100:sn-55110',
    description: 'Digital twin — Festo CB100 Conveyor Belt',
    assetKind: 'Type',
    versions: [
      {
        version: '1.0.0', revision: 'A', date: '2026-03-05T11:10:00Z', status: 'Draft',
        author: 'A. Rossi',
        changes: 'Modello type iniziale',
        details: [
          { type: 'added', target: 'Submodel', name: 'Nameplate', desc: 'Nameplate Festo' },
          { type: 'added', target: 'Submodel', name: 'TechnicalData', desc: 'Specifiche tecniche nastro' },
          { type: 'added', target: 'Submodel', name: 'BillOfMaterial', desc: 'BOM componenti nastro' },
        ],
      },
    ],
  },
];

// ═══════════════════════════════════
// SUBMODEL CATALOG
// ═══════════════════════════════════

export const SM_CATALOG: SubmodelTemplate[] = [
  {
    id: 'smt-nameplate', idShort: 'Nameplate',
    semanticId: 'urn:idta:aas:submodel:Nameplate:1:0',
    description: 'Identificazione produttore IEC 61406', category: 'Identification',
    elements: [
      { idShort: 'ManufacturerName', type: 'MultiLanguageProperty', semanticId: '0173-1#02-AAO677#002', required: true },
      { idShort: 'ManufacturerProductDesignation', type: 'MultiLanguageProperty', semanticId: '0173-1#02-AAW338#001', required: true },
      { idShort: 'SerialNumber', type: 'Property', valueType: 'xs:string', semanticId: '0173-1#02-AAM556#002', required: false },
      { idShort: 'YearOfConstruction', type: 'Property', valueType: 'xs:string', semanticId: '0173-1#02-AAP906#001', required: false },
    ],
  },
  {
    id: 'smt-identification', idShort: 'Identification',
    semanticId: 'urn:idta:aas:submodel:Identification:1:0',
    description: 'Dati identificazione ECLASS', category: 'Identification',
    elements: [
      { idShort: 'ManufacturerId', type: 'Property', valueType: 'xs:string', semanticId: '0173-1#02-AAO677#002', required: true },
      { idShort: 'AssetId', type: 'Property', valueType: 'xs:string', semanticId: 'urn:idta:id:AssetId', required: true },
      { idShort: 'ProductType', type: 'Property', valueType: 'xs:string', semanticId: '0173-1#02-AAO057#002', required: false },
    ],
  },
  {
    id: 'smt-techdata', idShort: 'TechnicalData',
    semanticId: 'urn:idta:aas:submodel:TechnicalData:1:2',
    description: 'Proprietà tecniche IEC 61360', category: 'Technical',
    elements: [
      {
        idShort: 'GeneralInformation', type: 'SubmodelElementCollection', semanticId: 'urn:idta:td:GeneralInfo', required: true,
        children: [
          { idShort: 'ManufacturerName', type: 'Property', valueType: 'xs:string', required: true },
          { idShort: 'ProductArticleNumber', type: 'Property', valueType: 'xs:string', required: false },
        ],
      },
      { idShort: 'TechnicalProperties', type: 'SubmodelElementCollection', semanticId: 'urn:idta:td:TechProps', required: true, children: [] },
    ],
  },
  {
    id: 'smt-documentation', idShort: 'HandoverDocumentation',
    semanticId: 'urn:idta:aas:submodel:HandoverDocumentation:1:2',
    description: 'Documentazione tecnica', category: 'Documentation',
    elements: [
      {
        idShort: 'DocumentationCollection', type: 'SubmodelElementCollection', semanticId: 'urn:idta:doc:Collection', required: true,
        children: [
          { idShort: 'DocumentId', type: 'Property', valueType: 'xs:string', required: true },
          { idShort: 'DocumentTitle', type: 'MultiLanguageProperty', required: true },
          { idShort: 'DocumentFile', type: 'File', required: true },
        ],
      },
    ],
  },
  {
    id: 'smt-opdata', idShort: 'OperationalData',
    semanticId: 'urn:idta:aas:submodel:OperationalData:1:0',
    description: 'Dati operativi real-time', category: 'Operational',
    elements: [
      { idShort: 'OperatingHours', type: 'Property', valueType: 'xs:double', semanticId: '0173-1#02-AAV184#001', required: false },
      { idShort: 'CycleCount', type: 'Property', valueType: 'xs:int', semanticId: 'urn:idta:op:CycleCount', required: false },
      { idShort: 'CurrentTemperature', type: 'Property', valueType: 'xs:double', semanticId: '0173-1#02-AAV232#001', required: false },
    ],
  },
  {
    id: 'smt-maintenance', idShort: 'PredictiveMaintenance',
    semanticId: 'urn:idta:aas:submodel:PredictiveMaintenance:1:0',
    description: 'Manutenzione predittiva', category: 'Maintenance',
    elements: [
      {
        idShort: 'MaintenanceSchedule', type: 'SubmodelElementCollection', semanticId: 'urn:idta:pm:Schedule', required: true,
        children: [
          { idShort: 'NextMaintenanceDate', type: 'Property', valueType: 'xs:date', required: true },
          { idShort: 'MaintenanceInterval', type: 'Property', valueType: 'xs:duration', required: false },
        ],
      },
      { idShort: 'RemainingUsefulLife', type: 'Property', valueType: 'xs:double', semanticId: 'urn:idta:pm:RUL', required: false },
      { idShort: 'HealthIndex', type: 'Property', valueType: 'xs:double', semanticId: 'urn:idta:pm:HealthIndex', required: false },
    ],
  },
  {
    id: 'smt-carbonfoot', idShort: 'CarbonFootprint',
    semanticId: 'urn:idta:aas:submodel:CarbonFootprint:1:0',
    description: 'PCF Catena-X', category: 'Sustainability',
    elements: [
      {
        idShort: 'PCFCalculation', type: 'SubmodelElementCollection', semanticId: 'urn:idta:cf:PCF', required: true,
        children: [
          { idShort: 'CO2EquivalentTotal', type: 'Property', valueType: 'xs:double', required: true },
          { idShort: 'ReferenceUnit', type: 'Property', valueType: 'xs:string', required: true },
        ],
      },
    ],
  },
  {
    id: 'smt-bom', idShort: 'BillOfMaterial',
    semanticId: 'urn:idta:aas:submodel:BOM:1:0',
    description: 'Distinta base (BOM)', category: 'Structure',
    elements: [
      {
        idShort: 'BOMEntries', type: 'SubmodelElementCollection', semanticId: 'urn:idta:bom:Entries', required: true,
        children: [
          { idShort: 'PartNumber', type: 'Property', valueType: 'xs:string', required: true },
          { idShort: 'Quantity', type: 'Property', valueType: 'xs:int', required: true },
          { idShort: 'PartReference', type: 'ReferenceElement', required: false },
        ],
      },
    ],
  },
];

// ═══════════════════════════════════
// VALIDATION ENGINE
// ═══════════════════════════════════

export function validateAAS(
  aas: { idShort: string; assetId: string },
  sms: SubmodelTemplate[]
): ValidationResult {
  const E: ValidationFinding[] = [];
  const W: ValidationFinding[] = [];
  const N: ValidationFinding[] = [];

  if (!aas.idShort?.trim()) E.push({ path: 'AAS', msg: 'idShort obbligatorio', rule: 'AAS-001' });
  if (aas.idShort && !/^[a-zA-Z_]\w*$/.test(aas.idShort))
    E.push({ path: 'AAS.idShort', msg: `"${aas.idShort}" non valido`, rule: 'AAS-002' });
  if (!aas.assetId?.trim()) E.push({ path: 'AAS.assetId', msg: 'globalAssetId obbligatorio', rule: 'AAS-003' });
  if (aas.assetId && !aas.assetId.startsWith('urn:'))
    W.push({ path: 'AAS.assetId', msg: 'Formato URN raccomandato', rule: 'W001' });
  if (!sms.length) W.push({ path: 'AAS', msg: 'Nessun submodel', rule: 'W002' });

  const sIds = new Set<string>();
  sms.forEach((s, i) => {
    const p = `SM[${i}] "${s.idShort || '?'}"`;
    if (!s.idShort?.trim()) E.push({ path: p, msg: 'idShort obbligatorio', rule: 'SM-001' });
    if (s.idShort && !/^[a-zA-Z_]\w*$/.test(s.idShort))
      E.push({ path: p, msg: 'idShort non valido', rule: 'SM-002' });
    if (sIds.has(s.idShort)) E.push({ path: p, msg: `"${s.idShort}" duplicato`, rule: 'SM-003' });
    sIds.add(s.idShort);
    if (!s.semanticId?.trim()) W.push({ path: p, msg: 'semanticId mancante', rule: 'SW001' });
    if (!s.elements?.length) N.push({ path: p, msg: 'Submodel vuoto', rule: 'SI001' });

    const eIds = new Set<string>();
    (s.elements || []).forEach((el, ei) => {
      const ep = `${p} → ${el.idShort || `[${ei}]`}`;
      if (!el.idShort?.trim()) E.push({ path: ep, msg: 'idShort obbligatorio', rule: 'EL-001' });
      if (el.idShort && !/^[a-zA-Z_]\w*$/.test(el.idShort))
        E.push({ path: ep, msg: 'idShort non valido', rule: 'EL-002' });
      if (eIds.has(el.idShort)) E.push({ path: ep, msg: `"${el.idShort}" duplicato`, rule: 'EL-003' });
      eIds.add(el.idShort);
      if (el.type === 'Property') {
        if (!el.valueType) E.push({ path: ep, msg: 'valueType obbligatorio', rule: 'EL-004' });
        const v = typeof el.value === 'string' ? el.value : '';
        if (v) {
          if (el.valueType === 'xs:int' && isNaN(parseInt(v)))
            E.push({ path: ep, msg: `"${v}" non intero`, rule: 'EL-005' });
          if ((el.valueType === 'xs:double' || el.valueType === 'xs:float') && isNaN(parseFloat(v)))
            E.push({ path: ep, msg: `"${v}" non numero`, rule: 'EL-006' });
          if (el.valueType === 'xs:boolean' && !['true', 'false', '0', '1'].includes(v.toLowerCase()))
            E.push({ path: ep, msg: `"${v}" non booleano`, rule: 'EL-007' });
        }
      }
      if (!el.semanticId) N.push({ path: ep, msg: 'semanticId mancante', rule: 'EI001' });
      if (el.required && (el.value === undefined || el.value === ''))
        E.push({ path: ep, msg: 'Campo required vuoto', rule: 'EL-008' });
    });
  });

  return { errors: E, warnings: W, infos: N, valid: E.length === 0 };
}

// ═══════════════════════════════════
// CONTEXT
// ═══════════════════════════════════

const DEFAULT_SUBMODELS: SubmodelTemplate[] = [
  { ...SM_CATALOG[0], elements: SM_CATALOG[0].elements.map(e => ({ ...e, value: e.type === 'MultiLanguageProperty' ? {} : '' })) },
  { ...SM_CATALOG[2], elements: SM_CATALOG[2].elements.map(e => ({ ...e, value: e.type === 'MultiLanguageProperty' ? {} : '' })) },
];

interface AASContextType {
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  currentModel: AASModel;
  currentVersion: AASVersion;
  submodels: SubmodelTemplate[];
  setSubmodels: React.Dispatch<React.SetStateAction<SubmodelTemplate[]>>;
  aasIdShort: string;
  setAasIdShort: (v: string) => void;
  aasAssetId: string;
  setAasAssetId: (v: string) => void;
  aasDescription: string;
  setAasDescription: (v: string) => void;
  addSubmodel: (sm: SubmodelTemplate) => void;
  removeSubmodel: (id: string) => void;
  updateElement: (smId: string, elIdx: number, field: string, value: string) => void;
}

const AASContext = createContext<AASContextType | null>(null);

export function AASProvider({ children }: { children: ReactNode }) {
  const [selectedModelId, setSelectedModelId] = useState(MOCK_AAS_DB[0].id);
  const currentModel = MOCK_AAS_DB.find(m => m.id === selectedModelId) || MOCK_AAS_DB[0];
  const currentVersion = currentModel.versions[0];

  const [submodels, setSubmodels] = useState<SubmodelTemplate[]>(DEFAULT_SUBMODELS);
  const [aasIdShort, setAasIdShort] = useState(currentModel.idShort);
  const [aasAssetId, setAasAssetId] = useState(currentModel.assetId);
  const [aasDescription, setAasDescription] = useState(currentModel.description);

  useEffect(() => {
    setAasIdShort(currentModel.idShort);
    setAasAssetId(currentModel.assetId);
    setAasDescription(currentModel.description);
  }, [selectedModelId]);

  const addSubmodel = useCallback((sm: SubmodelTemplate) => {
    setSubmodels(prev => [...prev, sm]);
  }, []);

  const removeSubmodel = useCallback((id: string) => {
    setSubmodels(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateElement = useCallback((smId: string, elIdx: number, field: string, value: string) => {
    setSubmodels(prev =>
      prev.map(s => {
        if (s.id !== smId) return s;
        const elements = [...s.elements];
        elements[elIdx] = { ...elements[elIdx], [field]: value };
        return { ...s, elements };
      })
    );
  }, []);

  return (
    <AASContext.Provider
      value={{
        selectedModelId,
        setSelectedModelId,
        currentModel,
        currentVersion,
        submodels,
        setSubmodels,
        aasIdShort,
        setAasIdShort,
        aasAssetId,
        setAasAssetId,
        aasDescription,
        setAasDescription,
        addSubmodel,
        removeSubmodel,
        updateElement,
      }}
    >
      {children}
    </AASContext.Provider>
  );
}

export function useAASContext(): AASContextType {
  const ctx = useContext(AASContext);
  if (!ctx) throw new Error('useAASContext must be used within AASProvider');
  return ctx;
}
