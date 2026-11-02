import { base44 } from '@/api/base44Client';

export const isoInDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export async function convertListingToClient(listing) {
  const fallbackName = `${listing.publisher_type === 'inmobiliaria' ? 'Inmobiliaria' : 'Particular'} ${listing.zone || ''}`.trim();
  const client = await base44.entities.Client.create({
    name: (listing.contact_name || fallbackName || listing.title).slice(0, 90),
    email: listing.contact_email || '',
    phone: listing.contact_phone || '',
    web: listing.url || '',
    geographic_zone: listing.zone || '',
    notes: `Captado en ${listing.portal}: ${listing.title}${listing.price ? ` · ${listing.price} €` : ''}`,
  });
  await base44.entities.PortalListing.update(listing.id, { status: 'convertido', client_id: client.id });
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