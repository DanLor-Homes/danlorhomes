export const CLIENT_STATUSES = [
  { id: 'nuevo', label: 'Nuevo', className: 'bg-muted/60 text-muted-foreground' },
  { id: 'contactado', label: 'Contactado', className: 'bg-sky-500/15 text-sky-400' },
  { id: 'en_seguimiento', label: 'En seguimiento', className: 'bg-amber-500/15 text-amber-400' },
  { id: 'visita', label: 'Visita', className: 'bg-violet-500/15 text-violet-400' },
  { id: 'cliente', label: 'Cliente', className: 'bg-emerald-500/15 text-emerald-400' },
  { id: 'descartado', label: 'Descartado', className: 'bg-rose-500/15 text-rose-400' },
];

export function statusMeta(id) {
  return CLIENT_STATUSES.find((status) => status.id === id) || CLIENT_STATUSES[0];
}