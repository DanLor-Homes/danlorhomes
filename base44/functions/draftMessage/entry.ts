import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { clientContextText, loadClientIntel } from '../../shared/crmIntel.ts';

const CHANNELS = ['email', 'whatsapp'];
const TONES = ['cercano', 'profesional', 'comercial', 'breve'];

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

    const intel = await loadClientIntel(base44, clientId);
    if (!intel) return Response.json({ error: 'Not found' }, { status: 404 });

    const formatInstructions =
      channel === 'email'
        ? 'Devuelve un email con asunto (máximo 70 caracteres, concreto y sin ganchos vacíos) y cuerpo de 90 a 150 palabras: saludo, dos o tres párrafos cortos y despedida firmada por "Equipo de DAN&LOR Servicios Inmobiliarios".'
        : 'Devuelve un mensaje de WhatsApp de 40 a 70 palabras, sin asunto (deja subject vacío), sin saludo formal largo y con una sola pregunta final.';

    const prompt = `Eres el redactor comercial senior de DAN&LOR Servicios Inmobiliarios, una agencia de captación y venta en la Costa del Sol. Escribes mensajes que el equipo envía tal cual a sus clientes.

CANAL: ${channel}
TONO: ${tone}
OBJETIVO DEL MENSAJE: ${objective || 'Retomar el contacto y proponer el siguiente paso comercial'}

${clientContextText(intel)}

CÓMO ESCRIBIR
- Abre retomando algo concreto de la última interacción o del perfil del cliente; nunca con fórmulas genéricas tipo "espero que estés bien".
- Si hay un inmueble de la cartera que encaja, menciónalo con su zona, precio y un detalle real (habitaciones o superficie). Si no encaja ninguno, no inventes: propone otra vía (visita, ajuste de criterios, valoración).
- Un solo objetivo y una sola llamada a la acción, fácil de responder (una pregunta cerrada o dos opciones de día/hora).
- Si el cliente lleva más de 14 días sin contacto, reconoce el hueco con naturalidad y sin disculpas excesivas.
- Español de España, tuteo, frases cortas. Sin emojis, sin mayúsculas gritonas, sin promesas de resultados ni presión agresiva.
- Ortografía impecable: revisa las tildes antes de responder (más, también, aquí, gustaría, número, teléfono).
- Importes en euros con separador de miles (ej. 320.000 €) y fechas en formato dd/mm/aaaa.
- Usa solo los datos anteriores. No inventes inmuebles, precios, fechas, nombres ni gestiones hechas.
- ${formatInstructions}
- No incluyas marcadores tipo [nombre] ni explicaciones fuera del mensaje.`;

    const draft = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'claude-sonnet-5',
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