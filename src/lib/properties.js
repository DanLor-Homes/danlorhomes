export const PROPERTY_TYPES = [
  { id: 'piso', label: 'Piso' },
  { id: 'atico', label: 'Ático' },
  { id: 'adosado', label: 'Adosado' },
  { id: 'chalet', label: 'Chalet' },
  { id: 'local', label: 'Local' },
  { id: 'oficina', label: 'Oficina' },
  { id: 'garaje', label: 'Garaje' },
  { id: 'nave', label: 'Nave' },
  { id: 'terreno', label: 'Terreno' },
];

export const OPERATIONS = [
  { id: 'venta', label: 'Venta' },
  { id: 'alquiler', label: 'Alquiler' },
];

export const PROPERTY_STATUS = [
  { id: 'captacion', label: 'En captación' },
  { id: 'disponible', label: 'Disponible' },
  { id: 'reservado', label: 'Reservado' },
  { id: 'vendido', label: 'Vendido' },
  { id: 'retirado', label: 'Retirado' },
];

export const CONDITIONS = [
  { id: 'nuevo', label: 'A estrenar' },
  { id: 'reformado', label: 'Reformado' },
  { id: 'buen_estado', label: 'Buen estado' },
  { id: 'a_reformar', label: 'A reformar' },
];

export const LEGAL_STATUS = [
  { id: 'nota_simple', label: 'Nota simple' },
  { id: 'escritura', label: 'Escritura pública' },
  { id: 'en_tramite', label: 'En trámite' },
  { id: 'herencia', label: 'Herencia en curso' },
  { id: 'proindiviso', label: 'Proindiviso' },
  { id: 'otro', label: 'Otro' },
];

export const ENERGY_RATINGS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'en_tramite'];

export const FEATURES = [
  'Ascensor',
  'Terraza',
  'Piscina',
  'Jardín',
  'Garaje',
  'Trastero',
  'Aire acondicionado',
  'Amueblado',
  'Vistas al mar',
  'Primera línea de playa',
  'Chimenea',
  'Domótica',
];

export const PORTALS = [
  { id: 'idealista', label: 'Idealista' },
  { id: 'fotocasa', label: 'Fotocasa' },
  { id: 'habitaclia', label: 'Habitaclia' },
  { id: 'pisos_com', label: 'pisos.com' },
  { id: 'milanuncios', label: 'Milanuncios' },
  { id: 'kyero', label: 'Kyero' },
  { id: 'think_spain', label: 'Think Spain' },
  { id: 'web_propia', label: 'Web propia' },
];

const buildMap = (list) =>
  list.reduce((acc, item) => {
    acc[item.id] = item.label;
    return acc;
  }, {});

const TYPE_LABELS = buildMap(PROPERTY_TYPES);
const STATUS_LABELS = buildMap(PROPERTY_STATUS);
const CONDITION_LABELS = buildMap(CONDITIONS);
const LEGAL_LABELS = buildMap(LEGAL_STATUS);
const PORTAL_LABELS = buildMap(PORTALS);

export const propertyTypeLabel = (id) => TYPE_LABELS[id] || '—';
export const propertyStatusLabel = (id) => STATUS_LABELS[id] || '—';
export const conditionLabel = (id) => CONDITION_LABELS[id] || '—';
export const legalStatusLabel = (id) => LEGAL_LABELS[id] || '—';
export const portalLabel = (id) => PORTAL_LABELS[id] || id;

export const operationLabel = (id) => (id === 'alquiler' ? 'Alquiler' : 'Venta');

export function pricePerM2(price, surface) {
  const p = Number(price) || 0;
  const s = Number(surface) || 0;
  if (!p || !s) return null;
  return p / s;
}

const normalize = (value) => (value || '').toString().toLowerCase().trim();

function zonesOverlap(first, second) {
  const a = normalize(first);
  const b = normalize(second);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  return a.split(/[,\s/]+/).some((token) => token.length > 3 && b.includes(token));
}

/**
 * Cruce automático inmueble ↔ cliente comprador.
 * Devuelve la puntuación de encaje (0-100) y los motivos del match.
 */
export function matchScore(property, client) {
  const reasons = [];
  let score = 0;

  const interest = client.operation_interest || 'venta';
  const operation = property.operation || 'venta';
  if (interest !== 'ambas' && interest !== operation) return { score: 0, reasons };
  score += 20;
  reasons.push(`Busca ${operation}`);

  const types = client.property_types || [];
  if (types.length) {
    if (!types.includes(property.property_type)) return { score: 0, reasons };
    score += 25;
    reasons.push('Tipo de inmueble');
  }

  const price = Number(property.price) || 0;
  const max = Number(client.budget_max) || 0;
  const min = Number(client.budget_min) || 0;
  if (price && max) {
    if (price <= max && (!min || price >= min * 0.85)) {
      score += 30;
      reasons.push('Dentro de presupuesto');
    } else if (price <= max * 1.1) {
      score += 12;
      reasons.push('Hasta un 10 % por encima del presupuesto');
    } else {
      return { score: 0, reasons };
    }
  }

  if (zonesOverlap(client.search_zones || client.geographic_zone, property.zone)) {
    score += 25;
    reasons.push('Zona coincidente');
  }

  const minRooms = Number(client.min_rooms) || 0;
  if (minRooms) {
    if ((Number(property.rooms) || 0) < minRooms) return { score: 0, reasons };
    score += 15;
    reasons.push(`${minRooms}+ habitaciones`);
  }

  return { score: Math.min(100, score), reasons };
}

export function findMatches(property, clients) {
  if (!property?.id) return [];
  return clients
    .map((client) => ({ client, ...matchScore(property, client) }))
    .filter((item) => item.score >= 40)
    .sort((a, b) => b.score - a.score);
}

/**
 * Valoración orientativa a partir de comparables reales de la cartera
 * y de los anuncios captados en portales (€/m² de la zona y tipo).
 */
export function estimateValuation(property, comparables) {
  const surface = Number(property?.surface) || 0;
  const operation = property?.operation || 'venta';
  if (!surface) return null;

  const rows = (comparables || [])
    .filter((item) => item.id !== property?.id)
    .filter((item) => (item.operation || 'venta') === operation)
    .filter((item) => Number(item.price) > 0 && Number(item.surface) > 20)
    .filter((item) => !item.property_type || item.property_type === property.property_type)
    .filter((item) => zonesOverlap(item.zone, property.zone))
    .map((item) => Number(item.price) / Number(item.surface))
    .sort((a, b) => a - b);

  if (rows.length < 2) return null;

  const median = rows[Math.floor(rows.length / 2)];
  const estimate = Math.round(median * surface);

  return {
    median: Math.round(median),
    estimate,
    low: Math.round(estimate * 0.92),
    high: Math.round(estimate * 1.08),
    samples: rows.length,
  };
}