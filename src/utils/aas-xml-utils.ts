const WRAPPER_TO_ARRAY = new Set([
  'extensions',
  'assetAdministrationShells',
  'submodels',
  'conceptDescriptions',
  'submodelElements',
  'inputVariables',
  'outputVariables',
  'inoutputVariables',
  'qualifiers',
  'displayName',
  'description',
  'keys',
  'specificAssetIds',
  'statements',
  'annotations',
  'values',
  'embeddedDataSpecifications',
  'supplementalSemanticIds',
  'dataSpecifications',
]);

const BOOLEAN_PROPS = new Set(['ordered', 'allowDuplicates']);
const NUMBER_PROPS = new Set(['index']);

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function xmlNodeToJson(node: Element | Document): any {
  if (!('localName' in node)) return {};
  const tagName = node.localName;
  if (!tagName) return {};

  const obj: Record<string, unknown> = {};

  if (node.attributes) {
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      let name = attr.name;
      if (name === 'idType' && (tagName === 'key' || tagName === 'Key')) {
        name = 'type';
      }
      if (name === 'lang') {
        name = 'language';
      }
      obj[name] = attr.value;
    }
  }

  if (tagName === 'value') {
    if (node.children.length > 0) {
      const items = [];
      for (let i = 0; i < node.children.length; i++) {
        const itemNode = node.children[i];
        const itemJson = xmlNodeToJson(itemNode);
        if (typeof itemJson === 'object' && itemJson !== null) {
          itemJson.modelType = capitalize(itemNode.localName || '');
        }
        items.push(itemJson);
      }
      return items;
    }
    return node.textContent?.trim();
  }

  if (node.children.length === 0) {
    const text = node.textContent?.trim() || '';
    if (tagName === 'langString' || tagName === 'LangString') {
      obj['text'] = text;
      return obj;
    }
    if (!node.attributes || node.attributes.length === 0) {
      if (BOOLEAN_PROPS.has(tagName)) return text === 'true';
      if (NUMBER_PROPS.has(tagName)) return Number(text);
      return text;
    }
    if (text !== '') obj['value'] = text;
    return obj;
  }

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const propName = child.localName;

    if (propName && WRAPPER_TO_ARRAY.has(propName)) {
      const items = [];
      for (let j = 0; j < child.children.length; j++) {
        const itemNode = child.children[j];
        const itemJson = xmlNodeToJson(itemNode);
        if (typeof itemJson === 'object' && itemJson !== null) {
          itemJson.modelType = capitalize(itemNode.localName || '');
          if (itemJson.idType && !itemJson.type) {
            itemJson.type = itemJson.idType;
            delete itemJson.idType;
          }
        }
        items.push(itemJson);
      }
      obj[propName] = items;
    } else if (propName) {
      obj[propName] = xmlNodeToJson(child);
    }
  }

  if ((tagName === 'reference' || obj.modelType === 'Reference') && !obj.keys) {
    obj.keys = [];
  }

  if (obj.modelType === 'SubmodelElementCollection') {
    if (Array.isArray(obj.value)) {
      obj.submodelElements = obj.value;
      delete obj.value;
    }
    if (!obj.submodelElements) obj.submodelElements = [];
  }

  if (obj.modelType === 'AnnotatedRelationshipElement') {
    if (Array.isArray(obj.value)) {
      obj.annotations = obj.value;
      delete obj.value;
    }
    if (!obj.annotations) obj.annotations = [];
  }

  if (obj.modelType === 'SubmodelElementList' && !obj.value) {
    obj.value = [];
  }

  return obj;
}

export function parseAasXml(xmlString: string): Record<string, unknown> {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  const errorNode = xmlDoc.querySelector('parsererror');
  if (errorNode) {
    throw new Error(`XML Parsing Error: ${errorNode.textContent}`);
  }

  const root = xmlDoc.documentElement;
  const json = xmlNodeToJson(root);

  if (root.localName === 'environment') {
    if (!json.assetAdministrationShells) json.assetAdministrationShells = [];
    if (!json.submodels) json.submodels = [];
    if (!json.conceptDescriptions) json.conceptDescriptions = [];
  }

  return json;
}
