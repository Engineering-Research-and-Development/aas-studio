// ─────────────────────────────────────────────────────────────────────────────
// IDTA catalog client — shared by AddSubmodelDialog (browse/add a submodel) and
// AddEntityDialog (PDF import target selection). Lists the published templates
// of admin-shell-io/submodel-templates via the backend (/v1/idta/catalog,
// Redis-cached) and downloads/maps individual template JSONs from GitHub raw.
//
// Both caches are module-level so they survive dialog unmounts; a forced
// refresh clears them via clearCatalogCaches().
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type { SubmodelTemplate } from '@/context/AASContext';
import { extractSemanticId, mapElement } from '@/utils/aas-mapper';
import { registerTemplate } from '@/utils/template-registry';

export const RAW_BASE =
  'https://raw.githubusercontent.com/admin-shell-io/submodel-templates/main/';

export interface CatalogEntry {
  id: string;
  name: string;
  version: string;
  idtaCode: string;
  fileType: 'Template' | 'Example' | 'Sample' | 'Generic';
  metamodel: string;  // e.g. "3.0", "3.1" — extensible for future versions
  path: string;
  downloadUrl: string;
  category: string;
  thumbnailUrl?: string; // template cover from the repo's docs images, when present
}

let catalogCache: CatalogEntry[] | null = null;

// Fetched templates by entry id, so preview + add don't re-download.
const templateCache = new Map<string, SubmodelTemplate>();

export function getCachedCatalog(): CatalogEntry[] | null {
  return catalogCache;
}

/** Drop both module caches (used by the forced GitHub refresh). */
export function clearCatalogCaches(): void {
  catalogCache = null;
  templateCache.clear();
}

export function deriveCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('nameplate') || n.includes('identification')) return 'Identification';
  if (n.includes('technical data')) return 'Technical';
  if (n.includes('document') || n.includes('handover')) return 'Documentation';
  if (n.includes('maintenance') || n.includes('service')) return 'Maintenance';
  if (n.includes('carbon') || n.includes('footprint') || n.includes('passport') || n.includes('sustainability')) return 'Sustainability';
  if (n.includes('bill of') || n.includes('bom') || n.includes('hierarchy')) return 'Structure';
  if (n.includes('time series') || n.includes('operational')) return 'Operational';
  if (n.includes('artificial') || n.includes('machine learning')) return 'AI';
  if (n.includes('asset interface') || n.includes('connectivity')) return 'Connectivity';
  if (n.includes('safety') || n.includes('alarm')) return 'Safety';
  return 'Other';
}

export function parseEntry(path: string): CatalogEntry | null {
  // published/[Name]/[Major]/[Minor]/([Patch]/)?[filename].json
  const rel = path.replace('published/', '');
  const parts = rel.split('/');
  if (parts.length < 3) return null;

  const name = parts[0];
  const filename = parts[parts.length - 1];
  const versionParts = parts.slice(1, parts.length - 1);
  const version = versionParts.join('.');

  const idtaMatch = filename.match(/IDTA[- ](\d+)/i);
  const idtaCode = idtaMatch ? `IDTA ${idtaMatch[1]}` : '';

  // Repo naming is inconsistent: the separators around the kind token vary
  // (`_Template_`, `-Template-`, ` Template_`, `_Template `). Match it between
  // any of -, _ or space so e.g. the OPC UA Server Datasheet
  // (…-Template-OPCUA…) isn't misfiled as Generic and hidden by the filter.
  // "without_examplevalues" must NOT count as Example — it's the blank template.
  let fileType: CatalogEntry['fileType'] = 'Generic';
  if (/[-_ ]Example[-_ ]/i.test(filename)) fileType = 'Example';
  else if (/[-_ ]Sample[-_ ]/i.test(filename)) fileType = 'Sample';
  else if (/[-_ ]Template[-_ ]/i.test(filename)) fileType = 'Template';

  // Extract metamodel version from suffix, e.g. "forAASMetamodelV3.1" → "3.1"
  const metamodelMatch = filename.match(/forAASMetamodelV(\d+(?:[._]\d+)*)/i);
  const metamodel = metamodelMatch ? metamodelMatch[1].replace('_', '.') : '3.0';

  return {
    id: `${name}__${version}__${fileType}__mm${metamodel}`,
    name,
    version,
    idtaCode,
    fileType,
    metamodel,
    path,
    downloadUrl: RAW_BASE + path,
    category: deriveCategory(name),
  };
}

export async function fetchCatalog(api: AxiosInstance): Promise<CatalogEntry[]> {
  if (catalogCache) return catalogCache;

  // v2 payload is { paths, images }; a plain array means an older API.
  const { data } = await api.get<{ data: string[] | { paths: string[]; images?: string[] } }>('/v1/idta/catalog');
  const raw = data.data;
  const paths: string[] = Array.isArray(raw) ? raw : raw?.paths ?? [];
  const images: string[] = Array.isArray(raw) ? [] : raw?.images ?? [];

  // One cover per version folder: the docs image named like "…cover…"
  // (e.g. SMT-template-cover.svg), skipping the shared IDTA logos.
  const coverByDir = new Map<string, string>();
  for (const img of images) {
    const docsIdx = img.indexOf('/docs/');
    if (docsIdx < 0) continue;
    const name = img.slice(img.lastIndexOf('/') + 1);
    if (!/cover/i.test(name) || /logo/i.test(name)) continue;
    const dir = img.slice(0, docsIdx);
    if (!coverByDir.has(dir)) coverByDir.set(dir, img);
  }

  const entries: CatalogEntry[] = [];
  for (const p of paths) {
    const entry = parseEntry(p);
    if (entry) {
      const cover = coverByDir.get(p.slice(0, p.lastIndexOf('/')));
      if (cover) entry.thumbnailUrl = RAW_BASE + cover;
      entries.push(entry);
    }
  }

  entries.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
  catalogCache = entries;
  return entries;
}

export async function fetchSubmodelTemplate(entry: CatalogEntry): Promise<SubmodelTemplate> {
  const cached = templateCache.get(entry.id);
  if (cached) return cached;

  const res = await fetch(entry.downloadUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json() as Record<string, unknown>;

  // IDTA JSON files are wrapped: { assetAdministrationShells, submodels: [...], conceptDescriptions }
  const submodelsArr = json.submodels as Array<Record<string, unknown>> | undefined;
  const submodel: Record<string, unknown> = submodelsArr?.[0] ?? json;

  const semanticId =
    extractSemanticId(submodel.semanticId) || String(submodel.id ?? entry.downloadUrl);
  const elements = (Array.isArray(submodel.submodelElements) ? submodel.submodelElements : []).map(mapElement);

  const template: SubmodelTemplate = {
    id: semanticId,
    idShort: String(submodel.idShort ?? entry.name),
    semanticId,
    description: `${entry.name} v${entry.version}`,
    category: entry.category,
    elements,
  };
  templateCache.set(entry.id, template);
  // Feed the validation registry: mandatory template elements can now be
  // cross-checked against working copies with the same semanticId.
  registerTemplate(template);
  return template;
}
