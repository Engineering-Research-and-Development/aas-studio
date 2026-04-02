import React, { useState, useEffect, useRef, type ReactNode, type CSSProperties, type DragEvent, type ChangeEvent, type KeyboardEvent } from "react";

// ═══════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════

type VersionStatus = "Draft" | "Active" | "Deprecated";
type AssetKind = "Instance" | "Type";
type ChangeType = "added" | "modified" | "removed";
type ElementType = "Property" | "MultiLanguageProperty" | "SubmodelElementCollection" | "Operation" | "File" | "Blob" | "ReferenceElement";
type XsdValueType = "xs:string" | "xs:int" | "xs:double" | "xs:float" | "xs:boolean" | "xs:date" | "xs:dateTime" | "xs:long" | "xs:short" | "xs:byte" | "xs:anyURI" | "xs:duration" | "xs:decimal";
type PageId = "editor" | "lifecycle" | "server";
type EditorView = "list" | "graph";

interface ChangeDetail {
  type: ChangeType;
  target: string;
  name: string;
  desc: string;
}

interface AASVersion {
  version: string;
  revision: string;
  date: string;
  status: VersionStatus;
  author: string;
  changes: string;
  details: ChangeDetail[];
}

interface AASModel {
  id: string;
  idShort: string;
  assetId: string;
  description: string;
  assetKind: AssetKind;
  versions: AASVersion[];
}

interface SubmodelElementChild {
  idShort: string;
  type: ElementType;
  valueType?: XsdValueType;
  semanticId?: string;
  required: boolean;
}

interface SubmodelElement {
  idShort: string;
  type: ElementType;
  valueType?: XsdValueType;
  semanticId?: string;
  required: boolean;
  value?: string | Record<string, string>;
  contentType?: string;
  children?: SubmodelElementChild[];
}

interface SubmodelTemplate {
  id: string;
  idShort: string;
  semanticId: string;
  description: string;
  category: string;
  elements: SubmodelElement[];
}

interface ValidationFinding {
  path: string;
  msg: string;
  rule: string;
}

interface ValidationResult {
  errors: ValidationFinding[];
  warnings: ValidationFinding[];
  infos: ValidationFinding[];
  valid: boolean;
}

interface ChatMessage {
  role: "bot" | "user";
  text: string;
}

interface NodeType {
  type: string;
  icon: string;
  label: string;
}

// ═══════════════════════════════════
// MOCK DATABASE
// ═══════════════════════════════════
const MOCK_AAS_DB: AASModel[] = [
  {
    id: "aas-pump-001", idShort: "AAS_CentrifugalPump_CP200",
    assetId: "urn:mfr:siemens:pump:cp200:sn-44821",
    description: "Digital twin — Centrifugal Pump CP200 Line", assetKind: "Instance",
    versions: [
      { version:"3.0.0", revision:"A", date:"2026-03-10T14:22:00Z", status:"Draft", author:"M. Pistone",
        changes:"Aggiunto submodel PredictiveMaintenance con semanticId ECLASS",
        details:[
          {type:"added",target:"Submodel",name:"PredictiveMaintenance",desc:"Nuovo submodel manutenzione predittiva con HealthIndex e RUL"},
          {type:"added",target:"Property",name:"PredictiveMaintenance.HealthIndex",desc:"Indice salute asset (0-100)"},
          {type:"added",target:"Property",name:"PredictiveMaintenance.RemainingUsefulLife",desc:"Vita utile residua in ore"},
          {type:"added",target:"Collection",name:"PredictiveMaintenance.MaintenanceSchedule",desc:"Scheduling manutenzione"},
        ]},
      { version:"2.1.0", revision:"B", date:"2026-02-18T09:15:00Z", status:"Active", author:"M. Pistone",
        changes:"Aggiornato Nameplate con nuovi campi IEC 61360",
        details:[
          {type:"modified",target:"Property",name:"Nameplate.SerialNumber",desc:"Aggiunto semanticId ECLASS 0173-1#02-AAM556#002"},
          {type:"added",target:"Property",name:"Nameplate.BatchNumber",desc:"Numero lotto produzione"},
          {type:"modified",target:"Submodel",name:"Nameplate",desc:"Aggiornato semanticId a versione 2.0 IDTA"},
        ]},
      { version:"2.0.0", revision:"A", date:"2026-01-05T11:30:00Z", status:"Active", author:"M. Pistone",
        changes:"Ristrutturato Documentation submodel, aggiunto TechnicalData",
        details:[
          {type:"added",target:"Submodel",name:"TechnicalData",desc:"Nuovo submodel proprietà tecniche IEC 61360"},
          {type:"modified",target:"Submodel",name:"HandoverDocumentation",desc:"Ristrutturato con DocumentationCollection"},
          {type:"removed",target:"Property",name:"Documentation.LegacyField",desc:"Rimosso campo legacy non conforme"},
          {type:"added",target:"Collection",name:"TechnicalData.GeneralInformation",desc:"Info generali prodotto"},
          {type:"added",target:"Collection",name:"TechnicalData.TechnicalProperties",desc:"Proprietà tecniche ECLASS"},
        ]},
      { version:"1.0.0", revision:"C", date:"2025-10-20T16:45:00Z", status:"Deprecated", author:"M. Pistone",
        changes:"Release iniziale con Nameplate e Identification",
        details:[
          {type:"added",target:"Submodel",name:"Nameplate",desc:"Nameplate produttore IEC 61406"},
          {type:"added",target:"Submodel",name:"Identification",desc:"Identificazione asset ECLASS"},
          {type:"added",target:"Property",name:"Nameplate.ManufacturerName",desc:"Nome produttore"},
          {type:"added",target:"Property",name:"Nameplate.SerialNumber",desc:"Numero seriale"},
          {type:"added",target:"Property",name:"Identification.AssetId",desc:"ID univoco asset"},
        ]},
    ],
  },
  {
    id: "aas-robot-002", idShort: "AAS_IndustrialRobot_KR60",
    assetId: "urn:mfr:kuka:robot:kr60:sn-88412",
    description: "Digital twin — KUKA KR 60 HA", assetKind: "Instance",
    versions: [
      { version:"1.2.0", revision:"A", date:"2026-03-01T10:00:00Z", status:"Active", author:"L. Ferrara",
        changes:"Aggiunto OperationalData submodel",
        details:[
          {type:"added",target:"Submodel",name:"OperationalData",desc:"Dati operativi real-time"},
          {type:"added",target:"Property",name:"OperationalData.OperatingHours",desc:"Ore di funzionamento"},
          {type:"added",target:"Property",name:"OperationalData.CycleCount",desc:"Conteggio cicli"},
        ]},
      { version:"1.1.0", revision:"A", date:"2026-01-15T08:30:00Z", status:"Deprecated", author:"L. Ferrara",
        changes:"Aggiornato Documentation",
        details:[{type:"modified",target:"Submodel",name:"HandoverDocumentation",desc:"Aggiornato struttura documenti"}]},
      { version:"1.0.0", revision:"A", date:"2025-11-01T12:00:00Z", status:"Deprecated", author:"L. Ferrara",
        changes:"Prima versione",
        details:[
          {type:"added",target:"Submodel",name:"Nameplate",desc:"Nameplate KUKA"},
          {type:"added",target:"Submodel",name:"Identification",desc:"Identificazione robot"},
          {type:"added",target:"Submodel",name:"HandoverDocumentation",desc:"Documentazione tecnica"},
        ]},
    ],
  },
  {
    id: "aas-sensor-003", idShort: "AAS_TempSensor_TS400",
    assetId: "urn:mfr:bosch:sensor:ts400:sn-12093",
    description: "Digital twin — Bosch TS400 Temperature Sensor", assetKind: "Instance",
    versions: [
      { version:"2.0.0", revision:"A", date:"2026-02-28T15:20:00Z", status:"Active", author:"M. Pistone",
        changes:"Migrazione a AAS v3 metamodel",
        details:[
          {type:"modified",target:"Submodel",name:"Nameplate",desc:"Migrato a schema AAS v3"},
          {type:"modified",target:"Submodel",name:"TechnicalData",desc:"Allineato a IDTA template v1.2"},
          {type:"added",target:"Property",name:"TechnicalData.MeasurementRange",desc:"Range misurazione -40°C / +125°C"},
          {type:"removed",target:"Property",name:"TechnicalData.LegacyAccuracy",desc:"Sostituito con campo conforme IEC"},
        ]},
      { version:"1.0.0", revision:"B", date:"2025-09-10T09:00:00Z", status:"Deprecated", author:"M. Pistone",
        changes:"Release iniziale",
        details:[
          {type:"added",target:"Submodel",name:"Nameplate",desc:"Nameplate Bosch"},
          {type:"added",target:"Submodel",name:"TechnicalData",desc:"Dati tecnici sensore"},
        ]},
    ],
  },
  {
    id: "aas-conveyor-004", idShort: "AAS_ConveyorBelt_CB100",
    assetId: "urn:mfr:festo:conveyor:cb100:sn-55110",
    description: "Digital twin — Festo CB100 Conveyor Belt", assetKind: "Type",
    versions: [
      { version:"1.0.0", revision:"A", date:"2026-03-05T11:10:00Z", status:"Draft", author:"A. Rossi",
        changes:"Modello type iniziale",
        details:[
          {type:"added",target:"Submodel",name:"Nameplate",desc:"Nameplate Festo"},
          {type:"added",target:"Submodel",name:"TechnicalData",desc:"Specifiche tecniche nastro"},
          {type:"added",target:"Submodel",name:"BillOfMaterial",desc:"BOM componenti nastro"},
        ]},
    ],
  },
];

// ═══════════════════════════════════
// SUBMODEL CATALOG
// ═══════════════════════════════════
const SM_CAT: SubmodelTemplate[] = [
  { id:"smt-nameplate", idShort:"Nameplate", semanticId:"urn:idta:aas:submodel:Nameplate:1:0", description:"Identificazione produttore IEC 61406", category:"Identification", elements:[
    {idShort:"ManufacturerName",type:"MultiLanguageProperty",semanticId:"0173-1#02-AAO677#002",required:true},
    {idShort:"ManufacturerProductDesignation",type:"MultiLanguageProperty",semanticId:"0173-1#02-AAW338#001",required:true},
    {idShort:"SerialNumber",type:"Property",valueType:"xs:string",semanticId:"0173-1#02-AAM556#002",required:false},
    {idShort:"YearOfConstruction",type:"Property",valueType:"xs:string",semanticId:"0173-1#02-AAP906#001",required:false},
  ]},
  { id:"smt-identification", idShort:"Identification", semanticId:"urn:idta:aas:submodel:Identification:1:0", description:"Dati identificazione ECLASS", category:"Identification", elements:[
    {idShort:"ManufacturerId",type:"Property",valueType:"xs:string",semanticId:"0173-1#02-AAO677#002",required:true},
    {idShort:"AssetId",type:"Property",valueType:"xs:string",semanticId:"urn:idta:id:AssetId",required:true},
    {idShort:"ProductType",type:"Property",valueType:"xs:string",semanticId:"0173-1#02-AAO057#002",required:false},
  ]},
  { id:"smt-techdata", idShort:"TechnicalData", semanticId:"urn:idta:aas:submodel:TechnicalData:1:2", description:"Proprietà tecniche IEC 61360", category:"Technical", elements:[
    {idShort:"GeneralInformation",type:"SubmodelElementCollection",semanticId:"urn:idta:td:GeneralInfo",required:true,children:[
      {idShort:"ManufacturerName",type:"Property",valueType:"xs:string",required:true},
      {idShort:"ProductArticleNumber",type:"Property",valueType:"xs:string",required:false},
    ]},
    {idShort:"TechnicalProperties",type:"SubmodelElementCollection",semanticId:"urn:idta:td:TechProps",required:true,children:[]},
  ]},
  { id:"smt-documentation", idShort:"HandoverDocumentation", semanticId:"urn:idta:aas:submodel:HandoverDocumentation:1:2", description:"Documentazione tecnica", category:"Documentation", elements:[
    {idShort:"DocumentationCollection",type:"SubmodelElementCollection",semanticId:"urn:idta:doc:Collection",required:true,children:[
      {idShort:"DocumentId",type:"Property",valueType:"xs:string",required:true},
      {idShort:"DocumentTitle",type:"MultiLanguageProperty",required:true},
      {idShort:"DocumentFile",type:"File",required:true},
    ]},
  ]},
  { id:"smt-opdata", idShort:"OperationalData", semanticId:"urn:idta:aas:submodel:OperationalData:1:0", description:"Dati operativi real-time", category:"Operational", elements:[
    {idShort:"OperatingHours",type:"Property",valueType:"xs:double",semanticId:"0173-1#02-AAV184#001",required:false},
    {idShort:"CycleCount",type:"Property",valueType:"xs:int",semanticId:"urn:idta:op:CycleCount",required:false},
    {idShort:"CurrentTemperature",type:"Property",valueType:"xs:double",semanticId:"0173-1#02-AAV232#001",required:false},
  ]},
  { id:"smt-maintenance", idShort:"PredictiveMaintenance", semanticId:"urn:idta:aas:submodel:PredictiveMaintenance:1:0", description:"Manutenzione predittiva", category:"Maintenance", elements:[
    {idShort:"MaintenanceSchedule",type:"SubmodelElementCollection",semanticId:"urn:idta:pm:Schedule",required:true,children:[
      {idShort:"NextMaintenanceDate",type:"Property",valueType:"xs:date",required:true},
      {idShort:"MaintenanceInterval",type:"Property",valueType:"xs:duration",required:false},
    ]},
    {idShort:"RemainingUsefulLife",type:"Property",valueType:"xs:double",semanticId:"urn:idta:pm:RUL",required:false},
    {idShort:"HealthIndex",type:"Property",valueType:"xs:double",semanticId:"urn:idta:pm:HealthIndex",required:false},
  ]},
  { id:"smt-carbonfoot", idShort:"CarbonFootprint", semanticId:"urn:idta:aas:submodel:CarbonFootprint:1:0", description:"PCF Catena-X", category:"Sustainability", elements:[
    {idShort:"PCFCalculation",type:"SubmodelElementCollection",semanticId:"urn:idta:cf:PCF",required:true,children:[
      {idShort:"CO2EquivalentTotal",type:"Property",valueType:"xs:double",required:true},
      {idShort:"ReferenceUnit",type:"Property",valueType:"xs:string",required:true},
    ]},
  ]},
  { id:"smt-bom", idShort:"BillOfMaterial", semanticId:"urn:idta:aas:submodel:BOM:1:0", description:"Distinta base (BOM)", category:"Structure", elements:[
    {idShort:"BOMEntries",type:"SubmodelElementCollection",semanticId:"urn:idta:bom:Entries",required:true,children:[
      {idShort:"PartNumber",type:"Property",valueType:"xs:string",required:true},
      {idShort:"Quantity",type:"Property",valueType:"xs:int",required:true},
      {idShort:"PartReference",type:"ReferenceElement",required:false},
    ]},
  ]},
  { id:"smt-digital-nameplate", idShort:"DigitalNameplate", semanticId:"urn:idta:aas:submodel:DigitalNameplate:3:0", description:"Nameplate digitale IEC 61406-1", category:"Identification", elements:[
    {idShort:"URIOfTheProduct",type:"Property",valueType:"xs:anyURI",semanticId:"0173-1#02-AAY811#001",required:true},
    {idShort:"ManufacturerName",type:"MultiLanguageProperty",semanticId:"0173-1#02-AAO677#002",required:true},
    {idShort:"MarkingsCollection",type:"SubmodelElementCollection",required:false,children:[]},
  ]},
];

// ═══════════════════════
// VALIDATION ENGINE
// ═══════════════════════
function validateAAS(aas: { idShort: string; assetId: string }, sms: SubmodelTemplate[]): ValidationResult {
  const E: ValidationFinding[] = [], W: ValidationFinding[] = [], N: ValidationFinding[] = [];
  if (!aas.idShort?.trim()) E.push({ path: "AAS", msg: "idShort obbligatorio", rule: "AAS-001" });
  if (aas.idShort && !/^[a-zA-Z_]\w*$/.test(aas.idShort)) E.push({ path: "AAS.idShort", msg: `"${aas.idShort}" non valido`, rule: "AAS-002" });
  if (!aas.assetId?.trim()) E.push({ path: "AAS.assetId", msg: "globalAssetId obbligatorio", rule: "AAS-003" });
  if (aas.assetId && !aas.assetId.startsWith("urn:")) W.push({ path: "AAS.assetId", msg: "Formato URN raccomandato", rule: "W001" });
  if (!sms.length) W.push({ path: "AAS", msg: "Nessun submodel", rule: "W002" });
  const sIds = new Set<string>();
  sms.forEach((s, i) => {
    const p = `SM[${i}] "${s.idShort || "?"}"`;
    if (!s.idShort?.trim()) E.push({ path: p, msg: "idShort obbligatorio", rule: "SM-001" });
    if (s.idShort && !/^[a-zA-Z_]\w*$/.test(s.idShort)) E.push({ path: p, msg: "idShort non valido", rule: "SM-002" });
    if (sIds.has(s.idShort)) E.push({ path: p, msg: `"${s.idShort}" duplicato`, rule: "SM-003" });
    sIds.add(s.idShort);
    if (!s.semanticId?.trim()) W.push({ path: p, msg: "semanticId mancante", rule: "SW001" });
    if (!s.elements?.length) N.push({ path: p, msg: "Submodel vuoto", rule: "SI001" });
    const eIds = new Set<string>();
    (s.elements || []).forEach((el, ei) => {
      const ep = `${p} → ${el.idShort || `[${ei}]`}`;
      if (!el.idShort?.trim()) E.push({ path: ep, msg: "idShort obbligatorio", rule: "EL-001" });
      if (el.idShort && !/^[a-zA-Z_]\w*$/.test(el.idShort)) E.push({ path: ep, msg: "idShort non valido", rule: "EL-002" });
      if (eIds.has(el.idShort)) E.push({ path: ep, msg: `"${el.idShort}" duplicato`, rule: "EL-003" });
      eIds.add(el.idShort);
      if (el.type === "Property") {
        if (!el.valueType) E.push({ path: ep, msg: "valueType obbligatorio", rule: "EL-004" });
        const v = typeof el.value === "string" ? el.value : "";
        if (v !== undefined && v !== "") {
          if (el.valueType === "xs:int" && isNaN(parseInt(v))) E.push({ path: ep, msg: `"${v}" non intero`, rule: "EL-005" });
          if ((el.valueType === "xs:double" || el.valueType === "xs:float") && isNaN(parseFloat(v))) E.push({ path: ep, msg: `"${v}" non numero`, rule: "EL-006" });
          if (el.valueType === "xs:boolean" && !["true", "false", "0", "1"].includes(v.toLowerCase())) E.push({ path: ep, msg: `"${v}" non booleano`, rule: "EL-007" });
        }
      }
      if (!el.semanticId) N.push({ path: ep, msg: "semanticId mancante", rule: "EI001" });
      if (el.required && (el.value === undefined || el.value === "")) E.push({ path: ep, msg: "Campo required vuoto", rule: "EL-008" });
    });
  });
  return { errors: E, warnings: W, infos: N, valid: E.length === 0 };
}

// ═══════════════════════
// CHATBOT MOCK
// ═══════════════════════
const CR: Record<string, string> = {
  default: "Ciao! Sono l'assistente AAS. Posso aiutarti a trovare il submodel giusto.\n\nProva:\n• \"Quale submodel per manutenzione?\"\n• \"Cos'è ECLASS?\"\n• \"Submodel per carbon footprint\"",
  nameplate: "Per l'identificazione usa **Nameplate** (urn:idta:aas:submodel:Nameplate:1:0). Contiene ManufacturerName, SerialNumber, YearOfConstruction.\n\nPer il formato digitale con QR, usa **DigitalNameplate** v3.0.",
  maintenance: "Usa **PredictiveMaintenance**:\n• MaintenanceSchedule\n• RemainingUsefulLife\n• HealthIndex",
  technical: "Usa **TechnicalData** v1.2:\n• GeneralInformation\n• TechnicalProperties (ECLASS)",
  documentation: "Usa **HandoverDocumentation** v1.2 con DocumentId, DocumentTitle e DocumentFile.",
  carbon: "Usa **CarbonFootprint** (Catena-X):\n• CO2EquivalentTotal\n• ReferenceUnit",
  bom: "Usa **BillOfMaterial** con PartNumber, Quantity e PartReference.",
  operational: "Usa **OperationalData**:\n• OperatingHours\n• CycleCount\n• CurrentTemperature",
  eclass: "ECLASS: `0173-1#02-XXXYYY#ZZZ`\nCerca su eclass.eu per i codici esatti.",
  custom: "Per un custom:\n1. Definisci semanticId univoco\n2. Usa Collection per raggruppare\n3. Property per valori\n4. Parti da un template IDTA.",
};

function getCR(m: string): string {
  const l = m.toLowerCase();
  if (l.includes("nameplate") || l.includes("identificaz") || l.includes("serial")) return CR.nameplate;
  if (l.includes("mainten") || l.includes("manutenzione") || l.includes("predittiv")) return CR.maintenance;
  if (l.includes("tecnic") || l.includes("technical") || l.includes("specs")) return CR.technical;
  if (l.includes("document") || l.includes("manuale") || l.includes("handover")) return CR.documentation;
  if (l.includes("carbon") || l.includes("co2") || l.includes("pcf")) return CR.carbon;
  if (l.includes("bom") || l.includes("distinta") || l.includes("material")) return CR.bom;
  if (l.includes("operat") || l.includes("runtime") || l.includes("temperatur")) return CR.operational;
  if (l.includes("eclass") || l.includes("semantic") || l.includes("0173")) return CR.eclass;
  if (l.includes("custom") || l.includes("creare") || l.includes("personaliz")) return CR.custom;
  return "Non ho trovato un match. Prova:\n• \"submodel per manutenzione\"\n• \"come funziona ECLASS\"\n• \"dati operativi\"";
}

// ═══════════════════════
// ICONS
// ═══════════════════════
type IconFn = (s?: number, c?: string) => ReactNode;
const I: Record<string, IconFn> = {
  cube: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
  layers: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>,
  check: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  x: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  alert: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  info: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
  search: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  plus: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  send: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
  bot: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><line x1="12" y1="7" x2="12" y2="11" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>,
  trash: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  clock: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  git: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M6 21V9a9 9 0 0 0 9 9" /></svg>,
  server: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>,
  download: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  chev: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
  graph: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><circle cx="12" cy="12" r="2.5" /><line x1="8.2" y1="7.2" x2="10" y2="10.5" /><line x1="14" y1="10.5" x2="15.8" y2="7.2" /><line x1="10" y1="13.5" x2="8.2" y2="16.8" /><line x1="14" y1="13.5" x2="15.8" y2="16.8" /></svg>,
  list: (s = 16, c = "currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
};

// ══════════════════════════════
// HELPER: status colors
// ══════════════════════════════
const stC = (s: VersionStatus): string => s === "Active" ? "var(--green)" : s === "Draft" ? "var(--yellow)" : "var(--t4)";
const stB = (s: VersionStatus): string => s === "Active" ? "rgba(16,185,129,.1)" : s === "Draft" ? "rgba(245,166,35,.1)" : "rgba(100,100,100,.1)";

// ══════════════════════════════
// ADD DIALOG
// ══════════════════════════════
interface AddDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (sm: SubmodelTemplate) => void;
}

function AddDialog({ open, onClose, onAdd }: AddDialogProps): ReactNode {
  const [tab, setTab] = useState<"catalog" | "custom">("catalog");
  const [search, setSearch] = useState("");
  const [catF, setCatF] = useState("All");
  const [sel, setSel] = useState<string | null>(null);
  const [cust, setCust] = useState({ idShort: "", semanticId: "", description: "" });
  const [msgs, setMsgs] = useState<ChatMessage[]>([{ role: "bot", text: CR.default }]);
  const [ci, setCi] = useState("");
  const ce = useRef<HTMLDivElement>(null);
  useEffect(() => { ce.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  if (!open) return null;
  const cats = ["All", ...new Set(SM_CAT.map(s => s.category))];
  const fl = SM_CAT.filter(s => {
    const ms = !search || s.idShort.toLowerCase().includes(search.toLowerCase()) || s.semanticId.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
    return ms && (catF === "All" || s.category === catF);
  });
  const sc = () => { if (!ci.trim()) return; const u = ci.trim(); setMsgs(p => [...p, { role: "user", text: u }]); setCi(""); setTimeout(() => setMsgs(p => [...p, { role: "bot", text: getCR(u) }]), 400 + Math.random() * 600); };
  const doAdd = () => {
    if (tab === "catalog" && sel) { const t = SM_CAT.find(s => s.id === sel); if (t) onAdd({ ...t, elements: t.elements.map(e => ({ ...e, value: e.type === "MultiLanguageProperty" ? {} : "" })) }); }
    else if (tab === "custom" && cust.idShort.trim()) onAdd({ id: `c-${Date.now()}`, idShort: cust.idShort, semanticId: cust.semanticId || `urn:custom:${cust.idShort}:1:0`, description: cust.description, category: "Custom", elements: [] });
    onClose();
  };
  const canAdd = tab === "catalog" ? !!sel : !!cust.idShort.trim();
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn .2s" }}>
      <div style={{ background: "var(--s1)", border: "1px solid var(--bdr)", borderRadius: 16, width: "95%", maxWidth: 1100, height: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", animation: "slideUp .25s" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--bdr)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontSize: 17, fontWeight: 700, color: "var(--t1)" }}>Aggiungi Submodel</div><div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2, fontFamily: "var(--mono)" }}>Catalogo IDTA o custom</div></div>
          <button onClick={onClose} style={{ background: "var(--s3)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--t2)" }}>{I.x(16)}</button>
        </div>
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid var(--bdr)" }}>
            <div style={{ display: "flex", gap: 4, padding: "12px 20px", borderBottom: "1px solid var(--bdr)" }}>
              {(["catalog", "custom"] as const).map(k => <button key={k} onClick={() => setTab(k)} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: tab === k ? 600 : 400, background: tab === k ? "var(--acc)" : "transparent", color: tab === k ? "#fff" : "var(--t3)", border: "none", cursor: "pointer", fontFamily: "var(--sans)" }}>{k === "catalog" ? "Catalogo IDTA" : "Custom"}</button>)}
            </div>
            {tab === "catalog" ? (<div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "12px 20px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                  <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--t4)" }}>{I.search(14)}</div>
                  <input value={search} onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} placeholder="Cerca idShort, semanticId…" style={{ width: "100%", padding: "9px 12px 9px 34px", background: "var(--s2)", border: "1px solid var(--bdr)", borderRadius: 8, color: "var(--t1)", fontSize: 12, fontFamily: "var(--sans)", outline: "none" }} />
                </div>
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>{cats.map(c => <button key={c} onClick={() => setCatF(c)} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 10, fontWeight: catF === c ? 600 : 400, background: catF === c ? "var(--s4)" : "transparent", color: catF === c ? "var(--t1)" : "var(--t3)", border: `1px solid ${catF === c ? "var(--bdr2)" : "transparent"}`, cursor: "pointer", fontFamily: "var(--sans)" }}>{c}</button>)}</div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 16px" }}>
                {fl.map(sm => (
                  <div key={sm.id} onClick={() => setSel(sm.id)} style={{ padding: "14px 16px", marginBottom: 6, borderRadius: 10, border: `1.5px solid ${sel === sm.id ? "var(--acc)" : "var(--bdr)"}`, background: sel === sm.id ? "var(--acc-dim)" : "var(--s2)", cursor: "pointer", transition: "all .15s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><div><span style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{sm.idShort}</span><span style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--acc)", marginLeft: 8, background: "var(--acc-dim)", padding: "2px 6px", borderRadius: 4 }}>{sm.category}</span></div>{sel === sm.id && <div style={{ color: "var(--acc)" }}>{I.check(16)}</div>}</div>
                    <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 4 }}>{sm.description}</div>
                    <div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--t4)", marginTop: 6 }}>{sm.semanticId}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>{sm.elements.slice(0, 5).map(e => <span key={e.idShort} style={{ fontSize: 9, fontFamily: "var(--mono)", background: "var(--s3)", padding: "2px 6px", borderRadius: 4, color: "var(--t2)" }}>{e.idShort}</span>)}{sm.elements.length > 5 && <span style={{ fontSize: 9, color: "var(--t4)" }}>+{sm.elements.length - 5}</span>}</div>
                  </div>
                ))}
                {!fl.length && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--t4)", fontSize: 12 }}>Nessun risultato — chiedi al chatbot →</div>}
              </div>
            </div>) : (
              <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "var(--t3)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>idShort *</label><input value={cust.idShort} onChange={(e: ChangeEvent<HTMLInputElement>) => setCust(p => ({ ...p, idShort: e.target.value }))} placeholder="MyCustomSubmodel" style={{ width: "100%", padding: "10px 12px", background: "var(--s2)", border: "1px solid var(--bdr)", borderRadius: 8, color: "var(--t1)", fontSize: 13, fontFamily: "var(--mono)", outline: "none" }} /></div>
                <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "var(--t3)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>semanticId</label><input value={cust.semanticId} onChange={(e: ChangeEvent<HTMLInputElement>) => setCust(p => ({ ...p, semanticId: e.target.value }))} placeholder="urn:org:submodel:Name:1:0" style={{ width: "100%", padding: "10px 12px", background: "var(--s2)", border: "1px solid var(--bdr)", borderRadius: 8, color: "var(--t1)", fontSize: 13, fontFamily: "var(--mono)", outline: "none" }} /></div>
                <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "var(--t3)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Descrizione</label><textarea value={cust.description} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCust(p => ({ ...p, description: e.target.value }))} rows={3} style={{ width: "100%", padding: "10px 12px", background: "var(--s2)", border: "1px solid var(--bdr)", borderRadius: 8, color: "var(--t1)", fontSize: 12, fontFamily: "var(--sans)", outline: "none", resize: "vertical" }} /></div>
              </div>
            )}
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--bdr)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 12, background: "var(--s3)", color: "var(--t2)", border: "none", cursor: "pointer", fontFamily: "var(--sans)" }}>Annulla</button>
              <button onClick={doAdd} disabled={!canAdd} style={{ padding: "9px 24px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: canAdd ? "var(--acc)" : "var(--s4)", color: canAdd ? "#fff" : "var(--t4)", border: "none", cursor: canAdd ? "pointer" : "not-allowed", fontFamily: "var(--sans)" }}>Aggiungi</button>
            </div>
          </div>
          {/* CHATBOT */}
          <div style={{ width: 360, display: "flex", flexDirection: "column", background: "var(--s0)" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--bdr)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--acc-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--acc)" }}>{I.bot(15)}</div>
              <div><div style={{ fontSize: 12, fontWeight: 600, color: "var(--t1)" }}>AAS Assistant</div><div style={{ fontSize: 9, color: "var(--acc)", fontFamily: "var(--mono)" }}>online</div></div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {msgs.map((m, i) => <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}><div style={{ maxWidth: "88%", padding: "10px 14px", borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", background: m.role === "user" ? "var(--acc)" : "var(--s2)", color: m.role === "user" ? "#fff" : "var(--t1)", fontSize: 11, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.text.split("**").map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</div></div>)}
              <div ref={ce} />
            </div>
            <div style={{ padding: "12px 14px", borderTop: "1px solid var(--bdr)", display: "flex", gap: 6 }}>
              <input value={ci} onChange={(e: ChangeEvent<HTMLInputElement>) => setCi(e.target.value)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && sc()} placeholder="Chiedi aiuto…" style={{ flex: 1, padding: "9px 12px", background: "var(--s2)", border: "1px solid var(--bdr)", borderRadius: 8, color: "var(--t1)", fontSize: 11, fontFamily: "var(--sans)", outline: "none" }} />
              <button onClick={sc} style={{ width: 34, height: 34, borderRadius: 8, background: "var(--acc)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>{I.send(13)}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════
// VALIDATION PANEL
// ══════════════════════════════
interface ValPanelProps {
  res: ValidationResult | null;
  onClose: () => void;
}

function ValPanel({ res, onClose }: ValPanelProps): ReactNode {
  if (!res) return null;
  const { errors: E, warnings: W, infos: N, valid: V } = res;
  const t = E.length + W.length + N.length;
  const groups: [ValidationFinding[], string, string, IconFn][] = [[E, "Errori", "var(--red)", I.x], [W, "Warning", "var(--yellow)", I.alert], [N, "Info", "var(--blue)", I.info]];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--s1)", border: "1px solid var(--bdr)", borderRadius: 16, width: "90%", maxWidth: 720, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--bdr)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{V ? I.check(20, "var(--green)") : I.alert(20, "var(--red)")}<div><div style={{ fontSize: 16, fontWeight: 700, color: V ? "var(--green)" : "var(--red)" }}>{V ? "Validazione OK" : "Validazione fallita"}</div><div style={{ fontSize: 11, color: "var(--t3)", fontFamily: "var(--mono)" }}>{t} finding{t !== 1 ? "s" : ""}</div></div></div>
          <button onClick={onClose} style={{ background: "var(--s3)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--t2)" }}>{I.x(16)}</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {groups.map(([arr, lbl, col, icon]) => arr.length > 0 && (
            <div key={lbl} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: col, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{lbl} ({arr.length})</div>
              {arr.map((e, i) => <div key={i} style={{ display: "flex", gap: 8, padding: "10px 12px", marginBottom: 4, background: "var(--s2)", border: "1px solid var(--bdr)", borderRadius: 8 }}>
                <div style={{ color: col, flexShrink: 0, marginTop: 1 }}>{icon(13)}</div>
                <div><div style={{ fontSize: 11, fontWeight: 600, color: "var(--t1)" }}>{e.msg}</div><div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--t3)", marginTop: 2 }}>{e.path} · {e.rule}</div></div>
              </div>)}
            </div>
          ))}
          {t === 0 && <div style={{ textAlign: "center", padding: 40, color: "var(--t3)", fontSize: 12 }}>AAS conforme allo standard.</div>}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════
// GRAPH VIEW
// ══════════════════════════════
interface GraphViewProps {
  aasId: string;
  sms: SubmodelTemplate[];
}

function GraphView({ aasId, sms }: GraphViewProps): ReactNode {
  const W = 920;
  const maxEl = sms.reduce((a, s) => Math.max(a, (s.elements || []).length), 0);
  const H = Math.max(500, 120 + sms.length * 60 + maxEl * 38);
  const cx = W / 2, cy = 50;
  const n = sms.length;
  const sp = Math.min(210, (W - 120) / (n || 1));
  const sx0 = cx - (n - 1) * sp / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", minHeight: 460 }}>
      <defs>
        <filter id="gl"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <marker id="ar" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="#6366f1" opacity=".5" /></marker>
      </defs>
      <rect x={cx - 90} y={cy - 22} width={180} height={44} rx={10} fill="#1a2040" stroke="#6366f1" strokeWidth="2" filter="url(#gl)" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#6366f1" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">AAS</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#e8ecf2" fontSize="11" fontFamily="DM Sans" fontWeight="600">{aasId.replace("AAS_", "")}</text>
      {sms.map((sm, idx) => {
        const x = sx0 + idx * sp, y = 160;
        const ey0 = y + 55;
        return <g key={sm.id}>
          <line x1={cx} y1={cy + 22} x2={x} y2={y - 20} stroke="#6366f1" strokeWidth="1.5" opacity=".3" markerEnd="url(#ar)" />
          <rect x={x - 75} y={y - 20} width={150} height={40} rx={8} fill="#10291a" stroke="#10b981" strokeWidth="1.5" />
          <text x={x} y={y - 3} textAnchor="middle" fill="#10b981" fontSize="8" fontFamily="JetBrains Mono" fontWeight="600">SUBMODEL</text>
          <text x={x} y={y + 10} textAnchor="middle" fill="#e8ecf2" fontSize="10" fontFamily="DM Sans" fontWeight="600">{sm.idShort}</text>
          {(sm.elements || []).slice(0, 9).map((el, ei) => {
            const ey = ey0 + ei * 36;
            const c = el.type === "SubmodelElementCollection" ? "#f5a623" : el.type === "Operation" ? "#50a0ff" : "#a0aec0";
            const bg = el.type === "SubmodelElementCollection" ? "#291f10" : el.type === "Operation" ? "#0f1a2a" : "#151a22";
            const abbr = el.type === "Property" ? "P" : el.type === "SubmodelElementCollection" ? "C" : el.type === "MultiLanguageProperty" ? "MLP" : el.type === "File" ? "F" : "?";
            return <g key={ei}>
              <line x1={x} y1={y + 20} x2={x} y2={ey - 10} stroke={c} strokeWidth="1" opacity=".15" strokeDasharray={ei ? "3,3" : ""} />
              <rect x={x - 65} y={ey - 12} width={130} height={24} rx={6} fill={bg} stroke={c} strokeWidth="1" opacity=".8" />
              <text x={x - 53} y={ey + 2} fill={c} fontSize="7" fontFamily="JetBrains Mono" opacity=".7">{abbr}</text>
              <text x={x - 40} y={ey + 2} fill="#e8ecf2" fontSize="9" fontFamily="DM Sans">{el.idShort.length > 13 ? el.idShort.slice(0, 13) + "…" : el.idShort}</text>
              {el.required && <circle cx={x + 58} cy={ey} r={3} fill="#f05252" />}
            </g>;
          })}
          {(sm.elements || []).length > 9 && <text x={x} y={ey0 + 9 * 36 + 4} textAnchor="middle" fill="#3d4a5c" fontSize="9" fontFamily="JetBrains Mono">+{sm.elements.length - 9}</text>}
        </g>;
      })}
      {!sms.length && <text x={cx} y={cy + 80} textAnchor="middle" fill="#3d4a5c" fontSize="12" fontFamily="DM Sans">Nessun submodel</text>}
    </svg>
  );
}

// ══════════════════════════════
// LIFECYCLE PAGE
// ══════════════════════════════
interface LifecyclePageProps {
  model: AASModel;
}

function LifecyclePage({ model }: LifecyclePageProps): ReactNode {
  const [exp, setExp] = useState<Set<number>>(new Set([0]));
  const tog = (i: number) => setExp(p => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const ti: Record<ChangeType, string> = { added: "＋", modified: "✎", removed: "✕" };
  const tc: Record<ChangeType, string> = { added: "var(--green)", modified: "var(--yellow)", removed: "var(--red)" };
  const tb: Record<ChangeType, string> = { added: "rgba(16,185,129,.08)", modified: "rgba(245,166,35,.08)", removed: "rgba(240,82,82,.08)" };
  const all = model.versions.flatMap(v => v.details || []);
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--t1)", letterSpacing: "-.5px" }}>{model.idShort}</div>
          <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 4 }}>{model.description}</div>
          <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--t4)", marginTop: 4 }}>{model.assetId}</div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          {([["Versioni", model.versions.length, "var(--acc)"], ["Aggiunte", all.filter(d => d.type === "added").length, "var(--green)"], ["Modifiche", all.filter(d => d.type === "modified").length, "var(--yellow)"], ["Rimozioni", all.filter(d => d.type === "removed").length, "var(--red)"]] as [string, number, string][]).map(([l, v, c]) => (
            <div key={l} style={{ padding: "12px 18px", background: "var(--s1)", border: "1px solid var(--bdr)", borderRadius: 10, minWidth: 100 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: c, fontFamily: "var(--mono)" }}>{v}</div>
              <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ position: "relative", paddingLeft: 28 }}>
          <div style={{ position: "absolute", left: 10, top: 0, bottom: 0, width: 2, background: "var(--bdr)" }} />
          {model.versions.map((v, idx) => {
            const open = exp.has(idx);
            const sc2 = stC(v.status); const sb2 = stB(v.status);
            return (
              <div key={idx} style={{ position: "relative", marginBottom: open ? 24 : 12 }}>
                <div style={{ position: "absolute", left: -22, top: 16, width: 14, height: 14, borderRadius: "50%", background: sc2, border: "3px solid var(--s0)", zIndex: 2 }} />
                <div style={{ background: "var(--s1)", border: "1px solid var(--bdr)", borderRadius: 12, overflow: "hidden", cursor: "pointer" }} onClick={() => tog(idx)}>
                  <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--mono)", color: "var(--t1)" }}>v{v.version}</span>
                    <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--t4)" }}>rev {v.revision}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 10px", borderRadius: 5, background: sb2, color: sc2 }}>{v.status}</span>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--t3)" }}>{I.clock(12, "var(--t4)")}{new Date(v.date).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--t3)" }}>{v.author}</span>
                    <div style={{ transform: open ? "rotate(180deg)" : "", transition: "transform .2s", color: "var(--t3)" }}>{I.chev(14)}</div>
                  </div>
                  <div style={{ padding: "0 20px 14px", fontSize: 11, color: "var(--t2)" }}>{v.changes}</div>
                  {open && (v.details || []).length > 0 && (
                    <div style={{ borderTop: "1px solid var(--bdr)", padding: "16px 20px" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "var(--t4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Changelog dettagliato</div>
                      {(v.details || []).map((d, di) => (
                        <div key={di} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", marginBottom: 4, borderRadius: 8, background: tb[d.type] }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: tc[d.type], fontFamily: "var(--mono)", width: 16, textAlign: "center", flexShrink: 0 }}>{ti[d.type]}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 9, fontFamily: "var(--mono)", color: tc[d.type], background: "rgba(255,255,255,.05)", padding: "1px 6px", borderRadius: 3 }}>{d.target}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--mono)", color: "var(--t1)" }}>{d.name}</span>
                            </div>
                            <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 3 }}>{d.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════
// MAIN APP
// ══════════════════════════════════
const AASPlatform: React.FC = () => {
  const [page, setPage] = useState<PageId>("editor");
  const [mid, setMid] = useState<string>(MOCK_AAS_DB[0].id);
  const cm = MOCK_AAS_DB.find(m => m.id === mid) || MOCK_AAS_DB[0];
  const cv = cm.versions[0];

  const [ev, setEv] = useState<EditorView>("list");
  const [aid, setAid] = useState(cm.idShort);
  const [aai, setAai] = useState(cm.assetId);
  const [adesc, setAdesc] = useState(cm.description);
  const [sms, setSms] = useState<SubmodelTemplate[]>([
    { ...SM_CAT[0], elements: SM_CAT[0].elements.map(e => ({ ...e, value: e.type === "MultiLanguageProperty" ? {} : "" })) },
    { ...SM_CAT[2], elements: SM_CAT[2].elements.map(e => ({ ...e, value: e.type === "MultiLanguageProperty" ? {} : "" })) },
  ]);
  const [exSm, setExSm] = useState<Set<string>>(new Set([SM_CAT[0].id]));
  const [showAdd, setShowAdd] = useState(false);
  const [valRes, setValRes] = useState<ValidationResult | null>(null);
  const [dragO, setDragO] = useState(false);
  const [genR, setGenR] = useState(false);
  const [genD, setGenD] = useState(false);
  const [genP, setGenP] = useState<string[]>([]);
  const [genT, setGenT] = useState<"main" | "models" | "docker">("main");

  useEffect(() => { setAid(cm.idShort); setAai(cm.assetId); setAdesc(cm.description); }, [mid]);

  const doVal = () => setValRes(validateAAS({ idShort: aid, assetId: aai }, sms));
  const addSm = (sm: SubmodelTemplate) => { setSms(p => [...p, sm]); setExSm(p => new Set([...p, sm.id])); };
  const rmSm = (id: string) => setSms(p => p.filter(s => s.id !== id));
  const togSm = (id: string) => setExSm(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const upEl = (si: string, ei: number, f: string, v: string) => setSms(p => p.map(s => { if (s.id !== si) return s; const e = [...s.elements]; e[ei] = { ...e[ei], [f]: v }; return { ...s, elements: e }; }));

  const nodeTypes: NodeType[] = [{ type: "Submodel", icon: "🟩", label: "Submodel" }, { type: "Property", icon: "⬜", label: "Property" }, { type: "Collection", icon: "🟨", label: "Collection" }, { type: "Operation", icon: "🔷", label: "Operation" }, { type: "File", icon: "📎", label: "File/Blob" }];
  const onDS = (e: DragEvent<HTMLDivElement>, t: string) => e.dataTransfer.setData("nt", t);
  const onDr = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragO(false); if (e.dataTransfer.getData("nt") === "Submodel") setShowAdd(true); };

  const runGen = () => {
    setGenR(true); setGenD(false); setGenP([]);
    const steps = ["Parsing AAS metamodel…", "Generating Pydantic schemas…", "Creating route handlers…", "Building OpenAPI spec…", "Writing Dockerfile…", "Validating IDTA-01002-3-0…", "✓ Server generated"];
    steps.forEach((s, i) => setTimeout(() => { setGenP(p => [...p, s]); if (i === 6) { setGenR(false); setGenD(true); } }, (i + 1) * 500));
  };

  const XSD_TYPES: XsdValueType[] = ["xs:string", "xs:int", "xs:double", "xs:float", "xs:boolean", "xs:date", "xs:dateTime", "xs:anyURI", "xs:duration"];

  const cssVars: CSSProperties & Record<string, string> = {
    "--sans": "'DM Sans','Segoe UI',sans-serif", "--mono": "'JetBrains Mono','Fira Code',monospace",
    "--s0": "#0a0e14", "--s1": "#0f1319", "--s2": "#151a22", "--s3": "#1a2030", "--s4": "#222a3a",
    "--bdr": "#1e2738", "--bdr2": "#2a3548",
    "--t1": "#e8ecf2", "--t2": "#a0aec0", "--t3": "#6b7a8d", "--t4": "#3d4a5c",
    "--acc": "#6366f1", "--acc-dim": "rgba(99,102,241,.12)", "--acc2": "#10b981",
    "--green": "#10b981", "--red": "#f05252", "--yellow": "#f5a623", "--blue": "#50a0ff",
  };

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", fontFamily: "var(--sans)", color: "var(--t1)", background: "var(--s0)", overflow: "hidden", ...cssVars }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:var(--s4);border-radius:4px;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
        input::placeholder,textarea::placeholder{color:var(--t4);}
        .nb{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;font-size:12px;font-weight:500;cursor:pointer;border:none;font-family:var(--sans);transition:all .15s;width:100%;text-align:left;color:var(--t3);background:transparent;}
        .nb:hover{background:var(--s3);color:var(--t2);}.nb.act{background:var(--acc-dim);color:var(--acc);font-weight:600;}
        .smd{padding:8px 10px;background:var(--s2);border:1px solid var(--bdr);border-radius:8px;font-size:11px;cursor:grab;display:flex;align-items:center;gap:6px;transition:all .15s;user-select:none;}
        .smd:hover{background:var(--s3);border-color:var(--bdr2);}.smd:active{cursor:grabbing;}
        .dz{border:2px dashed var(--bdr);border-radius:12px;transition:all .2s;min-height:200px;}.dz.over{border-color:var(--acc);background:var(--acc-dim);}
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width: 250, borderRight: "1px solid var(--bdr)", background: "var(--s1)", display: "flex", flexDirection: "column", padding: 16, gap: 6 }}>
        <div style={{ padding: "8px 4px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,var(--acc),#818cf8)", display: "flex", alignItems: "center", justifyContent: "center" }}>{I.cube(17, "#fff")}</div>
          <div><div style={{ fontSize: 15, fontWeight: 800, color: "var(--t1)", letterSpacing: "-.5px" }}>AAS<span style={{ color: "var(--acc)" }}>Studio</span></div><div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--t4)" }}>v1.0 · IEC 63278</div></div>
        </div>
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--t4)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6, paddingLeft: 4 }}>Modello AAS</div>
          <select value={mid} onChange={(e: ChangeEvent<HTMLSelectElement>) => setMid(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: "var(--s2)", border: "1px solid var(--bdr)", borderRadius: 8, color: "var(--t1)", fontSize: 11, fontFamily: "var(--mono)", outline: "none", cursor: "pointer", appearance: "none" as const, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7a8d' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}>
            {MOCK_AAS_DB.map(m => <option key={m.id} value={m.id}>{m.idShort.replace("AAS_", "")}</option>)}
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, paddingLeft: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: stC(cv.status) }} />
            <span style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--t3)" }}>v{cv.version} · {cv.status} · {cm.assetKind}</span>
          </div>
        </div>
        <div style={{ height: 1, background: "var(--bdr)", margin: "4px 0" }} />
        <button className={`nb ${page === "editor" ? "act" : ""}`} onClick={() => setPage("editor")}>{I.layers(15)} Editor</button>
        <button className={`nb ${page === "lifecycle" ? "act" : ""}`} onClick={() => setPage("lifecycle")}>{I.git(15)} AAS Lifecycle</button>
        <button className={`nb ${page === "server" ? "act" : ""}`} onClick={() => setPage("server")}>{I.server(15)} Server Gen</button>
        {page === "editor" && (<>
          <div style={{ height: 1, background: "var(--bdr)", margin: "8px 0" }} />
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--t4)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6, paddingLeft: 4 }}>Drag & Drop</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {nodeTypes.map(n => <div key={n.type} className="smd" draggable onDragStart={(e: DragEvent<HTMLDivElement>) => onDS(e, n.type)}><span style={{ fontSize: 13 }}>{n.icon}</span><span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t2)" }}>{n.label}</span></div>)}
          </div>
        </>)}
        <div style={{ flex: 1 }} />
        <div style={{ padding: 10, background: "var(--s2)", borderRadius: 10, border: "1px solid var(--bdr)" }}>
          <div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--t4)" }}>Submodels: <span style={{ color: "var(--acc)" }}>{sms.length}</span> · Props: <span style={{ color: "var(--acc)" }}>{sms.flatMap(s => s.elements).filter(e => e.type === "Property").length}</span></div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {page === "editor" && (<>
          <div style={{ padding: "10px 24px", borderBottom: "1px solid var(--bdr)", display: "flex", alignItems: "center", gap: 12, background: "var(--s1)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>{cm.idShort}</div>
            <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 10px", borderRadius: 5, background: stB(cv.status), color: stC(cv.status) }}>{cv.status} v{cv.version}</span>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", background: "var(--s2)", borderRadius: 8, border: "1px solid var(--bdr)", overflow: "hidden" }}>
              {(["list", "graph"] as const).map(k => <button key={k} onClick={() => setEv(k)} style={{ padding: "6px 14px", fontSize: 11, fontWeight: ev === k ? 600 : 400, background: ev === k ? "var(--s4)" : "transparent", color: ev === k ? "var(--t1)" : "var(--t3)", border: "none", cursor: "pointer", fontFamily: "var(--sans)", display: "flex", alignItems: "center", gap: 5 }}>{k === "list" ? I.list(13) : I.graph(13)} {k === "list" ? "Lista" : "Grafo"}</button>)}
            </div>
            <button onClick={doVal} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "var(--acc2)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--sans)", display: "flex", alignItems: "center", gap: 6 }}>{I.check(13)} Validate</button>
            <button style={{ padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "var(--acc)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--sans)", display: "flex", alignItems: "center", gap: 6 }}>{I.download(13)} Export AASX</button>
          </div>
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div style={{ width: 280, borderRight: "1px solid var(--bdr)", background: "var(--s1)", overflowY: "auto", padding: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--t4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>AAS Properties</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {([["idShort", aid, setAid, "var(--mono)"], ["globalAssetId", aai, setAai, "var(--mono)"], ["description", adesc, setAdesc, "var(--sans)"]] as [string, string, (v: string) => void, string][]).map(([l, v, fn, ff]) => <div key={l}><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "var(--t3)", marginBottom: 4 }}>{l}</label>{l === "description" ? <textarea value={v} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => fn(e.target.value)} rows={2} style={{ width: "100%", padding: "8px 10px", background: "var(--s2)", border: "1px solid var(--bdr)", borderRadius: 6, color: "var(--t1)", fontSize: 11, fontFamily: ff, outline: "none", resize: "vertical" }} /> : <input value={v} onChange={(e: ChangeEvent<HTMLInputElement>) => fn(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: "var(--s2)", border: "1px solid var(--bdr)", borderRadius: 6, color: "var(--t1)", fontSize: 11, fontFamily: ff, outline: "none" }} />}</div>)}
                <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "var(--t3)", marginBottom: 4 }}>assetKind</label><div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--t2)", padding: "8px 10px", background: "var(--s2)", border: "1px solid var(--bdr)", borderRadius: 6 }}>{cm.assetKind}</div></div>
              </div>
              <div style={{ marginTop: 20, padding: 12, background: "var(--s2)", borderRadius: 10, border: "1px solid var(--bdr)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--t4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Stats</div>
                {([["Submodels", sms.length], ["Properties", sms.flatMap(s => s.elements).filter(e => e.type === "Property").length], ["Collections", sms.flatMap(s => s.elements).filter(e => e.type === "SubmodelElementCollection").length]] as [string, number][]).map(([k, v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--t3)" }}>{k}</span><span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--acc)" }}>{v}</span></div>)}
              </div>
            </div>
            <div className={`dz ${dragO ? "over" : ""}`} style={{ flex: 1, overflowY: "auto", padding: 24, background: "var(--s0)" }} onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragO(true); }} onDragLeave={() => setDragO(false)} onDrop={onDr}>
              {ev === "graph" ? <GraphView aasId={aid} sms={sms} /> : (<>
                {!sms.length && !dragO && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--t4)" }}><div style={{ fontSize: 40, marginBottom: 12 }}>🟩</div><div style={{ fontSize: 13, fontWeight: 500 }}>Trascina un Submodel qui</div><div style={{ fontSize: 10, fontFamily: "var(--mono)", marginTop: 4 }}>oppure clicca + sotto</div></div>}
                {sms.map(sm => (
                  <div key={sm.id} style={{ marginBottom: 12, background: "var(--s1)", border: "1px solid var(--bdr)", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", borderBottom: exSm.has(sm.id) ? "1px solid var(--bdr)" : "none" }} onClick={() => togSm(sm.id)}>
                      <span style={{ fontSize: 14 }}>🟩</span>
                      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{sm.idShort}</div><div style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--t3)" }}>{sm.semanticId}</div></div>
                      <span style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--acc)", background: "var(--acc-dim)", padding: "2px 8px", borderRadius: 4 }}>{sm.elements?.length || 0} el</span>
                      <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); rmSm(sm.id); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--t4)", padding: 4 }}>{I.trash(13)}</button>
                      <div style={{ transform: exSm.has(sm.id) ? "rotate(180deg)" : "", transition: "transform .2s", color: "var(--t3)" }}>{I.chev(14)}</div>
                    </div>
                    {exSm.has(sm.id) && <div style={{ padding: "12px 18px" }}>
                      {(sm.elements || []).map((el, ei) => (
                        <div key={ei} style={{ padding: "10px 14px", marginBottom: 6, background: "var(--s2)", border: "1px solid var(--bdr)", borderRadius: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 9, fontFamily: "var(--mono)", color: el.type === "Property" ? "var(--t2)" : el.type === "SubmodelElementCollection" ? "var(--yellow)" : "var(--blue)", background: el.type === "Property" ? "var(--s3)" : el.type === "SubmodelElementCollection" ? "rgba(245,166,35,.1)" : "rgba(80,160,255,.1)", padding: "2px 6px", borderRadius: 4 }}>{el.type}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--mono)", color: "var(--t1)" }}>{el.idShort}</span>
                            {el.required && <span style={{ fontSize: 8, color: "var(--red)", fontWeight: 700 }}>REQ</span>}
                            <div style={{ flex: 1 }} />{el.semanticId && <span style={{ fontSize: 8, fontFamily: "var(--mono)", color: "var(--t4)" }}>{el.semanticId}</span>}
                          </div>
                          {el.type === "Property" && <div style={{ display: "flex", gap: 8 }}>
                            <input value={typeof el.value === "string" ? el.value : ""} onChange={(e: ChangeEvent<HTMLInputElement>) => upEl(sm.id, ei, "value", e.target.value)} placeholder={`valore (${el.valueType || "string"})…`} style={{ flex: 1, padding: "6px 8px", background: "var(--s3)", border: "1px solid var(--bdr)", borderRadius: 5, color: "var(--t1)", fontSize: 10, fontFamily: "var(--mono)", outline: "none" }} />
                            <select value={el.valueType || "xs:string"} onChange={(e: ChangeEvent<HTMLSelectElement>) => upEl(sm.id, ei, "valueType", e.target.value)} style={{ padding: "6px 8px", background: "var(--s3)", border: "1px solid var(--bdr)", borderRadius: 5, color: "var(--t2)", fontSize: 10, fontFamily: "var(--mono)", outline: "none" }}>
                              {XSD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>}
                          {el.type === "SubmodelElementCollection" && el.children && <div style={{ marginTop: 6, paddingLeft: 12, borderLeft: "2px solid var(--bdr)" }}>
                            {el.children.map((ch, ci2) => <div key={ci2} style={{ padding: "4px 0", fontSize: 9, fontFamily: "var(--mono)", color: "var(--t3)" }}><span style={{ color: "var(--t2)" }}>{ch.idShort}</span> : {ch.type}{ch.required && <span style={{ color: "var(--red)" }}> *</span>}</div>)}
                          </div>}
                        </div>
                      ))}
                      {!(sm.elements || []).length && <div style={{ textAlign: "center", padding: "20px 0", color: "var(--t4)", fontSize: 11, fontFamily: "var(--mono)" }}>Submodel vuoto</div>}
                    </div>}
                  </div>
                ))}
                <div onClick={() => setShowAdd(true)} style={{ padding: 16, border: "2px dashed var(--bdr)", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--t4)", marginTop: 8 }}>{I.plus(14)}<span style={{ fontSize: 11, fontFamily: "var(--mono)" }}>Aggiungi Submodel</span></div>
              </>)}
            </div>
          </div>
        </>)}

        {page === "lifecycle" && <LifecyclePage model={cm} />}

        {page === "server" && (
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            <div style={{ width: 296, borderRight: "1px solid var(--bdr)", background: "var(--s1)", display: "flex", flexDirection: "column", padding: 18, gap: 14, overflowY: "auto" }}>
              <div><div style={{ fontSize: 15, fontWeight: 500, color: "var(--t1)", marginBottom: 3 }}>Server Generator</div><div style={{ fontSize: 11, color: "var(--t3)", fontFamily: "var(--mono)" }}>FastAPI · IDTA-01002-3-0</div></div>
              <div style={{ background: "var(--s2)", border: "1px solid var(--bdr)", borderRadius: 10, padding: "13px 14px" }}>
                <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 9 }}>source shell</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--t1)", marginBottom: 3 }}>{aid}</div>
                {([["submodels", sms.length], ["properties", sms.flatMap(s => s.elements).filter(e => e.type === "Property").length], ["operations", sms.flatMap(s => s.elements).filter(e => e.type === "Operation").length]] as [string, number][]).map(([k, v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--t3)" }}>{k}</span><span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--acc)" }}>{v}</span></div>)}
              </div>
              <button onClick={runGen} disabled={genR} style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 500, padding: 11, borderRadius: 9, border: "none", background: genR ? "var(--s4)" : "var(--acc)", color: genR ? "var(--t3)" : "#fff", cursor: genR ? "not-allowed" : "pointer" }}>
                {genR ? "generating…" : genD ? "↺ regenerate" : "⚡ generate server"}
              </button>
              {(genR || genD) && <div style={{ background: "var(--s2)", border: "1px solid var(--bdr)", borderRadius: 10, padding: "13px 14px", display: "flex", flexDirection: "column", gap: 5 }}>
                {genP.map((p, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10, fontFamily: "var(--mono)", color: i === genP.length - 1 && genD ? "var(--acc2)" : "var(--t2)" }}><div style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: i === genP.length - 1 && genD ? "var(--acc2)" : "var(--t4)" }} />{p}</div>)}
              </div>}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "10px 18px", borderBottom: "1px solid var(--bdr)", display: "flex", gap: 4 }}>
                {(["main", "models", "docker"] as const).map(t => <button key={t} onClick={() => setGenT(t)} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: genT === t ? 600 : 400, background: genT === t ? "var(--s3)" : "transparent", color: genT === t ? "var(--t1)" : "var(--t3)", border: "none", cursor: "pointer", fontFamily: "var(--mono)" }}>{t === "main" ? "main.py" : t === "models" ? "models.py" : "Dockerfile"}</button>)}
              </div>
              <div style={{ flex: 1, padding: 20, overflowY: "auto", background: "var(--s0)" }}>
                {!genD ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--t4)", fontSize: 12, fontFamily: "var(--mono)" }}>Clicca "generate server" per iniziare</div> : (
                  <pre style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--t2)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
{genT === "main" ? `# Auto-generated AAS Server — ${aid}
# IDTA-01002-3-0 compliant

from fastapi import FastAPI, HTTPException
from models import *

app = FastAPI(
    title="${aid} AAS Server",
    version="${cv.version}",
    description="Generated by AASStudio"
)

@app.get("/shells/{aas_id}")
async def get_shell(aas_id: str):
    return {"idShort": "${aid}", "id": aas_id, "assetKind": "${cm.assetKind}"}

@app.get("/shells/{aas_id}/submodels")
async def list_submodels(aas_id: str):
    return [${sms.map(s => `"${s.idShort}"`).join(", ")}]
${sms.map(s => `
@app.get("/submodels/${s.idShort}")
async def get_${s.idShort.toLowerCase()}():
    """${s.description || s.idShort}"""
    return ${s.idShort}Model()

@app.put("/submodels/${s.idShort}")
async def update_${s.idShort.toLowerCase()}(data: ${s.idShort}Model):
    return {"status": "updated", "submodel": "${s.idShort}"}
`).join("")}
@app.get("/health")
async def health():
    return {"status": "ok", "version": "${cv.version}"}
` : genT === "models" ? `from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
${sms.map(s => `
class ${s.idShort}Model(BaseModel):
${(s.elements || []).filter(e => e.type === "Property").map(e => `    ${e.idShort}: ${e.valueType === "xs:int" ? "int" : e.valueType === "xs:double" || e.valueType === "xs:float" ? "float" : e.valueType === "xs:boolean" ? "bool" : e.valueType === "xs:date" ? "date" : "str"}${e.required ? "" : " = None"}`).join("\n") || "    pass"}
`).join("")}` : `FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <AddDialog open={showAdd} onClose={() => setShowAdd(false)} onAdd={addSm} />
      <ValPanel res={valRes} onClose={() => setValRes(null)} />
    </div>
  );
};

export default AASPlatform;
