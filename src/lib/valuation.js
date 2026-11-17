import { pricePerM2 } from '@/lib/properties';

const norm = (value) => (value || '').toString().toLowerCase().trim();

export const normalizeText = (value) =>
  norm(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/* Claves de lugar sin artículos ni preposiciones: "San Pedro de Alcántara" y
   "San Pedro Alcántara" coinciden, pero "Málaga" y "Vélez-Málaga" no. */
const PLACE_STOPWORDS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'en']);

const placeKey = (value) =>
  normalizeText(value)
    .split(/[,\s/()\-]+/)
    .filter((token) => token && !PLACE_STOPWORDS.has(token))
    .join(' ');

export const samePlace = (first, second) => {
  const a = placeKey(first);
  return Boolean(a) && a === placeKey(second);
};

export function zonesMatch(first, second) {
  const a = normalizeText(first);
  const b = normalizeText(second);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  return a.split(/[,\s/]+/).some((token) => token.length > 3 && b.includes(token));
}

export function listZones(properties) {
  const seen = new Map();
  (properties || []).forEach((property) => {
    const zone = (property.zone || '').trim();
    if (zone && !seen.has(norm(zone))) seen.set(norm(zone), zone);
  });
  return [...seen.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

/* €/m² de referencia de vivienda en venta. Las rentas se derivan de esta tabla. */
const PROVINCE_EUR_M2 = {
  alava: 2400, albacete: 1150, alicante: 2200, almeria: 1500, asturias: 1600, avila: 1000,
  badajoz: 1050, baleares: 4200, barcelona: 3300, burgos: 1300, cacers: 1000, caceres: 1000,
  cadiz: 2000, cantabria: 2000, castellon: 1400, ceuta: 1900, 'ciudad real': 1000, cordoba: 1350,
  cuenca: 950, girona: 2400, granada: 1600, guadalajara: 1450, guipuzcoa: 3300, huelva: 1400,
  huesca: 1300, jaen: 1000, 'la coruna': 1500, 'la rioja': 1350, 'las palmas': 2100, leon: 1150,
  lleida: 1350, lugo: 1050, madrid: 3900, malaga: 2900, melilla: 1800, murcia: 1500, navarra: 2000,
  ourense: 1000, palencia: 1050, pontevedra: 1500, salamanca: 1250, 'santa cruz de tenerife': 2100,
  segovia: 1200, sevilla: 1900, soria: 950, tarragona: 1700, teruel: 900, toledo: 1150,
  valencia: 1900, valladolid: 1400, vizcaya: 3000, zamora: 900, zaragoza: 1600,
};

const MUNICIPALITY_EUR_M2 = {
  madrid: 5200, barcelona: 4400, 'san sebastian': 5000, bilbao: 3600, palma: 4400,
  'las palmas de gran canaria': 2400, 'santa cruz de tenerife': 2300, pamplona: 2400,
  malaga: 3300, marbella: 4600, estepona: 3600, fuengirola: 3300, benalmadena: 3200,
  torremolinos: 3300, mijas: 2900, 'san pedro de alcantara': 4000, benahavis: 4800,
  manilva: 2700, casares: 2600, nerja: 2900, ronda: 1700, 'velez-malaga': 2000, antequera: 1300,
  'torre del mar': 2300, sotogrande: 4200, 'la linea de la concepcion': 1900, algeciras: 1500,
  sevilla: 2400, valencia: 2300, zaragoza: 2000, murcia: 1700, alicante: 2400, granada: 2000,
  cordoba: 1600, salamanca: 1600, valladolid: 1600, santander: 2600, oviedo: 2000,
  'a coruna': 2000, vigo: 1800, girona: 2900, tarragona: 2000, cadiz: 2400, jerez: 1700,
  almeria: 1700, huelva: 1600, badajoz: 1300, toledo: 1400, guadalajara: 1600, lleida: 1500,
  'palma de mallorca': 4400, ibiza: 5200,
};

/* Renta mensual por m² a partir del €/m² de venta: rendimiento bruto ~4,5 % anual. */
const RENT_MONTHLY_FACTOR = 0.0038;

/* Familias de uso: solo se compara dentro de la misma familia, porque un garaje
   o una nave no se pueden tasar con el €/m² de una vivienda. */
const TYPE_FAMILY = {
  piso: 'vivienda', atico: 'vivienda', adosado: 'vivienda', chalet: 'vivienda',
  local: 'terciario', oficina: 'terciario',
  garaje: 'garaje',
  nave: 'industrial',
  terreno: 'terreno',
};

export const typeFamily = (type) => TYPE_FAMILY[type] || 'vivienda';

const isDwelling = (type) => typeFamily(type) === 'vivienda';

const matchKey = (map, value) => {
  const key = normalizeText(value);
  if (!key) return null;
  const keys = Object.keys(map);
  const exact = keys.find((item) => item === key);
  if (exact) return exact;
  const sorted = [...keys].sort((a, b) => b.length - a.length);
  return sorted.find((item) => item.length > 3 && key.includes(item)) || null;
};

/**
 * €/m² de referencia de la zona, en la unidad de la operación: €/m² de venta o
 * €/m² y mes de alquiler. Fuera de vivienda no se inventa referencia: se deja
 * vacía y el cálculo exige testigos del mismo tipo.
 */
export function marketReference({ municipality, province, property_type = 'piso', operation = 'venta' } = {}) {
  if (!isDwelling(property_type)) {
    return { priceM2: null, scope: null, label: '', source: '', operation, note: 'sin referencia para este tipo de inmueble' };
  }

  const town = matchKey(MUNICIPALITY_EUR_M2, municipality);
  const area = town ? null : matchKey(PROVINCE_EUR_M2, province);
  const table = town ? MUNICIPALITY_EUR_M2 : PROVINCE_EUR_M2;
  const key = town || area;
  if (!key) return { priceM2: null, scope: null, label: '', source: '', operation };

  const scope = town ? 'municipio' : 'provincia';
  const label = town ? municipality : province;
  const source = town ? 'media municipal' : 'media provincial';

  if (operation === 'alquiler') {
    return {
      priceM2: Math.round(table[key] * RENT_MONTHLY_FACTOR),
      scope,
      label,
      source: `${source} · renta estimada`,
      operation,
    };
  }

  return { priceM2: table[key], scope, label, source, operation };
}

export const CONDITION_FACTORS = { nuevo: 1.08, reformado: 1.05, buen_estado: 1, a_reformar: 0.88 };

export const conditionFactor = (condition) => CONDITION_FACTORS[condition] ?? 1;

export function ageFactor(year) {
  const value = Number(year);
  if (!value) return 1;
  const age = new Date().getFullYear() - value;
  if (age <= 5) return 1.04;
  if (age <= 15) return 1.02;
  if (age <= 30) return 1;
  if (age <= 50) return 0.96;
  return 0.92;
}

export function sizeFactor(surface) {
  const area = Number(surface);
  if (!area) return 1;
  const factor = Math.pow(90 / Math.max(area, 25), 0.12);
  return Math.min(1.12, Math.max(0.88, factor));
}

/** Coeficientes de homogeneización del inmueble respecto a uno estándar de 90 m². */
export function characteristicFactors({ condition, year_built, surface } = {}) {
  const rows = [
    { key: 'condition', label: 'Estado de conservación', factor: conditionFactor(condition) },
    { key: 'age', label: 'Antigüedad', factor: ageFactor(year_built) },
    { key: 'size', label: 'Tamaño', factor: sizeFactor(surface) },
  ];
  return { factor: rows.reduce((acc, row) => acc * row.factor, 1), rows };
}

export function statistics(values) {
  const list = (values || []).filter((value) => value > 0).sort((a, b) => a - b);
  if (!list.length) return null;
  const middle = Math.floor(list.length / 2);
  const median = list.length % 2 ? list[middle] : (list[middle - 1] + list[middle]) / 2;
  return {
    count: list.length,
    median: Math.round(median),
    min: Math.round(list[0]),
    max: Math.round(list[list.length - 1]),
  };
}

const quartile = (list, p) => {
  const index = (list.length - 1) * p;
  const low = Math.floor(index);
  const high = Math.ceil(index);
  return list[low] + (list[high] - list[low]) * (index - low);
};

/** Dispersión relativa de los comparables: rango intercuartílico sobre la mediana. */
export function dispersion(values) {
  const list = (values || []).filter((value) => value > 0).sort((a, b) => a - b);
  if (list.length < 3) return null;
  const median = quartile(list, 0.5);
  if (!median) return null;
  return (quartile(list, 0.75) - quartile(list, 0.25)) / median;
}

/** Normaliza un inmueble (de cartera o testigo) a €/m² homogeneizado. */
export function toComparable(record, origin) {
  const priceM2 = pricePerM2(record.price, record.surface);
  if (!priceM2) return null;
  const { factor } = characteristicFactors(record);
  return {
    id: record.id,
    origin,
    title: record.title || record.address || 'Testigo',
    zone: record.zone || record.municipality || '',
    municipality: record.municipality || '',
    province: record.province || '',
    property_type: record.property_type || '',
    operation: record.operation || 'venta',
    price: Number(record.price) || 0,
    surface: Number(record.surface) || 0,
    condition: record.condition || '',
    year_built: Number(record.year_built) || null,
    url: record.source_url || '',
    price_m2: Math.round(priceM2),
    normalized_m2: Math.round(priceM2 / factor),
  };
}

/* Descarta precios imposibles (erratas, superficies mal puestas) sin recortar
   la muestra cuando aún no hay suficientes comparables. */
function trimOutliers(rows) {
  if (rows.length < 4) return { rows, dropped: 0 };
  const median = rows[Math.floor(rows.length / 2)].normalized_m2;
  if (!median) return { rows, dropped: 0 };
  const kept = rows.filter((row) => row.normalized_m2 >= median * 0.6 && row.normalized_m2 <= median * 1.65);
  return kept.length >= 3 ? { rows: kept, dropped: rows.length - kept.length } : { rows, dropped: 0 };
}

/**
 * Comparables del inmueble: primero su municipio, después la provincia y, si no
 * hay nada, su zona. Nunca mezcla familias de uso distintas y descarta
 * duplicados entre cartera y testigos.
 */
export function collectComparables({ properties = [], testigos = [], subject = {}, operation = 'venta', propertyType }) {
  const pool = [
    ...properties
      .filter((item) => item.id !== subject.id)
      .filter((item) => item.status !== 'retirado')
      .map((item) => toComparable(item, 'cartera')),
    ...testigos.map((item) => toComparable(item, 'testigo')),
  ].filter(Boolean);

  const seen = new Set();
  const unique = pool.filter((item) => {
    const key = `${normalizeText(item.title)}|${Math.round(item.surface)}|${Math.round(item.price / 1000)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const inOperation = unique.filter((item) => (item.operation || 'venta') === operation);

  const inTown = subject.municipality
    ? inOperation.filter(
        (item) =>
          samePlace(item.municipality, subject.municipality) ||
          (!item.municipality && samePlace(item.zone, subject.municipality))
      )
    : [];
  const inArea = subject.province ? inOperation.filter((item) => samePlace(item.province, subject.province)) : [];
  const zone = subject.zone || subject.municipality;
  const inZone = zone ? inOperation.filter((item) => samePlace(item.zone, zone)) : [];

  let scope = null;
  let matched = [];
  if (inTown.length) {
    scope = 'municipio';
    matched = inTown;
  } else if (inArea.length) {
    scope = 'provincia';
    matched = inArea;
  } else if (inZone.length) {
    scope = 'zona';
    matched = inZone;
  }

  const family = typeFamily(propertyType);
  const sameFamily = matched.filter((item) => typeFamily(item.property_type) === family);
  const exact = sameFamily.filter((item) => item.property_type === propertyType);
  const usedFallback = exact.length < 2 && sameFamily.length > exact.length;
  const chosen = (exact.length >= 2 ? exact : sameFamily).sort((a, b) => a.normalized_m2 - b.normalized_m2);
  const { rows, dropped } = trimOutliers(chosen);

  return { rows, scope, usedFallback, dropped, family };
}

const roundEstimate = (value, operation) => {
  const step = operation === 'alquiler' ? 5 : value >= 300000 ? 1000 : value >= 60000 ? 500 : 100;
  return Math.round(value / step) * step;
};

/**
 * Valoración: €/m² homogeneizado de los comparables (mediana) o referencia de
 * mercado, ajustado por los coeficientes del inmueble y su superficie. La
 * horquilla se abre con la dispersión real de los comparables.
 */
export function buildValuation({ subject = {}, comparables = { rows: [] }, market = {} }) {
  const surface = Number(subject.surface) || 0;
  const operation = subject.operation || 'venta';
  const { factor, rows: factorRows } = characteristicFactors(subject);
  const values = (comparables.rows || []).map((row) => row.normalized_m2);
  const stats = statistics(values);
  const spread = dispersion(values);
  const count = stats?.count || 0;

  const result = {
    operation,
    surface,
    factor,
    factorRows,
    stats,
    count,
    dispersion: spread,
    scope: comparables.scope || null,
    usedFallback: Boolean(comparables.usedFallback),
    dropped: comparables.dropped || 0,
    basis: null,
    basisSource: null,
    estimate: null,
    pricePerM2: null,
    low: null,
    high: null,
    margin: null,
    confidence: 'referencia',
    marketPrice: market.priceM2 || null,
    marketEstimate: market.priceM2 && surface ? roundEstimate(market.priceM2 * factor * surface, operation) : null,
    deltaPercent: null,
    warnings: [],
    canValue: false,
  };

  if (stats) {
    result.basis = stats.median;
    result.basisSource = 'comparables';
  } else if (market.priceM2) {
    result.basis = market.priceM2;
    result.basisSource = 'mercado';
  }

  const warnings = [];
  if (result.dropped) {
    warnings.push(`${result.dropped} comparable(s) descartados por alejarse demasiado del precio medio.`);
  }
  if (stats && count === 1) warnings.push('Un solo comparable: el valor es orientativo, añade testigos.');
  if (stats && count === 2) warnings.push('Solo dos comparables: hace falta un tercero para dar el valor por bueno.');
  if (spread !== null && spread > 0.3) {
    warnings.push(`Los comparables están muy dispersos (${Math.round(spread * 100)} %): revisa que sean homogéneos.`);
  }
  if (comparables.usedFallback) {
    warnings.push('No había suficientes comparables del mismo tipo: se han mezclado tipos parecidos.');
  }
  if (result.scope === 'provincia') {
    warnings.push('Comparables de toda la provincia: menos precisos que los del municipio.');
  }
  if (!stats && market.priceM2) {
    warnings.push('Valor apoyado solo en la referencia de zona, sin comparables reales.');
  }
  result.warnings = warnings;

  if (!result.basis || !surface) return result;

  const baseMargin = count >= 5 ? 0.05 : count >= 3 ? 0.07 : count >= 2 ? 0.09 : count === 1 ? 0.12 : 0.15;
  const margin = Math.min(0.22, Math.max(baseMargin, spread ? spread * 0.6 : 0));

  const estimate = roundEstimate(result.basis * factor * surface, operation);
  const decimals = operation === 'alquiler' ? 10 : 1;

  result.estimate = estimate;
  result.margin = Math.round(margin * 1000) / 1000;
  result.pricePerM2 = Math.round((estimate / surface) * decimals) / decimals;
  result.low = roundEstimate(estimate * (1 - margin), operation);
  result.high = roundEstimate(estimate * (1 + margin), operation);
  result.canValue = true;

  const reliable = count >= 4 && result.scope === 'municipio' && !comparables.usedFallback && (spread ?? 0) <= 0.18;
  const fair = count >= 2 && (spread ?? 0) <= 0.35;
  result.confidence = count === 0 ? 'referencia' : reliable ? 'alta' : fair ? 'media' : 'baja';

  if (result.marketPrice) {
    result.deltaPercent = Math.round(((result.pricePerM2 - result.marketPrice) / result.marketPrice) * 1000) / 10;
  }

  return result;
}