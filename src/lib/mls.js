export const DEFAULT_AGENCY = 'DAN&LOR HOMES';

export const MLS_STATUSES = [
  { id: 'disponible', label: 'Disponible' },
  { id: 'reservado', label: 'Reservado' },
  { id: 'vendido', label: 'Vendido' },
  { id: 'retirado', label: 'Retirado' },
];

export const MLS_STATUS_STYLES = {
  disponible: 'bg-chart-2/15 text-chart-2',
  reservado: 'bg-chart-3/15 text-chart-3',
  vendido: 'bg-primary/15 text-primary',
  retirado: 'bg-muted text-muted-foreground',
};

export const mlsStatusLabel = (id) => MLS_STATUSES.find((s) => s.id === id)?.label || '—';

export const INTEREST_STATUSES = [
  { id: 'nuevo', label: 'Nuevo' },
  { id: 'contactado', label: 'Contactado' },
  { id: 'cerrado', label: 'Cerrado' },
];

export const INTEREST_STATUS_STYLES = {
  nuevo: 'bg-chart-3/15 text-chart-3',
  contactado: 'bg-chart-2/15 text-chart-2',
  cerrado: 'bg-primary/15 text-primary',
};

export const interestStatusLabel = (id) =>
  INTEREST_STATUSES.find((s) => s.id === id)?.label || '—';

export const emptyMlsFilters = () => ({
  q: '',
  operation: '',
  property_type: '',
  zone: '',
  status: 'disponible',
  max_price: '',
});

export function isMineListing(listing, userId) {
  if (!listing) return false;
  if (listing.property_id) return true;
  return Boolean(userId) && listing.created_by_id === userId;
}