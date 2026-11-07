import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { clientContextText, loadClientIntel } from '../../shared/crmIntel.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const clientId = typeof payload.clientId === 'string' ? payload.clientId.trim() : '';
    if (!clientId) return Response.json({ error: 'clientId is required' }, { status: 400 });

    const intel = await loadClientIntel(base44, clientId);
    if (!intel) return Response.json({ error: 'Not found' }, { status: 404 });

    const prompt = `Eres el analista comercial senior de DAN&LOR Servicios Inmobiliarios (Costa del Sol). El equipo comercial te pasa la ficha de un cliente y espera un diagnóstico breve y accionable, como el que darías en una reunión de ventas de diez minutos.

${clientContextText(intel)}

CÓMO ANALIZAR
- Températe según señales reales: perfil completo, interacciones recientes, oportunidades abiertas y encaje con la cartera. Sin actividad reciente y sin perfil definido es frío.
- Prioriza por valor y por urgencia: una oportunidad con cierre previsto cercano o un cliente con inmueble compatible pesa más que un lead sin datos.
- La siguiente acción debe ser una sola, concreta y ejecutable esta semana, con el canal y el motivo (ej. «Llamar el martes para confirmar la visita a… porque…»).
- Señala riesgos reales que se vean en los datos: silencio prolongado, presupuesto sin encaje en cartera, etapa estancada, tareas vencidas, datos de contacto incompletos.
- En recommended_properties usa solo títulos exactos de los inmuebles que aparecen en la cartera de arriba; si ninguno encaja, devuelve la lista vacía.
- Español de España, tuteo, frases cortas. Sin emojis ni relleno. Importes en euros y fechas dd/mm/aaaa. No inventes datos.`;

    const brief = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'claude-sonnet-5',
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          temperature: { type: 'string', enum: ['caliente', 'templado', 'frio'] },
          priority: { type: 'string', enum: ['alta', 'media', 'baja'] },
          next_action: { type: 'string' },
          signals: { type: 'array', items: { type: 'string' } },
          risks: { type: 'array', items: { type: 'string' } },
          recommended_properties: { type: 'array', items: { type: 'string' } },
        },
        required: ['summary', 'priority', 'next_action', 'signals', 'risks'],
      },
    });

    return Response.json({
      summary: (brief?.summary || '').trim(),
      temperature: brief?.temperature || 'templado',
      priority: brief?.priority || 'media',
      next_action: (brief?.next_action || '').trim(),
      signals: (brief?.signals || []).slice(0, 4),
      risks: (brief?.risks || []).slice(0, 4),
      recommended_properties: (brief?.recommended_properties || []).slice(0, 4),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}