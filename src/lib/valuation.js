import { pricePerM2 } from '@/lib/properties';

const norm = (value) => (value || '').toString().toLowerCase().trim();

export const normalizeText = (value) =>
  norm(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

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

/* Valores de referencia orientativos de mercado (€/m² de vivienda, venta). */
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

const matchKey = (map, value) => {
  const key = normalizeText(value);
  if (!key) return null;
  const keys = Object.keys(map);
  const exact = keys.find((item) => item === key);
  if (exact) return exact;
  const sorted = [...keys].sort((a, b) => b.length - a.length);
  return sorted.find((item) => item.length > 3 && key.includes(item)) || null;
};

/** €/m² de referencia para una ubicación: municipio, si no provincia. */
export function marketReference({ municipality, province } = {}) {
  const town = matchKey(MUNICIPALITY_EUR_M2, municipality);
  if (town) {
    return { priceM2: MUNICIPALITY_EUR_M2[town], scope: 'municipio', label: municipality, source: 'media municipal' };
  }
  const area = matchKey(PROVINCE_EUR_M2, province);
  if (area) {
    return { priceM2: PROVINCE_EUR_M2[area], scope: 'provincia', label: province, source: 'media provincial' };
  }
  return { priceM2: null, scope: null, label: '', source: '' };
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

/**
 * Comparables del inmueble: primero su municipio, después la provincia y,
 * si no hay nada, su zona. Testigos de mercado incluidos.
 */
export function collectComparables({ properties = [], testigos = [], subject = {}, operation = 'venta', propertyType }) {
  const pool = [
    ...properties
      .filter((item) => item.id !== subject.id)
      .filter((item) => item.status !== 'retirado')
      .map((item) => toComparable(item, 'cartera')),
    ...testigos.map((item) => toComparable(item, 'testigo')),
  ].filter(Boolean);

  const inOperation = pool.filter((item) => (item.operation || 'venta') === operation);
  const haystack = (item) => normalizeText([item.municipality, item.zone, item.title].join(' '));

  const town = normalizeText(subject.municipality);
  const area = normalizeText(subject.province);
  const zone = normalizeText(subject.zone || subject.municipality);

  const inTown = town.length > 2 ? inOperation.filter((item) => haystack(item).includes(town)) : [];
  const inArea =
    area.length > 2
      ? inOperation.filter((item) => normalizeText(item.province) === area || haystack(item).includes(area))
      : [];
  const inZone = zone.length > 1 ? inOperation.filter((item) => zonesMatch(item.zone, subject.zone || subject.municipality)) : [];

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

  const typed = matched.filter((item) => item.property_type === propertyType);
  const usedFallback = typed.length < 2 && matched.length > typed.length;
  const rows = (typed.length >= 2 ? typed : matched).sort((a, b) => a.normalized_m2 - b.normalized_m2);

  return { rows, scope, usedFallback };
}

/**
 * Valoración: €/m² homogeneizado de los comparables (mediana) o referencia de
 * mercado, ajustado por los coeficientes del inmueble y su superficie.
 */
export function buildValuation({ subject = {}, comparables = { rows: [] }, market = {} }) {
  const surface = Number(subject.surface) || 0;
  const { factor, rows: factorRows } = characteristicFactors(subject);
  const stats = statistics((comparables.rows || []).map((row) => row.normalized_m2));

  const result = {
    surface,
    factor,
    factorRows,
    stats,
    count: stats?.count || 0,
    scope: comparables.scope || null,
    usedFallback: Boolean(comparables.usedFallback),
    basis: null,
    basisSource: null,
    estimate: null,
    pricePerM2: null,
    low: null,
    high: null,
    margin: null,
    confidence: 'referencia',
    marketPrice: market.priceM2 || null,
    marketEstimate: market.priceM2 && surface ? Math.round(market.priceM2 * factor * surface) : null,
    deltaPercent: null,
    canValue: false,
  };

  if (stats) {
    result.basis = stats.median;
    result.basisSource = 'comparables';
  } else if (market.priceM2) {
    result.basis = market.priceM2;
    result.basisSource = 'mercado';
  }

  if (!result.basis || !surface) return result;

  const estimate = Math.round(result.basis * factor * surface);
  const margin = result.count >= 4 ? 0.06 : result.count >= 2 ? 0.08 : 0.12;

  result.estimate = estimate;
  result.margin = margin;
  result.pricePerM2 = Math.round(estimate / surface);
  result.low = Math.round(estimate * (1 - margin));
  result.high = Math.round(estimate * (1 + margin));
  result.confidence = result.count >= 4 ? 'alta' : result.count >= 2 ? 'media' : result.count === 1 ? 'baja' : 'referencia';
  result.canValue = true;
  if (result.marketPrice) {
    result.deltaPercent = Math.round(((result.pricePerM2 - result.marketPrice) / result.marketPrice) * 1000) / 10;
  }
  return result;
}