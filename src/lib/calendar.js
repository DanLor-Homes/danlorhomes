import { INTERACTION_LABELS } from '@/lib/crm';

export const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const dayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const isoDayKey = (iso) => {
  if (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : dayKey(date);
};

export const monthCells = (month) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - startOffset);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const total = startOffset + daysInMonth <= 35 ? 35 : 42;

  return Array.from({ length: total }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, outside: date.getMonth() !== month.getMonth() };
  });
};

export const EVENT_STYLES = {
  reunion: { chip: 'border-primary/25 bg-primary/10 text-primary', dot: 'bg-primary' },
  visita: { chip: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
  llamada: { chip: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  email: { chip: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
  whatsapp: { chip: 'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
  tarea: { chip: 'border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  nota: { chip: 'border-border bg-muted/60 text-muted-foreground', dot: 'bg-muted-foreground' },
};

export const eventStyle = (type) => EVENT_STYLES[type] || EVENT_STYLES.nota;

export const typeLabel = (type) => (type === 'tarea' ? 'Tarea' : INTERACTION_LABELS[type] || type);

export const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(date);
};

export const groupByDay = (events) =>
  events.reduce((acc, event) => {
    if (!event.day) return acc;
    acc[event.day] = [...(acc[event.day] || []), event];
    return acc;
  }, {});