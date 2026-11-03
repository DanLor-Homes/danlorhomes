import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const CHANNELS = ['email', 'whatsapp'];
const TONES = ['cercano', 'profesional', 'comercial', 'breve'];

function euro(value) {
  if (!value && value !== 0) return '';
  return `${Number(value).toLocaleString('es-ES')} €`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const clientId = typeof payload.clientId === 'string' ? payload.clientId.trim() : '';
    const channel = CHANNELS.includes(payload.channel) ? payload.channel : 'email';
    const tone = TONES.includes(payload.tone) ? payload.tone : 'cercano';
    const objective = typeof payload.objective === 'string' ? payload.objective.trim().slice(0, 400) : '';

    if (!clientId) return Response.json({ error: 'clientId is required' }, { status: 400 });

    const client = await base44.entities.Client.get(clientId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!client) return Response.json({ error: 'Not found' }, { status: 404 });

    const [interactionsRes, oppRes] = await Promise.all([
      base44.entities.Interaction.filter({ client_id: clientId }, { sort: '-date', limit: 8 }),
      base44.entities.Opportunity.filter({ client_id: clientId }, { sort: '-updated_date', limit: 5 }),
    ]);

    const interactions = (interactionsRes.items || [])
      .map((item) => {
        const date = item.date ? new Date(item.date).toLocaleDateString('es-ES') : '';
        const text = (item.content || '').replace(/\s+/g, ' ').slice(0, 220);
        return `- ${date} · ${item.type}${item.result ? ` (${item.result})` : ''}: ${text}`;
      })
      .join('\n');

    const opportunities = (oppRes.items || [])
      .map((op) => `- ${op.name} · etapa ${op.stage} · ${euro(op.amount)}`)
      .join('\n');

    const profile = [
      client.operation_interest ? `Operación: ${client.operation_interest}` : '',
      client.budget_max ? `Presupuesto hasta ${euro(client.budget_max)}` : '',
      client.search_zones ? `Zonas: ${client.search_zones}` : '',
      client.property_types?.length ? `Tipos: ${client.property_types.join(', ')}` : '',
      client.min_rooms ? `Habitaciones mínimas: ${client.min_rooms}` : '',
      client.geographic_zone ? `Zona del cliente: ${client.geographic_zone}` : '',
    ]
      .filter(Boolean)
      .join(' · ');

    const formatInstructions =
      channel === 'email'
        ? 'Devuelve un email con asunto (máximo 70 caracteres) y cuerpo con saludo, dos o tres párrafos cortos y despedida firmada por "Equipo de DAN&LOR Servicios Inmobiliarios".'
        : 'Devuelve un mensaje de WhatsApp de menos de 90 palabras, sin asunto (deja subject vacío), sin saludo formal largo y con una sola pregunta final.';

    const prompt = `Redacta un borrador de mensaje para un cliente del CRM inmobiliario DAN&LOR.

CANAL: ${channel}
TONO: ${tone}
OBJETIVO DEL MENSAJE: ${objective || 'Retomar el contacto y proponer el siguiente paso comercial'}

FICHA DEL CLIENTE
Nombre: ${client.name}
Persona de contacto: ${client.contact_person || 'no indicada'}
Perfil de búsqueda: ${profile || 'sin definir'}
Notas internas: ${(client.notes || '').slice(0, 400) || 'ninguna'}

OPORTUNIDADES
${opportunities || 'sin oportunidades registradas'}

ÚLTIMAS INTERACCIONES
${interactions || 'sin interacciones registradas'}

REGLAS
- Español de España, tuteo, tono ${tone}. Sin emojis ni mayúsculas gritonas.
- Importes en euros y fechas en formato dd/mm/aaaa.
- Usa solo los datos anteriores; no inventes inmuebles, precios, fechas ni nombres.
- Frases cortas, sin relleno comercial agresivo. Cierra con una llamada a la acción concreta y fácil de responder.
- ${formatInstructions}
- No incluyas marcadores tipo [nombre] ni explicaciones fuera del mensaje.`;

    const draft = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['subject', 'body'],
      },
    });

    return Response.json({
      subject: channel === 'email' ? (draft?.subject || '').trim() : '',
      body: (draft?.body || '').trim(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}