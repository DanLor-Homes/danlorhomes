const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const PHOTO_PATTERNS = [
  /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
  /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i,
  /"image"\s*:\s*"(https?:\\?\/\\?\/[^"]+\.(?:jpe?g|png|webp)[^"]*)"/i,
  /<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpe?g|png|webp)[^"']*)["']/i,
];

const MAX_LISTINGS = 8;
const BATCH = 6;

// Portales que bloquean cualquier descarga desde el servidor: se va directo a la imagen orientativa.
const BLOCKED_PORTALS = new Set(['idealista', 'milanuncios', 'fotocasa']);

const isPhotoUrl = (value) =>
  /^https?:\/\//i.test(value) && /\.(jpe?g|png|webp)(\?|$)/i.test(value) && !/logo|icon|sprite|favicon|avatar/i.test(value);

const isBlocked = (listing) => BLOCKED_PORTALS.has(String(listing?.portal || '').toLowerCase());

export function photoFromHtml(html) {
  if (!html) return '';
  for (const pattern of PHOTO_PATTERNS) {
    const match = html.match(pattern);
    if (!match) continue;
    const url = match[1].replace(/\\\//g, '/');
    if (isPhotoUrl(url)) return url.slice(0, 500);
  }
  return '';
}

async function photoFromPage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': UA,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'es-ES,es;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return '';
    const html = await response.text();
    if (html.length < 1500) return '';
    return photoFromHtml(html);
  } catch {
    return '';
  }
}

async function fetchInBatches(urls) {
  const results = [];
  for (let index = 0; index < urls.length; index += BATCH) {
    const slice = urls.slice(index, index + BATCH);
    const settled = await Promise.allSettled(slice.map((url) => photoFromPage(url)));
    settled.forEach((entry) => results.push(entry.status === 'fulfilled' ? entry.value : ''));
  }
  return results;
}

async function photosFromSearch(base44, listings) {
  const found = new Map();
  if (!listings.length) return found;
  const list = listings
    .slice(0, MAX_LISTINGS)
    .map((item, index) => `${index + 1}. ${item.title || 'Inmueble'} — ${item.url}`)
    .join('\n');

  const prompt = `Abre cada una de estas fichas de anuncios inmobiliarios en portales españoles y devuelve la URL directa de la foto principal del inmueble de cada ficha.

Fichas:
${list}

Reglas:
- image_url debe ser una URL https real de la foto del inmueble que aparece en esa ficha, terminada en .jpg, .jpeg, .png o .webp (no logos, iconos, planos ni imágenes de marca del portal).
- Devuelve una entrada por ficha, copiando la url exactamente como se ha indicado.
- Si una ficha no muestra foto o no puedes acceder, devuelve image_url como cadena vacía. Nunca inventes URLs.`;

  try {
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_8_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          photos: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                image_url: { type: 'string' },
              },
              required: ['url', 'image_url'],
            },
          },
        },
        required: ['photos'],
      },
    });
    const data = typeof result === 'string' ? JSON.parse(result) : result;
    const photos = Array.isArray(data) ? data : data?.photos;
    (Array.isArray(photos) ? photos : []).forEach((entry) => {
      const url = String(entry?.url || '').trim();
      const image = String(entry?.image_url || '').trim();
      if (url && isPhotoUrl(image)) found.set(url, image.slice(0, 500));
    });
  } catch {
    // Sin foto por esta vía: se intentará generar una imagen orientativa.
  }
  return found;
}

const TYPE_SCENES = {
  piso: 'salón luminoso de un piso urbano reformado con ventanales grandes',
  atico: 'ático con terraza privada y vistas abiertas a la ciudad',
  'ático': 'ático con terraza privada y vistas abiertas a la ciudad',
  duplex: 'dúplex moderno con escalera interior y doble altura',
  'dúplex': 'dúplex moderno con escalera interior y doble altura',
  estudio: 'estudio diáfano reformado con cocina integrada',
  chalet: 'exterior de un chalet mediterráneo con jardín y piscina',
  adosado: 'fachada de una vivienda adosada con pequeño jardín',
  casa: 'fachada de una casa unifamiliar reformada',
  local: 'interior diáfano de un local comercial a pie de calle',
  oficina: 'oficina diáfana moderna con puestos de trabajo',
  garaje: 'interior de un garaje con plaza de aparcamiento',
  nave: 'interior diáfano de una nave industrial',
  terreno: 'parcela urbana con vistas despejadas',
};

function buildPhotoPrompt(listing) {
  const rawType = String(listing.property_type || 'piso').toLowerCase();
  const scene = TYPE_SCENES[rawType] || `interior reformado de un ${rawType}`;
  const zone = listing.zone ? ` en ${listing.zone}` : '';
  const mode = listing.operation === 'alquiler' ? 'en alquiler' : 'en venta';
  const specs = [
    listing.rooms ? `${listing.rooms} habitaciones` : '',
    listing.bathrooms ? `${listing.bathrooms} baños` : '',
    listing.surface ? `${listing.surface} m²` : '',
  ]
    .filter(Boolean)
    .join(', ');

  return `Fotografía inmobiliaria profesional hiperrealista de un inmueble español ${mode}${zone}: ${scene}${
    specs ? ` (${specs})` : ''
  }. Estilo de reportaje de portal inmobiliario, gran angular, luz natural cálida de día, decoración neutra actual, materiales reales, composición cuidada en horizontal. Sin texto, sin marcas de agua, sin logotipos, sin personas.`;
}

async function generateListingPhoto(base44, listing) {
  try {
    const result = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: buildPhotoPrompt(listing),
    });
    const url = typeof result === 'string' ? result : result?.url || '';
    return /^https?:\/\//i.test(url) ? url : '';
  } catch {
    return '';
  }
}

/**
 * Devuelve [{ id, image_url, generated }] para cada anuncio sin foto.
 * Orden: descarga directa de la ficha, búsqueda asistida y, si el portal bloquea
 * el acceso, una imagen orientativa generada a partir de los datos del anuncio.
 */
export async function resolveListingPhotos(base44, listings) {
  const targets = (Array.isArray(listings) ? listings : [])
    .filter((item) => item?.id && item?.url && !item?.image_url)
    .slice(0, MAX_LISTINGS);
  if (!targets.length) return [];

  const resolved = new Map();
  const generated = new Set();

  const fetchable = targets.filter((item) => !isBlocked(item));
  const direct = await fetchInBatches(fetchable.map((item) => item.url));
  fetchable.forEach((item, index) => {
    if (direct[index]) resolved.set(item.id, direct[index]);
  });

  const searchable = targets.filter((item) => !resolved.has(item.id) && !isBlocked(item));
  if (searchable.length) {
    const searched = await photosFromSearch(base44, searchable);
    searchable.forEach((item) => {
      const photo = searched.get(item.url);
      if (photo) resolved.set(item.id, photo);
    });
  }

  const pending = targets.filter((item) => !resolved.has(item.id)).slice(0, MAX_LISTINGS);
  if (pending.length) {
    const photos = await Promise.all(pending.map((item) => generateListingPhoto(base44, item)));
    pending.forEach((item, index) => {
      if (photos[index]) {
        resolved.set(item.id, photos[index]);
        generated.add(item.id);
      }
    });
  }

  return targets.map((item) => ({
    id: item.id,
    image_url: resolved.get(item.id) || '',
    generated: generated.has(item.id),
  }));
}