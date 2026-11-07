import { base44 } from '@/api/base44Client';
import { portalLabel } from './portals';

export const isoInDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const KNOWN_TYPES = ['piso', 'atico', 'adosado', 'chalet', 'local', 'oficina', 'garaje', 'nave', 'terreno'];

function normalizeType(value) {
  const raw = String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  if (!raw) return '';
  const match = KNOWN_TYPES.find((type) => raw.includes(type));
  return match || '';
}

/**
 * Recopila todos los datos del anuncio en una ficha de cliente lista para revisar.
 */
export function buildClientDraft(listing) {
  const isAgency = listing.publisher_type === 'inmobiliaria';
  const contactName = (listing.contact_name || '').trim();
  const fallbackName = `${isAgency ? 'Inmobiliaria' : 'Particular'}${listing.zone ? ` ${listing.zone}` : ''}`;
  const name = (contactName || fallbackName || listing.title || 'Cliente').slice(0, 90);
  const price = Number(listing.price) || 0;
  const propertyType = normalizeType(listing.property_type);

  const notes = [
    `Captado en ${portalLabel(listing.portal)}${listing.url ? ` · ${listing.url}` : ''}`,
    listing.title,
    price ? `Precio publicado: ${price.toLocaleString('es-ES')} €` : '',
    listing.surface ? `Superficie: ${listing.surface} m²` : '',
    listing.rooms || listing.bathrooms
      ? [listing.rooms ? `${listing.rooms} hab.` : '', listing.bathrooms ? `${listing.bathrooms} baños` : '']
          .filter(Boolean)
          .join(' · ')
      : '',
    listing.zone ? `Zona: ${listing.zone}` : '',
    listing.published_hint ? `Publicado: ${listing.published_hint}` : '',
    listing.description ? `Descripción: ${String(listing.description).slice(0, 400)}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    name,
    email: listing.contact_email || '',
    phone: listing.contact_phone || '',
    web: listing.url || '',
    contact_person: isAgency ? contactName : '',
    geographic_zone: listing.zone || '',
    notes,
    operation_interest: listing.operation === 'alquiler' ? 'alquiler' : 'venta',
    property_types: propertyType ? [propertyType] : [],
    budget_max: price,
    min_rooms: Number(listing.rooms) || 0,
    search_zones: listing.zone || '',
    daily_property_search: false,
  };
}

export async function markListingConverted(listing, clientId) {
  await base44.entities.PortalListing.update(listing.id, { status: 'convertido', client_id: clientId });
}

export async function convertListingToClient(listing) {
  const client = await base44.entities.Client.create(buildClientDraft(listing));
  await markListingConverted(listing, client.id);
  return client;
}

export async function markListingContacted(listing, assignee) {
  await base44.entities.PortalListing.update(listing.id, { status: 'contactado' });
  await base44.entities.CommercialTask.create({
    title: `Seguimiento del anuncio: ${listing.title}`.slice(0, 90),
    due_date: isoInDays(3),
    status: 'pendiente',
    auto_generated: true,
    assignee: assignee || '',
  });
}

export async function discardListing(listing) {
  await base44.entities.PortalListing.update(listing.id, { status: 'descartado' });
}