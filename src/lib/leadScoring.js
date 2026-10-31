import { daysSince } from '@/lib/crm';

export const SCORE_BANDS = [
  { id: 'hot', label: 'Caliente', min: 70, className: 'border-rose-400/40 bg-rose-500/15 text-rose-300' },
  { id: 'warm', label: 'Templado', min: 40, className: 'border-amber-400/40 bg-amber-500/15 text-amber-300' },
  { id: 'cold', label: 'Frío', min: 0, className: 'border-border/70 bg-muted/40 text-muted-foreground' },
];

export function scoreBand(score) {
  const value = Number(score) || 0;
  return SCORE_BANDS.find((band) => value >= band.min) || SCORE_BANDS[SCORE_BANDS.length - 1];
}

/**
 * Score 0-100 de un lead: contacto (25) + perfil de búsqueda (25) +
 * actividad (30) + negocio abierto (hasta 17).
 */
export function scoreLead({
  client,
  interactionCount = 0,
  lastInteraction = null,
  openValue = 0,
  openCount = 0,
}) {
  if (!client) return { score: 0, band: scoreBand(0), items: [] };

  const items = [];
  const add = (label, points) => {
    if (points > 0) items.push({ label, points });
    return points;
  };

  let score = 0;

  let contact = 0;
  if (client.email) contact += 8;
  if (client.phone) contact += 10;
  if (client.contact_person || client.second_contact) contact += 7;
  score += add('Datos de contacto completos', contact);

  let profile = 0;
  if (client.budget_min || client.budget_max) profile += 10;
  if (client.search_zones || client.geographic_zone) profile += 8;
  if (client.property_types?.length || client.min_rooms) profile += 7;
  score += add('Perfil de búsqueda definido', profile);

  score += add(`${interactionCount} interacciones registradas`, Math.min(interactionCount, 5) * 3);

  const days = daysSince(lastInteraction);
  let recency = 0;
  if (days !== null) {
    if (days <= 7) recency = 15;
    else if (days <= 30) recency = 10;
    else if (days <= 90) recency = 5;
  }
  score += add('Contacto reciente', recency);

  let business = 0;
  if (openCount > 0) business += 5;
  if (openValue >= 200000) business += 12;
  else if (openValue >= 100000) business += 9;
  else if (openValue >= 50000) business += 6;
  else if (openValue > 0) business += 3;
  score += add('Oportunidad abierta con valor', business);

  const total = Math.min(100, Math.round(score));
  return { score: total, band: scoreBand(total), items };
}