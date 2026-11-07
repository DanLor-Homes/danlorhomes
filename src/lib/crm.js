export const STAGES = [
  { id: 'nuevo_lead', label: 'Nuevo lead', probability: 10, status: 'open', color: '#64748b' },
  { id: 'reunion_agendada', label: 'Reunión agendada', probability: 25, status: 'open', color: '#0ea5e9' },
  { id: 'visita', label: 'Visita', probability: 40, status: 'open', color: '#6366f1' },
  { id: 'presupuesto', label: 'Presupuesto', probability: 55, status: 'open', color: '#8b5cf6' },
  { id: 'presupuesto_enviado', label: 'Presupuesto enviado', probability: 70, status: 'open', color: '#f59e0b' },
  { id: 'ganado', label: 'Ganado', probability: 100, status: 'won', color: '#10b981' },
  { id: 'en_ejecucion', label: 'En ejecución', probability: 100, status: 'won', color: '#14b8a6' },
  { id: 'ejecutado', label: 'Ejecutado', probability: 100, status: 'won', color: '#22c55e' },
  { id: 'perdido', label: 'Perdido', probability: 0, status: 'lost', color: '#ef4444' },
];

export const STAGE_MAP = STAGES.reduce((acc, stage) => {
  acc[stage.id] = stage;
  return acc;
}, {});

export const OPEN_STAGES = STAGES.filter((s) => s.status === 'open');
export const WON_STAGES = STAGES.filter((s) => s.status === 'won');
export const LOST_STAGES = STAGES.filter((s) => s.status === 'lost');

export const PRODUCTS = [
  { id: 'servicios_inmobiliarios', label: 'Servicios inmobiliarios' },
  { id: 'venta_viviendas', label: 'Venta de viviendas' },
  { id: 'alquiler_turistico', label: 'Alquiler turístico y vacacional' },
];

export const LOSS_REASONS = [
  { id: 'precio', label: 'Precio' },
  { id: 'competencia', label: 'Competencia' },
  { id: 'timing', label: 'Timing' },
  { id: 'otro', label: 'Otro' },
];

export const CHANNELS = [
  { id: 'web', label: 'Web' },
  { id: 'referido', label: 'Referido' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'campana_email', label: 'Campaña email' },
  { id: 'publicidad', label: 'Publicidad' },
  { id: 'portal_inmobiliario', label: 'Portal inmobiliario' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'google_ads', label: 'Google Ads' },
  { id: 'llamada_fria', label: 'Llamada fría' },
  { id: 'cartel', label: 'Cartel / escaparate' },
  { id: 'broker', label: 'Bróker inmobiliario' },
];

export const CHANNEL_LABELS = CHANNELS.reduce((acc, c) => {
  acc[c.id] = c.label;
  return acc;
}, {});

export const INTERACTION_TYPES = [
  { id: 'llamada', label: 'Llamada' },
  { id: 'email', label: 'Email' },
  { id: 'reunion', label: 'Reunión' },
  { id: 'nota', label: 'Nota' },
  { id: 'visita', label: 'Visita' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

export const INTERACTION_LABELS = INTERACTION_TYPES.reduce((acc, t) => {
  acc[t.id] = t.label;
  return acc;
}, {});

export const STATUS_LABELS = { open: 'Abierta', won: 'Ganada', lost: 'Perdida' };

export function stageLabel(id) {
  return STAGE_MAP[id]?.label || id || '—';
}

export function statusForStage(stage) {
  return STAGE_MAP[stage]?.status || 'open';
}

export function probabilityForStage(stage) {
  const value = STAGE_MAP[stage]?.probability;
  return typeof value === 'number' ? value : 0;
}

export function productLabel(id) {
  return PRODUCTS.find((p) => p.id === id)?.label || '—';
}

export function lossReasonLabel(id) {
  return LOSS_REASONS.find((r) => r.id === id)?.label || '—';
}

export function formatCurrency(value, compact = false) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? 'compact' : 'standard',
  }).format(amount);
}

export function formatDate(value, options = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', options).format(date);
}

export function formatDateTime(value) {
  return formatDate(value, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function toInputDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function daysSince(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

export function daysUntil(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < new Date(todayISO()).getTime();
}

export function initials(name) {
  if (!name) return '··';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}