import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const OPERATIONS = ['venta', 'alquiler'];

function str(value) {
  return typeof value === 'string' ? value : '';
}

function num(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export default async function (req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS });
  }
  try {
    const url = new URL(req.url);
    const operation = str(url.searchParams.get('operation'));
    const rawLimit = Number(url.searchParams.get('limit'));
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 200, 1), 500);

    const query = { status: 'disponible' };
    if (OPERATIONS.includes(operation)) query.operation = operation;

    const base44 = createClientFromRequest(req);
    const { items } = await base44.asServiceRole.entities.Property.filter(query, {
      sort: '-updated_date',
      limit,
    });

    const properties = items.map((property) => ({
      id: property.id,
      reference: str(property.reference),
      title: str(property.title),
      operation: str(property.operation),
      type: str(property.property_type),
      status: str(property.status),
      price: num(property.price),
      surface: num(property.surface),
      useful_surface: num(property.useful_surface),
      rooms: num(property.rooms),
      bathrooms: num(property.bathrooms),
      floor: str(property.floor),
      year_built: num(property.year_built),
      condition: str(property.condition),
      energy_rating: str(property.energy_rating),
      zone: str(property.zone),
      municipality: str(property.municipality),
      province: str(property.province),
      description: str(property.description),
      features: Array.isArray(property.features) ? property.features : [],
      photos: (Array.isArray(property.photos) ? property.photos : [])
        .map((photo) => photo && photo.file_url)
        .filter(Boolean),
      updated_date: property.updated_date,
    }));

    return Response.json({ ok: true, total: properties.length, properties }, { headers: CORS });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }
}