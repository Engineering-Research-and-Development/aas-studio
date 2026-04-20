const WRAPPER_TO_ARRAY = [
  'extensions', 'assetAdministrationShells', 'submodels', 'conceptDescriptions',
  'submodelElements', 'inputVariables', 'outputVariables', 'inoutputVariables',
  'qualifiers', 'displayName', 'description', 'keys', 'specificAssetIds',
  'statements', 'annotations', 'values', 'embeddedDataSpecifications',
  'supplementalSemanticIds', 'dataSpecifications'
];

const BOOLEAN_PROPS = ['ordered', 'allowDuplicates'];
const NUMBER_PROPS = ['index'];

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function xmlNodeToJson(node: Element | Document): any {
  if (!('localName' in node)) return {};
  const tagName = node.localName;

  // 1. Capture Attributes
  const obj: any = {};
  if (node.attributes) {
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      let name = attr.name;
      if (name === 'idType' && (tagName === 'key' || tagName === 'Key')) name = 'type';
      if (name === 'lang') name = 'language';
      obj[name] = attr.value;
    }
  }

  // 2. Special handling for the <value> tag
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
      return items; // Return array directly for the 'value' property
    } else {
      return node.textContent?.trim();
    }
  }

  // 3. Handle Leaf Nodes (for tags other than <value>)
  if (node.children.length === 0) {
    const text = node.textContent?.trim() || '';
    if (tagName === 'langString' || tagName === 'LangString') {
      obj['text'] = text;
      return obj;
    }
    if (!node.attributes || node.attributes.length === 0) {
      if (tagName && BOOLEAN_PROPS.includes(tagName)) return text === 'true';
      if (tagName && NUMBER_PROPS.includes(tagName)) return Number(text);
      return text;
    }
    if (text !== '') obj['value'] = text;
    return obj;
  }

  // 4. Process Children
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const propName = child.localName;

    if (propName && WRAPPER_TO_ARRAY.includes(propName)) {
      const items = [];
      for (let j = 0; j < child.children.length; j++) {
        const itemNode = child.children[j];
        const itemJson = xmlNodeToJson(itemNode);
        if (typeof itemJson === 'object' && itemJson !== null) {
          itemJson.modelType = capitalize(itemNode.localName || '');
          // Legacy idType -> type patch
          if (itemJson.idType && !itemJson.type) {
            itemJson.type = itemJson.idType;
            delete itemJson.idType;
          }
        }
        items.push(itemJson);
      }
      obj[propName] = items;
    } else if (propName) {
      const value = xmlNodeToJson(child);
      obj[propName] = value;
    }
  }

  // 5. Structural Patches for JSON Metamodel Compatibility
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

export function parseAasXml(xmlString: string) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const errorNode = xmlDoc.querySelector("parsererror");
  if (errorNode) throw new Error("XML Parsing Error: " + errorNode.textContent);

  const root = xmlDoc.documentElement;
  const json = xmlNodeToJson(root);

  if (root.localName === 'environment') {
    if (!json.assetAdministrationShells) json.assetAdministrationShells = [];
    if (!json.submodels) json.submodels = [];
    if (!json.conceptDescriptions) json.conceptDescriptions = [];
  }

  return json;
}
