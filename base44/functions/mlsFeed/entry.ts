import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Feed de la bolsa para otras agencias: lo llama su CRM con el token del enlace.
const PUBLIC_STATUSES = ['disponible', 'reservado'];
const MAX_LISTINGS = 300;

const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

const numeric = (value) =>
  value !== null && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null;

function feedListing(listing) {
  return {
    id: listing.id,
    title: clean(listing.title, 200),
    reference: clean(listing.reference, 60),
    operation: listing.operation === 'alquiler' ? 'alquiler' : 'venta',
    property_type: clean(listing.property_type, 40) || 'piso',
    zone: clean(listing.zone, 120),
    municipality: clean(listing.municipality, 120),
    price: numeric(listing.price),
    surface: numeric(listing.surface),
    rooms: numeric(listing.rooms),
    bathrooms: numeric(listing.bathrooms),
    description: clean(listing.description, 3000),
    photos: (Array.isArray(listing.photos) ? listing.photos : [])
      .filter((photo) => photo && typeof photo.file_url === 'string' && photo.file_url)
      .slice(0, 12)
      .map((photo) => ({ name: clean(photo.name, 120), file_url: photo.file_url })),
    commission_percent: numeric(listing.commission_percent),
    commission_notes: clean(listing.commission_notes, 500),
    status: PUBLIC_STATUSES.includes(listing.status) ? listing.status : 'disponible',
    published_date: listing.published_date || listing.created_date || '',
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);

    let token = clean(url.searchParams.get('token'), 90);
    if (!token && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      token = clean(body.token, 90);
    }
    if (!token) return Response.json({ error: 'Falta el token del feed' }, { status: 400 });

    const feedPage = await base44.asServiceRole.entities.MlsFeed.filter(
      { token, active: true },
      { limit: 1 }
    );
    const feed = (feedPage.items || [])[0];
    if (!feed) return Response.json({ error: 'Enlace de feed no válido' }, { status: 403 });

    const page = await base44.asServiceRole.entities.MlsListing.filter(
      { status: { $in: PUBLIC_STATUSES } },
      { sort: '-published_date', limit: MAX_LISTINGS }
    );

    // Solo sale cartera propia: lo importado de otra agencia no se reenvía.
    const listings = (page.items || [])
      .filter((listing) => listing.origin !== 'red')
      .map(feedListing);

    return Response.json({
      agency: feed.agency || '',
      version: 1,
      generated_at: new Date().toISOString(),
      count: listings.length,
      listings,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}