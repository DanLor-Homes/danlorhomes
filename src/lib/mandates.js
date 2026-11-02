import { daysUntil } from '@/lib/crm';

export const MANDATE_TYPES = [
  { id: 'sin_mandato', label: 'Sin mandato' },
  { id: 'abierta', label: 'Nota de encargo abierta' },
  { id: 'compartida', label: 'Encargo compartido' },
  { id: 'exclusiva', label: 'Exclusiva' },
];

export const WARN_DAYS = 30;

export const mandateLabel = (id) => MANDATE_TYPES.find((type) => type.id === id)?.label || 'Sin mandato';

export const mandateTypeOf = (property) =>
  property?.mandate_type || (property?.exclusive ? 'exclusiva' : 'sin_mandato');

export const TONE_CLASSES = {
  ok: 'border-emerald-500/25 bg-emerald-500/15 text-emerald-400',
  warn: 'border-amber-500/25 bg-amber-500/15 text-amber-400',
  danger: 'border-rose-500/25 bg-rose-500/15 text-rose-400',
  info: 'border-primary/25 bg-primary/15 text-primary',
  muted: 'border-border/70 bg-muted text-muted-foreground',
};

export const STATE_RANK = { por_vencer: 0, caducado: 1, vigente: 2, sin_fecha: 3, sin_mandato: 4 };

export function mandateStatus(property) {
  const type = mandateTypeOf(property);
  if (type === 'sin_mandato') {
    return { type, state: 'sin_mandato', label: 'Sin mandato firmado', daysLeft: null, tone: 'muted' };
  }
  if (!property?.mandate_end) {
    return { type, state: 'sin_fecha', label: `${mandateLabel(type)} sin vencimiento`, daysLeft: null, tone: 'info' };
  }

  const daysLeft = daysUntil(property.mandate_end);
  if (daysLeft === null) {
    return { type, state: 'sin_fecha', label: mandateLabel(type), daysLeft: null, tone: 'info' };
  }
  if (daysLeft < 0) {
    return { type, state: 'caducado', label: `Caducado hace ${Math.abs(daysLeft)} días`, daysLeft, tone: 'danger' };
  }
  if (daysLeft <= WARN_DAYS) {
    return {
      type,
      state: 'por_vencer',
      label: daysLeft === 0 ? 'Vence hoy' : `Vence en ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}`,
      daysLeft,
      tone: 'warn',
    };
  }
  return { type, state: 'vigente', label: `${daysLeft} días de vigencia`, daysLeft, tone: 'ok' };
}