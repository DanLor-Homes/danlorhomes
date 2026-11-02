export const VISIT_RESULTS = [
  { id: 'pendiente', label: 'Por confirmar' },
  { id: 'interesado', label: 'Interesado' },
  { id: 'dudoso', label: 'Dudoso' },
  { id: 'no_interesado', label: 'No interesado' },
];

export const visitResultLabel = (id) => VISIT_RESULTS.find((result) => result.id === id)?.label || 'Sin resultado';

export const VISIT_RESULT_CLASSES = {
  pendiente: 'border-border/70 bg-muted text-muted-foreground',
  interesado: 'border-emerald-500/25 bg-emerald-500/15 text-emerald-400',
  dudoso: 'border-amber-500/25 bg-amber-500/15 text-amber-400',
  no_interesado: 'border-rose-500/25 bg-rose-500/15 text-rose-400',
};