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

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const tool = ['campaign', 'owner', 'qualify'].includes(payload.tool) ? payload.tool : '';

    let prompt = '';

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
    } else {
      return Response.json({ error: 'Herramienta no válida' }, { status: 400 });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: SCHEMAS[tool],
    });

    return Response.json(result || {});
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}