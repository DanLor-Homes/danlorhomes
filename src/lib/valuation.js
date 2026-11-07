import { pricePerM2 } from '@/lib/properties';

const norm = (value) => (value || '').toString().toLowerCase().trim();

export function zonesMatch(first, second) {
  const a = norm(first);
  const b = norm(second);
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

/**
 * Comparables de una zona para la operación y tipología dadas.
 * Si no hay al menos dos del mismo tipo, se usan todos los de la zona.
 */
export function sampleFor(properties, { zone, operation = 'venta', propertyType, excludeId }) {
  const all = (properties || [])
    .filter((property) => property.id !== excludeId)
    .filter((property) => (property.operation || 'venta') === operation)
    .filter((property) => property.status !== 'retirado')
    .filter((property) => zonesMatch(property.zone, zone))
    .map((property) => ({ ...property, price_m2: pricePerM2(property.price, property.surface) }))
    .filter((property) => property.price_m2)
    .sort((a, b) => a.price_m2 - b.price_m2);

  const typed = all.filter((property) => property.property_type === propertyType);
  const rows = typed.length >= 2 ? typed : all;

  return {
    rows,
    usedFallback: typed.length < 2 && all.length > typed.length,
  };
}

export function statsFor(rows) {
  if (!rows?.length) return null;
  const values = rows.map((row) => row.price_m2).sort((a, b) => a - b);
  const middle = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    count: values.length,
    median: Math.round(median),
    avg: Math.round(avg),
    min: Math.round(values[0]),
    max: Math.round(values[values.length - 1]),
  };
}

export function buildValuation({ surface, own, reference }) {
  const area = Number(surface) || 0;
  const ownStats = statsFor(own?.rows);
  const refStats = statsFor(reference?.rows);
  const basisStats = ownStats || refStats;
  const base = { ownStats, refStats, estimate: null, refEstimate: null, deltaPercent: null, pricePerM2: null, low: null, high: null };

  if (!area || !basisStats) return { ...base, basis: null };

  const estimate = Math.round(basisStats.median * area);

  return {
    ...base,
    estimate,
    pricePerM2: basisStats.median,
    low: Math.round(estimate * 0.92),
    high: Math.round(estimate * 1.08),
    refEstimate: refStats ? Math.round(refStats.median * area) : null,
    deltaPercent:
      ownStats && refStats
        ? Math.round(((ownStats.median - refStats.median) / refStats.median) * 1000) / 10
        : null,
    basis: ownStats ? 'own' : 'reference',
  };
}

/**
 * Comparables por ubicación (municipio → provincia) para tasar una dirección
 * que aún no está en la cartera.
 */
export function sampleByPlace(properties, { municipality, province, operation = 'venta', propertyType, excludeId }) {
  const pool = (properties || [])
    .filter((property) => property.id !== excludeId)
    .filter((property) => (property.operation || 'venta') === operation)
    .filter((property) => property.status !== 'retirado')
    .map((property) => ({ ...property, price_m2: pricePerM2(property.price, property.surface) }))
    .filter((property) => property.price_m2);

  const haystack = (property) => norm([property.municipality, property.zone, property.address, property.title].join(' '));
  const town = norm(municipality);
  const area = norm(province);

  const inTown = town.length > 2 ? pool.filter((property) => haystack(property).includes(town)) : [];
  const inProvince =
    area.length > 2
      ? pool.filter((property) => norm(property.province) === area || haystack(property).includes(area))
      : [];

  const scope = inTown.length ? 'municipio' : inProvince.length ? 'provincia' : null;
  const matched = scope === 'municipio' ? inTown : scope === 'provincia' ? inProvince : [];
  const typed = matched.filter((property) => property.property_type === propertyType);
  const rows = typed.length >= 2 ? typed : matched;

  return { rows, scope, usedFallback: typed.length < 2 && matched.length > typed.length };
}

export function comparablesList(own, reference) {
  const ownIds = new Set((own?.rows || []).map((row) => row.id));
  const rows = [
    ...(own?.rows || []).map((row) => ({ ...row, scope: 'Propia' })),
    ...(reference?.rows || [])
      .filter((row) => !ownIds.has(row.id))
      .map((row) => ({ ...row, scope: 'Referencia' })),
  ];
  return rows.sort((a, b) => a.price_m2 - b.price_m2);
}