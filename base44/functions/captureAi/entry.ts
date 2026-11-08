import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const SEGMENTS = ['propietarios', 'compradores', 'inversores', 'alquiler'];
const PROPERTY_TYPES = ['piso', 'atico', 'adosado', 'chalet', 'local', 'oficina', 'garaje', 'nave', 'terreno'];

const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

const CONTEXT = `Eres el director comercial de DAN&LOR Servicios Inmobiliarios, agencia de captación, venta y alquiler en la Costa del Sol. Escribes para el equipo comercial, que usará tus textos tal cual con clientes reales. Español de España, tuteo, frases cortas, sin emojis y sin mayúsculas gritonas. Cuida la ortografía: mayúscula al inicio de cada frase, en nombres propios y en la marca, que se escribe siempre "DAN&LOR Servicios Inmobiliarios" (nunca en minúsculas ni abreviada). Importes en euros con separador de miles (ej. 320.000 €). No inventes inmuebles, precios, direcciones, fechas ni gestiones: si falta información, propone cómo conseguirla.`;

const SCHEMAS = {
  campaign: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      summary: { type: 'string' },
      channels: {
        type: 'array',
        items: {
          type: 'object',
          properties: { name: { type: 'string' }, action: { type: 'string' } },
          required: ['name', 'action'],
        },
      },
      messages: {
        type: 'array',
        items: {
          type: 'object',
          properties: { channel: { type: 'string' }, content: { type: 'string' } },
          required: ['channel', 'content'],
        },
      },
      call_script: {
        type: 'array',
        items: {
          type: 'object',
          properties: { step: { type: 'string' }, text: { type: 'string' } },
          required: ['step', 'text'],
        },
      },
      first_steps: { type: 'array', items: { type: 'string' } },
    },
    required: ['title', 'summary', 'channels', 'messages', 'first_steps'],
  },
  owner: {
    type: 'object',
    properties: {
      headline: { type: 'string' },
      ad: {
        type: 'object',
        properties: { title: { type: 'string' }, description: { type: 'string' } },
        required: ['title', 'description'],
      },
      whatsapp: { type: 'string' },
      email: {
        type: 'object',
        properties: { subject: { type: 'string' }, body: { type: 'string' } },
        required: ['subject', 'body'],
      },
      pitch: { type: 'array', items: { type: 'string' } },
      objections: {
        type: 'array',
        items: {
          type: 'object',
          properties: { topic: { type: 'string' }, answer: { type: 'string' } },
          required: ['topic', 'answer'],
        },
      },
    },
    required: ['headline', 'ad', 'whatsapp', 'email', 'pitch'],
  },
  qualify: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      ranked: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            priority: { type: 'string', enum: ['alta', 'media', 'baja'] },
            reason: { type: 'string' },
            next_action: { type: 'string' },
          },
          required: ['name', 'priority', 'reason', 'next_action'],
        },
      },
      quick_wins: { type: 'array', items: { type: 'string' } },
    },
    required: ['summary', 'ranked', 'quick_wins'],
  },
  listing: {
    type: 'object',
    properties: {
      headline: { type: 'string' },
      attraction: { type: 'string', enum: ['alta', 'media', 'baja'] },
      summary: { type: 'string' },
      signals: {
        type: 'array',
        items: {
          type: 'object',
          properties: { title: { type: 'string' }, detail: { type: 'string' } },
          required: ['title', 'detail'],
        },
      },
      angles: { type: 'array', items: { type: 'string' } },
      whatsapp: { type: 'string' },
      email: {
        type: 'object',
        properties: { subject: { type: 'string' }, body: { type: 'string' } },
        required: ['subject', 'body'],
      },
      call_script: {
        type: 'array',
        items: {
          type: 'object',
          properties: { step: { type: 'string' }, text: { type: 'string' } },
          required: ['step', 'text'],
        },
      },
      next_action: { type: 'string' },
    },
    required: ['headline', 'attraction', 'summary', 'signals', 'angles', 'whatsapp', 'email', 'next_action'],
  },
  priority: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      ranked: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            ref: { type: 'number' },
            title: { type: 'string' },
            priority: { type: 'string', enum: ['alta', 'media', 'baja'] },
            reason: { type: 'string' },
            next_action: { type: 'string' },
          },
          required: ['ref', 'priority', 'reason', 'next_action'],
        },
      },
      quick_wins: { type: 'array', items: { type: 'string' } },
    },
    required: ['summary', 'ranked', 'quick_wins'],
  },
  duplicates: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      groups: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            match_reason: { type: 'string' },
            listing_ids: { type: 'array', items: { type: 'string' } },
            keep_id: { type: 'string' },
          },
          required: ['match_reason', 'listing_ids', 'keep_id'],
        },
      },
    },
    required: ['summary', 'groups'],
  },
};

function campaignPrompt(input) {
  return `${CONTEXT}

DISEÑA UNA CAMPAÑA DE CAPTACIÓN DE CLIENTES.
ZONA O MUNICIPIO: ${input.zone}
PÚBLICO OBJETIVO: ${input.segment}
OBJETIVO DEL EQUIPO: ${input.goal || 'conseguir nuevas fichas y oportunidades en las próximas 4 semanas'}

Devuelve:
- title: nombre corto de la campaña, máximo 60 caracteres.
- summary: en dos frases, a quién va dirigida y qué la hace distinta.
- channels: tres o cuatro canales concretos; en name el canal y en action la acción exacta con su frecuencia semanal.
- messages: un mensaje listo para enviar por cada canal relevante, de 40 a 90 palabras; en channel indica el canal y en content el texto completo (si es email, empieza con "Asunto: ").
- call_script: guion de llamada en cuatro o cinco pasos; en step el momento y en text lo que dice el agente.
- first_steps: tres acciones para esta semana, en orden.
Realista para una agencia pequeña; no inventes presupuestos.`;
}

function ownerPrompt(input) {
  return `${CONTEXT}

TEXTOS PARA CAPTAR UN PROPIETARIO.
ZONA O DIRECCIÓN: ${input.zone}
TIPO DE INMUEBLE: ${input.propertyType}
DATOS APORTADOS POR EL EQUIPO: ${input.notes || 'sin datos adicionales; redacta de forma versátil y sin inventar características'}

Devuelve:
- headline: titular de ocho palabras como máximo para el anuncio o la ficha.
- ad: anuncio con title (máximo 70 caracteres) y description (de 80 a 120 palabras).
- whatsapp: mensaje de 40 a 70 palabras para enviar al propietario proponiendo una valoración, sin citar fechas ni días concretos (solo pregunta su disponibilidad).
- email: subject (máximo 70 caracteres) y body de 90 a 140 palabras.
- pitch: cuatro argumentos breves y concretos para confiar la venta o el alquiler a la agencia.
- objections: tres objeciones típicas (precio, comisión, exclusiva) con la respuesta del agente.
Usa solo los datos anteriores; no inventes superficies, año, estado ni extras.`;
}

function qualifyPrompt(leads) {
  const lines = leads
    .map(
      (lead, index) =>
        `${index + 1}. ${lead.name} · estado ${lead.status || 'sin estado'} · zona ${lead.zone || 'sin zona'} · puntuación ${lead.score} · ${lead.days} días sin contacto · pipeline abierto ${lead.value} €`
    )
    .join('\n');

  return `${CONTEXT}

PRIORIZA LOS LEADS DE LA CARTERA SEGÚN SU PROBABILIDAD REAL DE CERRAR.
LEADS (ya ordenados por la puntuación interna del CRM):
${lines}

Devuelve:
- summary: en dos frases, dónde está ahora mismo la mejor oportunidad y qué la frena.
- ranked: una entrada por cada lead recibido, usando exactamente su nombre; priority alta, media o baja; reason con el dato concreto que lo justifica; next_action con la acción y el canal, incluyendo una pregunta o dos opciones de día y hora.
- quick_wins: tres acciones para hoy, muy breves.
No inventes datos que no aparezcan en la lista ni añadas leads que no estén.`;
}

function listingPrompt(input) {
  const perM2 = input.price && input.surface ? Math.round(input.price / input.surface) : null;
  return `${CONTEXT}

ANALIZA UN ANUNCIO DE UN PROPIETARIO PARTICULAR Y PREPARA SU CAPTACIÓN.
PORTAL: ${input.portal || 'sin especificar'}
TÍTULO: ${input.title}
OPERACIÓN: ${input.operation} · TIPO: ${input.propertyType}
ZONA: ${input.zone || 'sin especificar'}
PRECIO: ${input.price ? `${input.price} €` : 'no publicado'}${perM2 ? ` (${perM2} €/m²)` : ''}
SUPERFICIE: ${input.surface ? `${input.surface} m²` : 'sin especificar'}
HABITACIONES: ${input.rooms || 'sin dato'} · BAÑOS: ${input.bathrooms || 'sin dato'}
ANTIGÜEDAD PUBLICADO: ${input.publishedHint || 'sin dato'}
CONTACTO: ${input.contactName || 'sin nombre'} · teléfono ${input.hasPhone ? 'publicado' : 'no publicado'} · email ${input.hasEmail ? 'publicado' : 'no publicado'}
DESCRIPCIÓN: ${input.description || 'sin descripción'}

Devuelve:
- headline: titular de ocho palabras máximo con el ángulo de captación.
- attraction: alta, media o baja según el interés real de captar este inmueble (señales de propietario directo, precio, tiempo publicado, anuncio incompleto, urgencia).
- summary: dos frases con la lectura comercial del anuncio.
- signals: de tres a cuatro señales concretas del anuncio; en title el aspecto y en detail qué implica.
- angles: tres argumentos de negociación o de valor para la llamada, concretos y sin promesas.
- whatsapp: mensaje de 40 a 70 palabras para el propietario, sin fechas ni días concretos, preguntando su disponibilidad.
- email: subject de 70 caracteres máximo y body de 90 a 140 palabras.
- call_script: cuatro pasos de llamada; en step el momento y en text lo que dice el agente.
- next_action: la siguiente gestión concreta, en una frase.
Usa solo los datos del anuncio; no inventes superficies, estado, año ni extras.`;
}

function priorityPrompt(listings) {
  const lines = listings
    .map(
      (item) =>
        `${item.ref}. ${item.title} · ${item.portal || 'portal'} · ${item.zone || 'sin zona'} · ${item.operation} · ${item.price ? `${item.price} €` : 'precio no publicado'} · ${item.surface ? `${item.surface} m²` : 'superficie sin dato'} · ${item.days} días detectado · estado ${item.status}`
    )
    .join('\n');

  return `${CONTEXT}

PRIORIZA QUÉ ANUNCIO DE PROPIETARIO PARTICULAR DEBEMOS LLAMAR ANTES.
ANUNCIOS CAPTADOS EN VARIOS PORTALES:
${lines}

Devuelve:
- summary: dos frases sobre dónde está la mejor captación hoy y qué la frena.
- ranked: una entrada por cada anuncio recibido, de más a menos urgente, con el número recibido en ref; priority alta, media o baja; reason con el dato concreto que lo justifica; next_action con la gestión y el canal.
- quick_wins: tres llamadas o mensajes para hoy, muy breves.
No añadas anuncios que no estén en la lista ni inventes datos.`;
}

function duplicatesPrompt(listings) {
  const lines = listings
    .map(
      (item) =>
        `ID ${item.id} | ${item.title} | ${item.portal} | ${item.zone || 'sin zona'} | ${item.operation} | ${item.price ? `${item.price} €` : 'sin precio'} | ${item.surface ? `${item.surface} m²` : 'sin superficie'} | ${item.rooms || 'sin dato'} hab.`
    )
    .join('\n');

  return `${CONTEXT}

DETECTA EL MISMO INMUEBLE PUBLICADO EN VARIOS PORTALES.
ANUNCIOS:
${lines}

Reglas:
- Solo agrupa anuncios que parezcan el mismo inmueble (título y descripción equivalentes, misma zona, superficie y precio compatibles). Ante la duda, no los agrupes.
- Un anuncio no puede estar en dos grupos.
- Devuelve únicamente grupos de dos o más anuncios; si no hay coincidencias, groups vacío.
- Usa exactamente los ID recibidos, sin inventar ninguno.
- keep_id: el ID del anuncio más completo y con el precio más bajo del grupo.
- match_reason: en una frase, por qué son el mismo inmueble.
- summary: una frase con el resultado.
Además, quick_wins no aplica aquí: no lo devuelvas.`;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const tool = ['campaign', 'owner', 'qualify', 'listing', 'priority', 'duplicates'].includes(payload.tool)
      ? payload.tool
      : '';

    let prompt = '';
    let allowedIds = null;

    if (tool === 'campaign') {
      const input = {
        zone: clean(payload.zone, 80),
        segment: SEGMENTS.includes(payload.segment) ? payload.segment : 'propietarios',
        goal: clean(payload.goal, 300),
      };
      if (!input.zone) return Response.json({ error: 'La zona es obligatoria' }, { status: 400 });
      prompt = campaignPrompt(input);
    } else if (tool === 'owner') {
      const input = {
        zone: clean(payload.zone, 120),
        propertyType: PROPERTY_TYPES.includes(payload.propertyType) ? payload.propertyType : 'piso',
        notes: clean(payload.notes, 500),
      };
      if (!input.zone) return Response.json({ error: 'La zona es obligatoria' }, { status: 400 });
      prompt = ownerPrompt(input);
    } else if (tool === 'qualify') {
      const leads = (Array.isArray(payload.leads) ? payload.leads : [])
        .slice(0, 12)
        .map((lead) => ({
          name: clean(lead?.name, 80),
          status: clean(lead?.status, 30),
          zone: clean(lead?.zone, 60),
          score: Number.isFinite(lead?.score) ? Math.round(lead.score) : 0,
          days: Number.isFinite(lead?.days) ? Math.max(0, Math.round(lead.days)) : 0,
          value: Number.isFinite(lead?.value) ? Math.round(lead.value) : 0,
        }))
        .filter((lead) => lead.name);
      if (leads.length === 0) return Response.json({ error: 'No hay leads que analizar' }, { status: 400 });
      prompt = qualifyPrompt(leads);
    } else if (tool === 'listing') {
      const raw = payload.listing || {};
      const input = {
        portal: clean(raw.portal, 40),
        title: clean(raw.title, 160),
        operation: clean(raw.operation, 20) === 'alquiler' ? 'alquiler' : 'venta',
        propertyType: PROPERTY_TYPES.includes(raw.propertyType) ? raw.propertyType : 'piso',
        zone: clean(raw.zone, 80),
        price: Number.isFinite(raw.price) ? Math.round(raw.price) : 0,
        surface: Number.isFinite(raw.surface) ? Math.round(raw.surface) : 0,
        rooms: Number.isFinite(raw.rooms) ? Math.round(raw.rooms) : 0,
        bathrooms: Number.isFinite(raw.bathrooms) ? Math.round(raw.bathrooms) : 0,
        publishedHint: clean(raw.publishedHint, 80),
        description: clean(raw.description, 700),
        contactName: clean(raw.contactName, 80),
        hasPhone: Boolean(raw.hasPhone),
        hasEmail: Boolean(raw.hasEmail),
      };
      if (!input.title) return Response.json({ error: 'Falta el anuncio que analizar' }, { status: 400 });
      prompt = listingPrompt(input);
    } else if (tool === 'priority') {
      const listings = (Array.isArray(payload.listings) ? payload.listings : [])
        .slice(0, 15)
        .map((item, index) => ({
          ref: index + 1,
          title: clean(item?.title, 120),
          portal: clean(item?.portal, 40),
          zone: clean(item?.zone, 60),
          operation: clean(item?.operation, 20) === 'alquiler' ? 'alquiler' : 'venta',
          price: Number.isFinite(item?.price) ? Math.round(item.price) : 0,
          surface: Number.isFinite(item?.surface) ? Math.round(item.surface) : 0,
          days: Number.isFinite(item?.days) ? Math.max(0, Math.round(item.days)) : 0,
          status: clean(item?.status, 30),
        }))
        .filter((item) => item.title);
      if (listings.length === 0) return Response.json({ error: 'No hay anuncios que priorizar' }, { status: 400 });
      prompt = priorityPrompt(listings);
    } else if (tool === 'duplicates') {
      const listings = (Array.isArray(payload.listings) ? payload.listings : [])
        .slice(0, 40)
        .map((item) => ({
          id: clean(item?.id, 60),
          title: clean(item?.title, 120),
          portal: clean(item?.portal, 40),
          zone: clean(item?.zone, 60),
          operation: clean(item?.operation, 20) === 'alquiler' ? 'alquiler' : 'venta',
          price: Number.isFinite(item?.price) ? Math.round(item.price) : 0,
          surface: Number.isFinite(item?.surface) ? Math.round(item.surface) : 0,
          rooms: Number.isFinite(item?.rooms) ? Math.round(item.rooms) : 0,
        }))
        .filter((item) => item.id && item.title);
      if (listings.length < 2) {
        return Response.json({ error: 'Necesitas al menos dos anuncios para comparar' }, { status: 400 });
      }
      allowedIds = new Set(listings.map((item) => item.id));
      prompt = duplicatesPrompt(listings);
    } else {
      return Response.json({ error: 'Herramienta no válida' }, { status: 400 });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: SCHEMAS[tool],
    });

    if (tool === 'duplicates' && result && allowedIds) {
      result.groups = (Array.isArray(result.groups) ? result.groups : [])
        .map((group) => {
          const ids = (Array.isArray(group?.listing_ids) ? group.listing_ids : []).filter((id) => allowedIds.has(id));
          return {
            match_reason: clean(group?.match_reason, 200),
            listing_ids: ids,
            keep_id: ids.includes(group?.keep_id) ? group.keep_id : ids[0],
          };
        })
        .filter((group) => group.listing_ids.length > 1);
    }

    return Response.json(result || {});
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}