export const TASK_CATEGORIES = [
  {
    id: 'seguimiento',
    label: 'Seguimiento',
    tone: 'border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
  {
    id: 'visita',
    label: 'Visita',
    tone: 'border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    id: 'negociacion',
    label: 'Negociación',
    tone: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'documentacion',
    label: 'Documentación',
    tone: 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    id: 'administrativa',
    label: 'Administrativa',
    tone: 'border-border bg-muted text-muted-foreground',
  },
  {
    id: 'otro',
    label: 'Otra',
    tone: 'border-border bg-muted text-muted-foreground',
  },
];

export const DEFAULT_CATEGORY = 'seguimiento';

const BY_ID = TASK_CATEGORIES.reduce((acc, item) => ({ ...acc, [item.id]: item }), {});

export function taskCategory(id) {
  return BY_ID[id] || BY_ID.otro;
}