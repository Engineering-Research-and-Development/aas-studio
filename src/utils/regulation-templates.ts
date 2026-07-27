// ─────────────────────────────────────────────────────────────────────────────
// EU regulation-mapped submodel templates (Roadmap 1a).
//
// Unlike the generic IDTA catalog, these templates are tied to specific EU
// legal acts: every mandatory field carries a `legalRef` pointing at the
// article/annex that requires it. Selecting one in the "Aggiungi Submodel"
// dialog seeds an AAS submodel pre-structured for that compliance regime.
//
// Coverage is representative of each act's core mandatory data points — enough
// to drive authoring and validation — not an exhaustive transcription of the
// annexes.
// ─────────────────────────────────────────────────────────────────────────────

import type { SubmodelTemplate, SubmodelElement } from '@/context/AASContext';

export interface RegulationTemplate extends SubmodelTemplate {
  /** Short legal act id, e.g. "EU 2023/1542". */
  regulation: string;
  /** Human-readable regime name, e.g. "Battery Passport". */
  regulationName: string;
  /** Primary legal basis, e.g. "Art. 77 + Annex XIII". */
  legalBasis: string;
}

// ── Battery Passport — Regulation (EU) 2023/1542 ─────────────────────────────

const batteryPassport: RegulationTemplate = {
  id: 'reg-battery-passport',
  idShort: 'BatteryPassport',
  semanticId: 'urn:eu:2023:1542:submodel:BatteryPassport:1:0',
  regulation: 'EU 2023/1542',
  regulationName: 'Battery Passport',
  legalBasis: 'Art. 77 + Annex XIII',
  description: 'Digital Product Passport per batterie industriali, LMT e per veicoli elettrici.',
  category: 'Sustainability',
  elements: [
    { idShort: 'BatteryIdentification', type: 'SubmodelElementCollection', semanticId: 'urn:eu:2023:1542:BatteryIdentification', required: true, legalRef: 'Annex XIII §1(a)', children: [
      { idShort: 'BatteryModelIdentifier', type: 'Property', valueType: 'xs:string', required: true, legalRef: 'Annex XIII §1(a)' },
      { idShort: 'ManufacturerIdentification', type: 'Property', valueType: 'xs:string', required: true, legalRef: 'Annex XIII §1(a)' },
      { idShort: 'BatteryCategory', type: 'Property', valueType: 'xs:string', required: true, legalRef: 'Art. 77(2)' },
      { idShort: 'ManufacturingDate', type: 'Property', valueType: 'xs:date', required: true, legalRef: 'Annex XIII §1(a)' },
      { idShort: 'ManufacturingPlace', type: 'Property', valueType: 'xs:string', required: true, legalRef: 'Annex XIII §1(a)' },
    ] },
    { idShort: 'CarbonFootprint', type: 'SubmodelElementCollection', semanticId: 'urn:eu:2023:1542:CarbonFootprint', required: true, legalRef: 'Art. 7 + Annex II', children: [
      { idShort: 'TotalCarbonFootprint', type: 'Property', valueType: 'xs:double', required: true, legalRef: 'Art. 7(1)' },
      { idShort: 'CarbonFootprintPerLifecycleStage', type: 'Property', valueType: 'xs:string', required: true, legalRef: 'Annex II §4' },
      { idShort: 'CarbonFootprintPerformanceClass', type: 'Property', valueType: 'xs:string', required: false, legalRef: 'Art. 7(2)' },
    ] },
    { idShort: 'MaterialComposition', type: 'SubmodelElementCollection', semanticId: 'urn:eu:2023:1542:MaterialComposition', required: true, legalRef: 'Annex XIII §1(e)', children: [
      { idShort: 'CriticalRawMaterials', type: 'Property', valueType: 'xs:string', required: true, legalRef: 'Annex XIII §1(e)' },
      { idShort: 'HazardousSubstances', type: 'Property', valueType: 'xs:string', required: true, legalRef: 'Art. 6 + Annex I' },
      { idShort: 'RecycledContentShare', type: 'Property', valueType: 'xs:double', required: true, legalRef: 'Art. 8' },
    ] },
    { idShort: 'StateOfHealth', type: 'SubmodelElementCollection', semanticId: 'urn:eu:2023:1542:StateOfHealth', required: true, legalRef: 'Annex XIII §1(g)', children: [
      { idShort: 'RemainingCapacity', type: 'Property', valueType: 'xs:double', required: true, legalRef: 'Annex XIII §1(g)' },
      { idShort: 'StateOfCharge', type: 'Property', valueType: 'xs:double', required: false, legalRef: 'Annex XIII §1(g)' },
      { idShort: 'NumberOfFullCycles', type: 'Property', valueType: 'xs:int', required: false, legalRef: 'Annex XIII §1(g)' },
    ] },
    { idShort: 'DueDiligenceReport', type: 'File', semanticId: 'urn:eu:2023:1542:DueDiligence', required: true, legalRef: 'Art. 48 + Art. 52' },
  ],
};

// ── EU Machinery Technical File — Regulation (EU) 2023/1230 ──────────────────

const machineryTechnicalFile: RegulationTemplate = {
  id: 'reg-machinery-technical-file',
  idShort: 'MachineryTechnicalFile',
  semanticId: 'urn:eu:2023:1230:submodel:TechnicalFile:1:0',
  regulation: 'EU 2023/1230',
  regulationName: 'EU Machinery Technical File',
  legalBasis: 'Art. 43 + Annex IV',
  description: 'Fascicolo tecnico del Regolamento Macchine (sostituisce la Direttiva 2006/42/CE).',
  category: 'Documentation',
  elements: [
    { idShort: 'GeneralDescription', type: 'MultiLanguageProperty', semanticId: 'urn:eu:2023:1230:GeneralDescription', required: true, legalRef: 'Annex IV, A(a)' },
    { idShort: 'DesignAndManufacturing', type: 'SubmodelElementCollection', semanticId: 'urn:eu:2023:1230:DesignManufacturing', required: true, legalRef: 'Annex IV, A(b)', children: [
      { idShort: 'OverallDrawings', type: 'File', required: true, legalRef: 'Annex IV, A(b)(i)' },
      { idShort: 'CircuitDiagrams', type: 'File', required: true, legalRef: 'Annex IV, A(b)(i)' },
      { idShort: 'CalculationsAndTestResults', type: 'File', required: true, legalRef: 'Annex IV, A(b)(ii)' },
    ] },
    { idShort: 'RiskAssessment', type: 'SubmodelElementCollection', semanticId: 'urn:eu:2023:1230:RiskAssessment', required: true, legalRef: 'Annex IV, A(c)', children: [
      { idShort: 'EssentialRequirementsApplied', type: 'Property', valueType: 'xs:string', required: true, legalRef: 'Annex IV, A(c)' },
      { idShort: 'ProtectiveMeasures', type: 'MultiLanguageProperty', required: true, legalRef: 'Annex III §1.1.2' },
      { idShort: 'ResidualRisks', type: 'MultiLanguageProperty', required: true, legalRef: 'Annex III §1.7.4' },
    ] },
    { idShort: 'StandardsApplied', type: 'Property', valueType: 'xs:string', semanticId: 'urn:eu:2023:1230:HarmonisedStandards', required: true, legalRef: 'Annex IV, A(d)' },
    { idShort: 'InstructionsForUse', type: 'File', semanticId: 'urn:eu:2023:1230:Instructions', required: true, legalRef: 'Annex IV, A(f) + Annex III §1.7.4' },
    { idShort: 'DeclarationOfConformity', type: 'File', semanticId: 'urn:eu:2023:1230:EUDoC', required: true, legalRef: 'Art. 21 + Annex V' },
    { idShort: 'CEMarking', type: 'Property', valueType: 'xs:boolean', semanticId: 'urn:eu:2023:1230:CEMarking', required: true, legalRef: 'Art. 22' },
  ],
};

// ── CATENA-X SerialPart — CX-0006 ────────────────────────────────────────────

const catenaXSerialPart: RegulationTemplate = {
  id: 'reg-catenax-serialpart',
  idShort: 'SerialPart',
  semanticId: 'urn:samm:io.catenax.serial_part:3.0.0#SerialPart',
  regulation: 'CATENA-X CX-0006',
  regulationName: 'CATENA-X SerialPart',
  legalBasis: 'CX-0006 v3.0 (SAMM Aspect Model)',
  description: 'Aspect model SerialPart per la tracciabilità dei componenti in Catena-X.',
  category: 'Identification',
  elements: [
    { idShort: 'catenaXId', type: 'Property', valueType: 'xs:string', semanticId: 'urn:samm:io.catenax.serial_part:3.0.0#catenaXId', required: true, legalRef: 'CX-0006 §catenaXId' },
    { idShort: 'localIdentifiers', type: 'SubmodelElementList', semanticId: 'urn:samm:io.catenax.serial_part:3.0.0#localIdentifiers', required: true, legalRef: 'CX-0006 §localIdentifiers', children: [
      { idShort: 'key', type: 'Property', valueType: 'xs:string', required: true, legalRef: 'CX-0006 §KeyValueList.key' },
      { idShort: 'value', type: 'Property', valueType: 'xs:string', required: true, legalRef: 'CX-0006 §KeyValueList.value' },
    ] },
    { idShort: 'manufacturingInformation', type: 'SubmodelElementCollection', semanticId: 'urn:samm:io.catenax.serial_part:3.0.0#manufacturingInformation', required: true, legalRef: 'CX-0006 §manufacturingInformation', children: [
      { idShort: 'date', type: 'Property', valueType: 'xs:dateTime', required: true, legalRef: 'CX-0006 §manufacturingInformation.date' },
      { idShort: 'country', type: 'Property', valueType: 'xs:string', required: false, legalRef: 'CX-0006 §manufacturingInformation.country' },
    ] },
    { idShort: 'partTypeInformation', type: 'SubmodelElementCollection', semanticId: 'urn:samm:io.catenax.serial_part:3.0.0#partTypeInformation', required: true, legalRef: 'CX-0006 §partTypeInformation', children: [
      { idShort: 'manufacturerPartId', type: 'Property', valueType: 'xs:string', required: true, legalRef: 'CX-0006 §manufacturerPartId' },
      { idShort: 'nameAtManufacturer', type: 'Property', valueType: 'xs:string', required: true, legalRef: 'CX-0006 §nameAtManufacturer' },
      { idShort: 'classification', type: 'Property', valueType: 'xs:string', required: false, legalRef: 'CX-0006 §classification' },
    ] },
  ],
};

// ── Generic Digital Product Passport — ESPR (EU) 2024/1781 ────────────────────

const genericDpp: RegulationTemplate = {
  id: 'reg-generic-dpp',
  idShort: 'DigitalProductPassport',
  semanticId: 'urn:eu:2024:1781:submodel:DigitalProductPassport:1:0',
  regulation: 'EU 2024/1781',
  regulationName: 'Generic Digital Product Passport',
  legalBasis: 'ESPR Art. 9 + Annex III',
  description: 'Passaporto digitale di prodotto generico secondo il Regolamento ESPR.',
  category: 'Sustainability',
  elements: [
    { idShort: 'UniqueProductIdentifier', type: 'Property', valueType: 'xs:string', semanticId: 'urn:eu:2024:1781:UPI', required: true, legalRef: 'Art. 9(1)(a)' },
    { idShort: 'UniqueOperatorIdentifier', type: 'Property', valueType: 'xs:string', semanticId: 'urn:eu:2024:1781:UOI', required: true, legalRef: 'Art. 9(1)(c)' },
    { idShort: 'UniqueFacilityIdentifier', type: 'Property', valueType: 'xs:string', semanticId: 'urn:eu:2024:1781:UFI', required: false, legalRef: 'Art. 9(1)(c)' },
    { idShort: 'EconomicOperator', type: 'SubmodelElementCollection', semanticId: 'urn:eu:2024:1781:EconomicOperator', required: true, legalRef: 'Annex III (h)', children: [
      { idShort: 'Name', type: 'Property', valueType: 'xs:string', required: true, legalRef: 'Annex III (h)' },
      { idShort: 'Address', type: 'Property', valueType: 'xs:string', required: true, legalRef: 'Annex III (h)' },
      { idShort: 'ContactEmail', type: 'Property', valueType: 'xs:string', required: false, legalRef: 'Annex III (h)' },
    ] },
    { idShort: 'ProductCompliance', type: 'SubmodelElementCollection', semanticId: 'urn:eu:2024:1781:Compliance', required: true, legalRef: 'Annex III (a)', children: [
      { idShort: 'DeclarationOfConformity', type: 'File', required: true, legalRef: 'Annex III (a)' },
      { idShort: 'TechnicalDocumentation', type: 'File', required: true, legalRef: 'Annex III (a)' },
      { idShort: 'ComplianceCertificates', type: 'File', required: false, legalRef: 'Annex III (a)' },
    ] },
    { idShort: 'SubstancesOfConcern', type: 'Property', valueType: 'xs:string', semanticId: 'urn:eu:2024:1781:SVHC', required: true, legalRef: 'Art. 9(1)(b) + Annex III (d)' },
    { idShort: 'CircularityInformation', type: 'SubmodelElementCollection', semanticId: 'urn:eu:2024:1781:Circularity', required: true, legalRef: 'Annex III (b)(c)', children: [
      { idShort: 'RecycledContent', type: 'Property', valueType: 'xs:double', required: false, legalRef: 'Annex III (b)' },
      { idShort: 'Reparability', type: 'Property', valueType: 'xs:string', required: false, legalRef: 'Annex III (c)' },
      { idShort: 'EndOfLifeInstructions', type: 'MultiLanguageProperty', required: true, legalRef: 'Annex III (c)' },
    ] },
  ],
};

export const REGULATION_TEMPLATES: RegulationTemplate[] = [
  batteryPassport,
  machineryTechnicalFile,
  catenaXSerialPart,
  genericDpp,
];

/** Blank an element tree's values so a template becomes an editable instance. */
export function instantiateRegulationElements(elements: SubmodelElement[]): SubmodelElement[] {
  return elements.map((el) => ({
    ...el,
    value: el.type === 'MultiLanguageProperty' ? {} : '',
    children: el.children ? instantiateRegulationElements(el.children) : undefined,
  }));
}
