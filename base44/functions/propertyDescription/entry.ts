import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const TYPE_LABELS = {
  piso: 'Piso',
  atico: 'Ático',
  adosado: 'Adosado',
  chalet: 'Chalet',
  local: 'Local comercial',
  oficina: 'Oficina',
  garaje: 'Garaje',
  nave: 'Nave',
  terreno: 'Terreno',
};

const CONDITION_LABELS = {
  nuevo: 'a estrenar',
  reformado: 'reformado',
  buen_estado: 'en buen estado',
  a_reformar: 'para reformar',
};

const LEGAL_LABELS = {
  nota_simple: 'nota simple',
  escritura: 'escritura pública',
  en_tramite: 'documentación en trámite',
  herencia: 'herencia',
  proindiviso: 'proindiviso',
  otro: 'otra situación',
};

const normalize = (value) => (value || '').toString().toLowerCase().trim();

const euro = (value) => (Number(value) ? `${Number(value).toLocaleString('es-ES')} €` : 'consultar');

const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const propertyId = typeof payload.propertyId === 'string' ? payload.propertyId.trim() : '';
    if (!propertyId) return Response.json({ error: 'propertyId is required' }, { status: 400 });

    const property = await base44.entities.Property
      .get(propertyId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!property) return Response.json({ error: 'Not found' }, { status: 404 });

    const operation = property.operation === 'alquiler' ? 'alquiler' : 'venta';
    const zone = property.reference_zone || property.zone || '';

    // Referencias de mercado de la misma zona para posicionar el precio con criterio.
    const [portfolioRes, listingRes] = await Promise.all([
      base44.entities.Property.filter({ operation }, { sort: '-created_date', limit: 80 }).catch(() => ({ items: [] })),
      base44.entities.PortalListing.filter({ operation }, { sort: '-created_date', limit: 80 }).catch(() => ({ items: [] })),
    ]);

    const marketPrices = [...(portfolioRes.items || []), ...(listingRes.items || [])]
      .filter((item) => item.id !== property.id)
      .filter((item) => {
        const itemZone = normalize(item.zone);
        const targetZone = normalize(zone);
        if (!itemZone || !targetZone) return false;
        return itemZone.includes(targetZone) || targetZone.includes(itemZone);
      })
      .filter((item) => Number(item.price) > 0 && Number(item.surface) > 0)
      .map((item) => Math.round(Number(item.price) / Number(item.surface)));

    const medianPriceM2 = median(marketPrices);
    const ownPriceM2 = property.price && property.surface ? Math.round(Number(property.price) / Number(property.surface)) : null;

    const facts = [
      `Tipo: ${TYPE_LABELS[property.property_type] || property.property_type || 'inmueble'} · Operación: ${operation}`,
      `Ubicación: ${[property.zone, property.municipality, property.province].filter(Boolean).join(', ') || 'zona sin definir'}`,
      `Precio: ${euro(property.price)}${property.price && property.price > 0 ? '' : ' (precio sin cerrar)'}`,
      `Superficie: ${property.surface ? `${property.surface} m² construidos` : 'sin definir'} ${
        property.useful_surface ? `· ${property.useful_surface} m² útiles` : ''
      }`,
      `Distribución: ${property.rooms ? `${property.rooms} habitaciones` : 'sin definir'} · ${
        property.bathrooms ? `${property.bathrooms} baños` : 'baños sin definir'
      }`,
      property.floor ? `Planta: ${property.floor}` : '',
      property.year_built ? `Año de construcción: ${property.year_built}` : '',
      property.condition ? `Estado: ${CONDITION_LABELS[property.condition] || property.condition}` : '',
      property.energy_rating ? `Certificado energético: ${String(property.energy_rating).replace('_', ' ')}` : '',
      property.features && property.features.length ? `Extras: ${property.features.join(', ')}` : '',
      property.exclusive ? 'Gestión en exclusiva por DAN&LOR' : '',
      property.legal_status ? `Situación legal: ${LEGAL_LABELS[property.legal_status] || property.legal_status}` : '',
      ownPriceM2 ? `Precio del inmueble: ${ownPriceM2.toLocaleString('es-ES')} €/m²` : '',
      medianPriceM2
        ? `Referencia de la zona: ${medianPriceM2.toLocaleString('es-ES')} €/m² de mediana entre ${marketPrices.length} anuncios comparables`
        : '',
      property.description ? `Descripción actual del anuncio (para mantener el tono, no para copiarla): ${property.description.slice(0, 600)}` : '',
      property.notes ? `Notas internas del agente (contexto, no publicar literalmente): ${property.notes.slice(0, 400)}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const prompt = `Eres el copywriter inmobiliario senior de DAN&LOR Servicios Inmobiliarios, agencia de la Costa del Sol. Escribes fichas que se publican tal cual en Idealista, Fotocasa y en la web de la agencia, y textos para redes sociales.

DATOS REALES DEL INMUEBLE
${facts}

CÓMO ESCRIBIR
- La descripción va dirigida al comprador o inquilino final: empieza por la ubicación y el estilo de vida, sigue con la distribución y el estado, y cierra con una invitación sobria a visitarlo.
- Entre 120 y 180 palabras, en tres párrafos cortos. Español de España.
- Usa solo los datos de arriba. Si un dato falta, no lo inventes ni lo describas como si existiera; omítelo.
- Si hay referencia de zona, explica con naturalidad si el precio está en línea, por encima o por debajo, sin mencionar porcentajes internos ni el número de comparables.
- Nada de mayúsculas gritonas, emojis, signos de exclamación acumulados ni frases tipo "oportunidad única" o "no dejes escapar". Nada de promesas de rentabilidad.
- Si el estado es "para reformar", dilo con honestidad y en positivo (proyecto, potencial).
- Los highlights son 4 o 5 viñetas de máximo 12 palabras, orientadas a beneficio real (luz, orientación, terraza, zona, transporte, eficiencia), sin repetir la descripción.
- El post social es para Instagram o Facebook: 35 a 60 palabras, tono cercano, sin hashtags inventados sobre la zona y con el precio tal como aparece en los datos si existe.
- Revisa tildes y ortografía antes de responder. Importes en euros con separador de miles (ej. 320.000 €).`;

    const copy = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'claude-sonnet-5',
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          highlights: { type: 'array', items: { type: 'string' } },
          social_post: { type: 'string' },
        },
        required: ['description', 'highlights', 'social_post'],
      },
    });

    return Response.json({
      description: (copy?.description || '').trim(),
      highlights: (copy?.highlights || []).slice(0, 5),
      social_post: (copy?.social_post || '').trim(),
      price_per_m2: ownPriceM2,
      market_price_per_m2: medianPriceM2,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}