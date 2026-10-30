export const PORTALS = [
  { id: 'idealista', label: 'Idealista', url: 'https://www.idealista.com' },
  { id: 'fotocasa', label: 'Fotocasa', url: 'https://www.fotocasa.es' },
  { id: 'habitaclia', label: 'Habitaclia', url: 'https://www.habitaclia.com' },
  { id: 'pisos_com', label: 'pisos.com', url: 'https://www.pisos.com' },
  { id: 'milanuncios', label: 'Milanuncios', url: 'https://www.milanuncios.com' },
  { id: 'kyero', label: 'Kyero', url: 'https://www.kyero.com' },
  { id: 'think_spain', label: 'ThinkSpain', url: 'https://www.thinkspain.com' },
  { id: 'otro', label: 'Otro portal', url: '' },
];

export const PROPERTY_TYPES = [
  { id: 'cualquiera', label: 'Cualquier inmueble' },
  { id: 'piso', label: 'Piso' },
  { id: 'chalet', label: 'Chalet o villa' },
  { id: 'adosado', label: 'Adosado' },
  { id: 'atico', label: 'Ático' },
  { id: 'local', label: 'Local comercial' },
  { id: 'oficina', label: 'Oficina' },
  { id: 'terreno', label: 'Terreno' },
];

export const OPERATIONS = [
  { id: 'venta', label: 'Venta' },
  { id: 'alquiler', label: 'Alquiler' },
];

export const LISTING_STATUS = {
  nuevo: { label: 'Nuevo', tone: 'bg-emerald-500/10 text-emerald-400' },
  revisado: { label: 'Revisado', tone: 'bg-muted text-muted-foreground' },
  contactado: { label: 'Contactado', tone: 'bg-primary/10 text-primary' },
  convertido: { label: 'Cliente', tone: 'bg-violet-500/10 text-violet-300' },
  descartado: { label: 'Descartado', tone: 'bg-muted text-muted-foreground' },
};

export function portalLabel(id) {
  return PORTALS.find((p) => p.id === id)?.label || id || 'Portal';
}

export function propertyTypeLabel(id) {
  return PROPERTY_TYPES.find((p) => p.id === id)?.label || 'Inmueble';
}

export function asArray(response) {
  if (Array.isArray(response)) return response;
  return response?.items || [];
}

export function whatsappLink(phone, message) {
  const digits = String(phone || '').replace(/\D/g, '');
  const normalized = digits.length === 9 ? `34${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function mailtoLink(email, subject, message) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}