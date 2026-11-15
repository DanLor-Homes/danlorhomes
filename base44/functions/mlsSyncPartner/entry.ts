import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Sincronización manual: trae la cartera de una agencia desde su enlace de feed.
const OPERATIONS = ['venta', 'alquiler'];
const PROPERTY_TYPES = ['piso', 'atico', 'adosado', 'chalet', 'local', 'oficina', 'garaje', 'nave', 'terreno'];
const STATUSES = ['disponible', 'reservado', 'vendido', 'retirado'];
const MAX_LISTINGS = 400;

const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

const numeric = (value) =>
  value !== null && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null;

function feedPayload(item, partner) {
  return {
    title: clean(item.title, 200) || 'Inmueble de la red',
    reference: clean(item.reference, 60),
    agency: partner.name,
    origin: 'red',
    agent_name: clean(partner.contact_person, 120) || clean(item.agent_name, 120),
    agent_email: clean(partner.email, 160) || clean(item.agent_email, 160),
    agent_phone: clean(partner.phone, 40) || clean(item.agent_phone, 40),
    operation: OPERATIONS.includes(item.operation) ? item.operation : 'venta',
    property_type: PROPERTY_TYPES.includes(item.property_type) ? item.property_type : 'piso',
    zone: clean(item.zone, 120),
    municipality: clean(item.municipality, 120),
    price: numeric(item.price),
    surface: numeric(item.surface),
    rooms: numeric(item.rooms),
    bathrooms: numeric(item.bathrooms),
    description: clean(item.description, 3000),
    photos: (Array.isArray(item.photos) ? item.photos : [])
      .filter((photo) => photo && typeof photo.file_url === 'string' && photo.file_url)
      .slice(0, 12)
      .map((photo) => ({ name: clean(photo.name, 120), file_url: photo.file_url })),
    commission_percent: numeric(item.commission_percent),
    commission_notes: clean(item.commission_notes, 500),
    status: STATUSES.includes(item.status) ? item.status : 'disponible',
    feed_partner_id: partner.id,
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const partnerId = clean(body.partner_id, 80);
    if (!partnerId) return Response.json({ error: 'Falta la agencia' }, { status: 400 });

    const partner = await base44.entities.MlsPartner.get(partnerId).catch((error) =>
      error.status === 404 ? null : Promise.reject(error)
    );
    if (!partner) return Response.json({ error: 'Agencia no encontrada' }, { status: 404 });

    const feedUrl = clean(partner.feed_url, 500);
    if (!/^https?:\/\//i.test(feedUrl)) {
      return Response.json({ error: 'Esta agencia no tiene un enlace de feed' }, { status: 400 });
    }

    let items = null;
    let failure = '';
    try {
      const response = await fetch(feedUrl, {
        signal: AbortSignal.timeout(15000),
        headers: { accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`El feed de ${partner.name} respondió ${response.status}`);
      const data = await response.json();
      items = Array.isArray(data) ? data : Array.isArray(data?.listings) ? data.listings : null;
      if (!items) throw new Error('El enlace no devuelve un feed de inmuebles');
    } catch (error) {
      failure = clean(error.message, 200);
    }

    if (failure) {
      await base44.entities.MlsPartner.update(partner.id, { last_sync_error: failure });
      return Response.json({ error: failure }, { status: 502 });
    }

    const existingPage = await base44.entities.MlsListing.filter(
      { feed_partner_id: partner.id },
      { limit: MAX_LISTINGS }
    );
    const existing = existingPage.items || [];
    const byExternal = new Map();
    existing.forEach((listing) => {
      if (listing.external_id) byExternal.set(listing.external_id, listing);
    });

    const toCreate = [];
    const toUpdate = [];
    const seen = new Set();

    items.slice(0, MAX_LISTINGS).forEach((item, index) => {
      if (!item || typeof item !== 'object') return;
      const externalId = clean(item.id || item.reference || item.title, 120) || `item-${index}`;
      if (seen.has(externalId)) return;
      seen.add(externalId);

      const payload = feedPayload(item, partner);
      const current = byExternal.get(externalId);
      if (current) {
        toUpdate.push({ id: current.id, ...payload });
      } else {
        toCreate.push({
          ...payload,
          external_id: externalId,
          published_date: item.published_date || new Date().toISOString(),
        });
      }
    });

    // Lo que ya no viene en el feed deja de estar disponible para tus clientes.
    const toRetire = existing
      .filter((listing) => listing.external_id && !seen.has(listing.external_id) && listing.status !== 'retirado')
      .map((listing) => ({ id: listing.id, status: 'retirado' }));

    if (toCreate.length) await base44.entities.MlsListing.bulkCreate(toCreate);
    if (toUpdate.length) await base44.entities.MlsListing.bulkUpdate(toUpdate);
    if (toRetire.length) await base44.entities.MlsListing.bulkUpdate(toRetire);

    const summary = {
      created: toCreate.length,
      updated: toUpdate.length,
      retired: toRetire.length,
      total: seen.size,
    };

    await base44.entities.MlsPartner.update(partner.id, {
      last_sync_at: new Date().toISOString(),
      last_sync_count: summary.total,
      last_sync_error: '',
    });

    return Response.json(summary);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}