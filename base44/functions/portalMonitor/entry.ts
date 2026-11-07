import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { resolveListingPhotos } from '../../shared/listingImage.ts';

const PORTAL_LABELS = {
  idealista: 'Idealista',
  fotocasa: 'Fotocasa',
  habitaclia: 'Habitaclia',
  pisos_com: 'pisos.com',
  milanuncios: 'Milanuncios',
  kyero: 'Kyero',
  think_spain: 'ThinkSpain',
  yaencontre: 'Yaencontre',
  enalquiler: 'Enalquiler',
  tucasa: 'Tucasa',
  spainhouses: 'Spainhouses',
  otro: 'el portal indicado',
};

const PORTAL_DOMAINS = {
  idealista: 'idealista.com',
  fotocasa: 'fotocasa.es',
  habitaclia: 'habitaclia.com',
  pisos_com: 'pisos.com',
  milanuncios: 'milanuncios.com',
  kyero: 'kyero.com',
  think_spain: 'thinkspain.com',
  yaencontre: 'yaencontre.com',
  enalquiler: 'enalquiler.com',
  tucasa: 'tucasa.com',
  spainhouses: 'spainhouses.net',
};

const PROPERTY_LABELS = {
  cualquiera: 'cualquier tipo de inmueble',
  piso: 'pisos',
  chalet: 'chalets y villas',
  adosado: 'adosados',
  atico: 'áticos',
  local: 'locales comerciales',
  oficina: 'oficinas',
  terreno: 'terrenos',
};

const LISTING_SCHEMA = {
  type: 'object',
  properties: {
    listings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          url: { type: 'string' },
          image_url: { type: 'string' },
          price: { type: 'number' },
          zone: { type: 'string' },
          surface: { type: 'number' },
          rooms: { type: 'number' },
          bathrooms: { type: 'number' },
          property_type: { type: 'string' },
          description: { type: 'string' },
          contact_name: { type: 'string' },
          contact_phone: { type: 'string' },
          contact_email: { type: 'string' },
          publisher_type: { type: 'string' },
          published_hint: { type: 'string' },
        },
        required: ['title', 'url'],
      },
    },
  },
  required: ['listings'],
};

const MAX_SOURCES = 6;
const MAX_LISTINGS = 12;
const DAILY_REVIEW_TOKEN = 'danlor-revision-diaria-7f3a';

const text = (value) => (typeof value === 'string' ? value.trim() : '');

const slug = (value) => text(value).toLowerCase().replace(/\s+/g, ' ').replace(/[¿?¡!.,;:()[\]"]/g, '');

const normalizeUrl = (value) => text(value).split('#')[0].split('?')[0].replace(/\/+$/, '').toLowerCase();

const positiveInt = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : null;
};

const dedupeKey = (url, title, price) => normalizeUrl(url) || `${slug(title)}|${positiveInt(price) || ''}`;

function buildPrompt(source) {
  const operation = source.operation === 'alquiler' ? 'alquiler' : 'venta';
  const portal = PORTAL_LABELS[source.portal] || 'un portal inmobiliario';
  const domain = PORTAL_DOMAINS[source.portal] || 'el portal indicado';
  const propertyType = PROPERTY_LABELS[source.property_type] || 'cualquier tipo de inmueble';
  const budget = source.budget_max ? ` Presupuesto máximo: ${Math.round(Number(source.budget_max))} €.` : '';
  const searchUrl = source.portal_url ? ` Búsqueda de referencia: ${source.portal_url}.` : '';

  return `Actúa como analista de captación de una inmobiliaria española. Analiza los inmuebles publicados ahora mismo en ${portal} (dominio ${domain}) en ${operation} de ${propertyType} en la zona de ${source.zone}.${budget}${searchUrl} Devuelve hasta ${MAX_LISTINGS} FICHAS DE ANUNCIO reales, priorizando las publicadas en los últimos 30 días.

Reglas obligatorias:
- Solo páginas de anuncio del dominio ${domain}: fichas de inmueble con precio concreto. Descarta artículos de prensa, blogs, guías, índices de barrio, páginas de resultados, portadas y anuncios de otras zonas.
- url: enlace directo a la ficha del anuncio, no a la home ni a un listado.
- image_url: URL directa de la foto principal del inmueble tal como aparece en la ficha (debe terminar en .jpg, .jpeg, .png o .webp y ser una foto del inmueble, no un logo ni un icono). Cadena vacía si la ficha no muestra foto.
- title: titular del anuncio (tipo de inmueble y zona).
- price: entero en euros sin símbolos (en alquiler, la renta mensual).
- zone: municipio o barrio exacto que figura en la ficha.
- surface en m², rooms y bathrooms como enteros.
- contact_name, contact_phone y contact_email solo si la ficha los muestra públicamente; si no, cadena vacía.
- publisher_type: "inmobiliaria", "particular" o "desconocido".
- published_hint: "publicado hoy", "hace X días" o la fecha visible.
- description: máximo 220 caracteres con datos reales de la ficha.
- Nunca inventes inmuebles, precios, teléfonos ni URLs.
Si no encuentras fichas reales, devuelve listings como array vacío.`;
}

function parseListings(result) {
  let data = result;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }
  const list = Array.isArray(data) ? data : data?.listings;
  return Array.isArray(list) ? list : [];
}

async function scanSource(base44, db, source) {
  const operation = source.operation === 'alquiler' ? 'alquiler' : 'venta';

  const previous = await db.entities.PortalListing.filter({ source_id: source.id }, { limit: 500 });
  const existing = new Set(
    (previous?.items || []).map((item) => dedupeKey(item.url, item.title, item.price))
  );

  const raw = parseListings(
    await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildPrompt(source),
      add_context_from_internet: true,
      model: 'gemini_3_8_flash',
      response_json_schema: LISTING_SCHEMA,
    })
  );

  const seen = new Set();
  const records = [];
  const now = new Date().toISOString();

  raw.forEach((item) => {
    const title = text(item?.title).slice(0, 160);
    const url = text(item?.url);
    if (!title) return;
    const key = dedupeKey(url, title, item?.price);
    if (seen.has(key) || existing.has(key)) return;
    seen.add(key);

    const publisher = ['inmobiliaria', 'particular'].includes(text(item?.publisher_type))
      ? text(item.publisher_type)
      : 'desconocido';

    records.push({
      source_id: source.id,
      portal: source.portal,
      title,
      url,
      image_url: text(item?.image_url).slice(0, 500),
      price: positiveInt(item?.price),
      operation,
      property_type: text(item?.property_type) || source.property_type || 'cualquiera',
      zone: text(item?.zone) || source.zone,
      surface: positiveInt(item?.surface),
      rooms: positiveInt(item?.rooms),
      bathrooms: positiveInt(item?.bathrooms),
      description: text(item?.description).slice(0, 400),
      contact_name: text(item?.contact_name).slice(0, 120),
      contact_phone: text(item?.contact_phone).slice(0, 40),
      contact_email: text(item?.contact_email).slice(0, 140),
      publisher_type: publisher,
      published_hint: text(item?.published_hint).slice(0, 80),
      first_seen: now,
      status: 'nuevo',
    });
  });

  const toCreate = records.slice(0, MAX_LISTINGS);
  if (toCreate.length) {
    const created = (await db.entities.PortalListing.bulkCreate(toCreate)) || [];
    const resolved = await resolveListingPhotos(base44, created);
    const byId = new Map(resolved.map((entry) => [entry.id, entry.image_url]));
    const updates = created.map((item) => {
      const image = byId.get(item.id);
      return image ? { id: item.id, image_url: image, photo_checked: true } : { id: item.id, photo_checked: true };
    });
    if (updates.length) await db.entities.PortalListing.bulkUpdate(updates);
  }
  await db.entities.PortalSource.update(source.id, {
    last_run: now,
    last_result_count: toCreate.length,
  });

  return { label: source.label, created: toCreate.length };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));

    const args = body?.args && typeof body.args === 'object' ? body.args : {};
    const scheduled = !user && (args.token === DAILY_REVIEW_TOKEN || body?.token === DAILY_REVIEW_TOKEN);
    if (!user && !scheduled) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const db = scheduled ? base44.asServiceRole : base44;
    const sourceId = scheduled ? '' : text(body?.source_id || args.source_id);

    let sources = [];
    if (sourceId) {
      const single = await db.entities.PortalSource
        .get(sourceId)
        .catch((error) => (error.status === 404 ? null : Promise.reject(error)));
      if (!single) return Response.json({ error: 'Búsqueda no encontrada' }, { status: 404 });
      sources = [single];
    } else {
      const page = await db.entities.PortalSource.filter(
        { active: true },
        { sort: '-created_date', limit: MAX_SOURCES }
      );
      sources = page?.items || [];
    }

    if (!sources.length) {
      return Response.json({ scanned: 0, created: 0, sources: [] });
    }

    const results = await Promise.allSettled(sources.map((source) => scanSource(base44, db, source)));

    const detail = results.map((result, index) => {
      const label = sources[index].label;
      if (result.status === 'fulfilled') return { label, created: result.value.created };
      return { label, created: 0, error: String(result.reason?.message || result.reason).slice(0, 200) };
    });

    return Response.json({
      run: scheduled ? 'daily_review' : 'manual',
      scanned: sources.length,
      created: detail.reduce((total, item) => total + item.created, 0),
      sources: detail,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}