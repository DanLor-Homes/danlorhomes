const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const PHOTO_PATTERNS = [
  /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
  /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i,
  /"image"\s*:\s*"(https?:\\?\/\\?\/[^"]+\.(?:jpe?g|png|webp)[^"]*)"/i,
  /<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpe?g|png|webp)[^"']*)["']/i,
];

const MAX_LISTINGS = 12;
const BATCH = 6;

const isPhotoUrl = (value) =>
  /^https?:\/\//i.test(value) && /\.(jpe?g|png|webp)(\?|$)/i.test(value) && !/logo|icon|sprite|favicon|avatar/i.test(value);

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
    // Sin foto por esta vía: la ficha se queda con el marcador de "sin foto".
  }
  return found;
}

export async function resolveListingPhotos(base44, listings) {
  const targets = (Array.isArray(listings) ? listings : [])
    .filter((item) => item?.id && item?.url && !item?.image_url)
    .slice(0, MAX_LISTINGS);
  if (!targets.length) return [];

  const direct = await fetchInBatches(targets.map((item) => item.url));
  const resolved = new Map();
  targets.forEach((item, index) => {
    if (direct[index]) resolved.set(item.id, direct[index]);
  });

  const missing = targets.filter((item) => !resolved.has(item.id));
  if (missing.length) {
    const searched = await photosFromSearch(base44, missing);
    missing.forEach((item) => {
      const photo = searched.get(item.url);
      if (photo) resolved.set(item.id, photo);
    });
  }

  return targets.map((item) => ({ id: item.id, image_url: resolved.get(item.id) || '' }));
}