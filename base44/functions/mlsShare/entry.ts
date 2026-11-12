import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Ficha de la bolsa compartida por enlace: la abren agencias sin sesión en el CRM.
const MAX_INTERESTS_PER_HOUR = 20;
const DUPLICATE_WINDOW_MINUTES = 30;

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

// Solo los datos del inmueble: el contacto personal de la agencia nunca viaja en el enlace.
function publicListing(listing) {
  return {
    id: listing.id,
    title: listing.title,
    reference: listing.reference || '',
    agency: listing.agency || '',
    operation: listing.operation || 'venta',
    property_type: listing.property_type || 'piso',
    zone: listing.zone || '',
    municipality: listing.municipality || '',
    price: listing.price ?? null,
    surface: listing.surface ?? null,
    rooms: listing.rooms ?? null,
    bathrooms: listing.bathrooms ?? null,
    description: listing.description || '',
    photos: (listing.photos || []).filter((photo) => photo?.file_url).slice(0, 12),
    commission_percent: listing.commission_percent ?? null,
    commission_notes: listing.commission_notes || '',
    status: listing.status || 'disponible',
    published_date: listing.published_date || '',
  };
}

export default async function (req) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const id = clean(body.id, 60);
    if (!id) return Response.json({ error: 'Falta el inmueble' }, { status: 400 });

    const listing = await base44.asServiceRole.entities.MlsListing.get(id).catch((error) =>
      error.status === 404 ? null : Promise.reject(error)
    );
    if (!listing || listing.status === 'retirado' || listing.status === 'vendido') {
      return Response.json({ error: 'Este inmueble ya no está disponible' }, { status: 404 });
    }

    if (body.action !== 'interest') {
      return Response.json({ listing: publicListing(listing) });
    }

    // Honeypot: los bots rellenan el campo oculto.
    if (clean(body.website, 200)) return Response.json({ ok: true });

    const agency = clean(body.agency, 120);
    const agentName = clean(body.agent_name, 120);
    const email = clean(body.email, 160);
    const phone = clean(body.phone, 40);
    const message = clean(body.message, 1500);

    if (!agency) return Response.json({ error: 'Indica el nombre de tu agencia' }, { status: 400 });
    if (!email && !phone) {
      return Response.json({ error: 'Añade un email o un teléfono de contacto' }, { status: 400 });
    }
    if (email && !isEmail(email)) {
      return Response.json({ error: 'El email no parece válido' }, { status: 400 });
    }

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recent = await base44.asServiceRole.entities.MlsInterest.count({
      created_date: { $gte: hourAgo },
    });
    if (recent >= MAX_INTERESTS_PER_HOUR) {
      return Response.json(
        { error: 'Estamos recibiendo muchas solicitudes. Inténtalo de nuevo más tarde.' },
        { status: 429 }
      );
    }

    const duplicateSince = new Date(Date.now() - DUPLICATE_WINDOW_MINUTES * 60 * 1000).toISOString();
    const duplicate = await base44.asServiceRole.entities.MlsInterest.count({
      mls_listing_id: listing.id,
      ...(email ? { email } : { phone }),
      created_date: { $gte: duplicateSince },
    });
    if (duplicate > 0) return Response.json({ ok: true });

    await base44.asServiceRole.entities.MlsInterest.create({
      mls_listing_id: listing.id,
      listing_title: listing.title,
      agency,
      agent_name: agentName,
      email,
      phone,
      message,
      status: 'nuevo',
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}