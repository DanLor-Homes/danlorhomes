// Consulta de datos catastrales no protegidos (Dirección General del Catastro).
// Servicio público sin autenticación y con CORS abierto.

const BASE = 'https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx';

const STREET_WORDS = ['calle', 'c/', 'c.', 'avenida', 'avda', 'avda.', 'av.', 'av', 'plaza', 'pza', 'paseo', 'camino', 'carretera', 'ctra', 'ronda', 'travesia', 'travesía'];

const FLOOR_CODES = { '-1': 'Sótano', '-2': 'Sótano', '00': 'Baja', '0': 'Baja' };

// Recorre el árbol XML por nombres de etiqueta (evita problemas de espacios de nombres).
const at = (root, path) => {
  let node = root;
  for (const name of path) {
    node = node?.getElementsByTagName(name)[0];
    if (!node) return '';
  }
  return node.textContent.trim();
};

const toNumber = (value) => {
  const parsed = Number(String(value || '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export const floorLabel = (code, door) => {
  if (!code) return '';
  const base = FLOOR_CODES[code] || (/^\d+$/.test(code) ? `${Number(code)}ª` : code);
  return door ? `${base} · ${door}` : base;
};

const USE_TO_TYPE = [
  ['RESIDENCIAL', 'piso'],
  ['VIVIENDA', 'piso'],
  ['COMERCIAL', 'local'],
  ['OFICINA', 'oficina'],
  ['INDUSTRIAL', 'nave'],
  ['ALMACEN', 'nave'],
  ['GARAJE', 'garaje'],
  ['APARCAMIENTO', 'garaje'],
  ['ESTACIONAMIENTO', 'garaje'],
  ['SUELO', 'terreno'],
];

export const propertyTypeForUse = (use) => {
  const normalized = String(use || '').toUpperCase();
  const match = USE_TO_TYPE.find(([key]) => normalized.includes(key));
  return match ? match[1] : undefined;
};

export const normalizeRc = (value) => String(value || '').toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 20);

const parseXml = (xml) => {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (!doc || doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('El Catastro ha devuelto una respuesta no válida.');
  }
  const fault = at(doc, ['faultstring']);
  if (fault) throw new Error(fault);
  const message = at(doc, ['lerr', 'err', 'des']);
  if (message) throw new Error(message.charAt(0) + message.slice(1).toLowerCase());
  return doc;
};

const readAddress = (root) => {
  const streetType = at(root, ['dt', 'locs', 'lous', 'lourb', 'dir', 'tv']);
  const street = at(root, ['dt', 'locs', 'lous', 'lourb', 'dir', 'nv']);
  const number = at(root, ['dt', 'locs', 'lous', 'lourb', 'dir', 'pnp']);
  const postalCode = at(root, ['dt', 'locs', 'lous', 'lourb', 'dp']);
  const municipality = at(root, ['dt', 'nm']);
  const province = at(root, ['dt', 'np']);
  const floor = floorLabel(
    at(root, ['dt', 'locs', 'lous', 'lourb', 'loint', 'pt']),
    at(root, ['dt', 'locs', 'lous', 'lourb', 'loint', 'pu'])
  );
  const line = [streetType, street, number].filter(Boolean).join(' ');
  return {
    municipality,
    province,
    postalCode,
    floor,
    address: [line, postalCode, municipality].filter(Boolean).join(', '),
  };
};

const readReference = (root) => ['pc1', 'pc2', 'car', 'cc1', 'cc2'].map((part) => at(root, ['rc', part])).join('');

export async function lookupByReference(value) {
  const rc = normalizeRc(value);
  if (rc.length !== 20) throw new Error('La referencia catastral debe tener 20 caracteres.');

  const params = new URLSearchParams({ Provincia: '', Municipio: '', RC: rc });
  const response = await fetch(`${BASE}/Consulta_DNPRC?${params}`);
  const doc = parseXml(await response.text());
  const bien = doc.getElementsByTagName('bi')[0];
  if (!bien) throw new Error('No hay datos catastrales para esa referencia.');

  const location = readAddress(bien);
  const use = at(bien, ['debi', 'luso']);

  return {
    rc: readReference(bien) || rc,
    address: location.address,
    municipality: location.municipality,
    province: location.province,
    postalCode: location.postalCode,
    floor: location.floor,
    use,
    surface: toNumber(at(bien, ['debi', 'sfc'])),
    yearBuilt: toNumber(at(bien, ['debi', 'ant'])),
    propertyType: propertyTypeForUse(use),
  };
}

export async function lookupByAddress({ province, municipality, sigla = 'CL', street, number }) {
  if (!province?.trim() || !municipality?.trim() || !street?.trim()) {
    throw new Error('Indica provincia, municipio y calle.');
  }

  let cleanStreet = street.trim().toLowerCase();
  STREET_WORDS.forEach((word) => {
    if (cleanStreet.startsWith(`${word} `)) cleanStreet = cleanStreet.slice(word.length).trim();
  });

  const params = new URLSearchParams({
    Provincia: province.trim(),
    Municipio: municipality.trim(),
    Sigla: sigla,
    Calle: cleanStreet.toUpperCase(),
    Numero: String(number || '').trim(),
    Bloque: '',
    Escalera: '',
    Planta: '',
    Puerta: '',
  });

  const response = await fetch(`${BASE}/Consulta_DNPLOC?${params}`);
  const doc = parseXml(await response.text());

  return Array.from(doc.getElementsByTagName('rcdnp'))
    .map((node) => ({ ...readAddress(node), rc: readReference(node) }))
    .filter((item) => item.rc)
    .slice(0, 12);
}