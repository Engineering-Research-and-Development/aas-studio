import * as AasJsonization from '@aas-core-works/aas-core3.1-typescript/jsonization';
import * as AasVerification from '@aas-core-works/aas-core3.1-typescript/verification';
import { ValidationFinding, SubmodelTemplate, SubmodelElement, AssetKind } from '@/context/AASContext';
import { buildAasEnvironment } from '@/utils/aas-builder';

// aas-core path segment: PropertySegment ({ name }) or IndexSegment ({ index }).
type Seg = { name?: string; index?: number };

// aas-core container properties that hold child elements, with the same step
// labels validateAAS (AASContext) uses, so both validators speak one path
// convention: plain "→ idShort" for SEC/SEL children, "→ stmt X" etc. for the
// groups the editor doesn't render as rows.
const NESTED_LABEL: Record<string, string> = {
  value: '',
  statements: 'stmt ',
  annotations: 'ann ',
  inputVariables: 'in ',
  outputVariables: 'out ',
  inoutputVariables: 'inout ',
};

function childrenOf(el: SubmodelElement, segName: string): SubmodelElement[] | undefined {
  switch (segName) {
    case 'value': return el.children;
    case 'statements': return el.statements;
    case 'annotations': return el.annotations;
    case 'inputVariables': return el.inputVariables;
    case 'outputVariables': return el.outputVariables;
    case 'inoutputVariables': return el.inoutputVariables;
    default: return undefined;
  }
}

// Map an aas-core verification path to the editor's `SM[i] "idShort" → el → child`
// convention so inline highlighting finds the exact row, however deep. Built env
// preserves editor order at every level (children/statements/… are mapped 1:1),
// so env indices address the same elements as editor indices.
function mapPath(segments: Seg[], submodels: SubmodelTemplate[]): string {
  let k = 0;
  let smIdx: number | null = null;
  for (; k < segments.length; k++) {
    const seg = segments[k];
    const next = segments[k + 1];
    if (seg.name === 'submodels' && next && typeof next.index === 'number') {
      smIdx = next.index;
      k += 2;
      break;
    }
  }
  if (smIdx === null) return 'AAS';
  const sm = submodels[smIdx];
  let path = `SM[${smIdx}] "${sm?.idShort || '?'}"`;

  let current: SubmodelElement | undefined;
  for (; k < segments.length; k++) {
    const seg = segments[k];
    const next = segments[k + 1];
    if (seg.name === 'submodelElements' && next && typeof next.index === 'number') {
      current = sm?.elements?.[next.index];
      path += ` → ${current?.idShort || `[${next.index}]`}`;
      k += 2;
      break;
    }
  }
  if (!current) return path;

  // Descend the remaining container segments (value[i], statements[i], …) so the
  // finding lands on the nested element instead of the whole top-level collection.
  // A trailing name-only segment (e.g. Property.value the field) has no index and
  // stops the walk, which is what we want: the finding belongs to the element.
  while (k + 1 < segments.length) {
    const name = segments[k].name;
    const next = segments[k + 1];
    if (name === undefined || !(name in NESTED_LABEL) || typeof next.index !== 'number') break;
    const child: SubmodelElement | undefined = childrenOf(current, name)?.[next.index];
    path += ` → ${NESTED_LABEL[name]}${child?.idShort || `[${next.index}]`}`;
    k += 2;
    // Operation variables wrap their element: inputVariables[i].value.<…> — skip
    // the wrapper's `value` step, the editor row is the element itself.
    if (name.endsWith('Variables') && segments[k]?.name === 'value') k += 1;
    if (!child) break;
    current = child;
  }
  return path;
}

// Run IDTA aas-core3.1 metamodel verification on the built env, returning findings
// in the editor's ValidationFinding shape.
export function verifyWithLibrary(
  aasIdShort: string,
  aasAssetId: string,
  aasDescription: string,
  assetKind: AssetKind,
  submodels: SubmodelTemplate[]
): ValidationFinding[] {
  try {
    const env = buildAasEnvironment(aasIdShort, aasAssetId, aasDescription, assetKind, submodels);
    // Drop undefined keys: aas-core reads a present-but-undefined key as an invalid
    // value and fails deserialization. JSON round-trip = what a serialized file looks like.
    const clean = JSON.parse(JSON.stringify(env));
    const envResult = AasJsonization.environmentFromJsonable(clean);
    if (envResult.error !== null) {
      return [{ path: 'AAS', msg: `Deserializzazione fallita: ${envResult.error.message}`, rule: 'IDTA-DESERIALIZE' }];
    }
    if (!envResult.value) return [];
    const findings: ValidationFinding[] = [];
    for (const err of AasVerification.verify(envResult.value)) {
      findings.push({ path: mapPath(err.path.segments as Seg[], submodels), msg: err.message, rule: 'IDTA' });
    }
    return findings;
  } catch (e) {
    return [{ path: 'AAS', msg: `Verifica IDTA fallita: ${e instanceof Error ? e.message : String(e)}`, rule: 'IDTA-ERROR' }];
  }
}
