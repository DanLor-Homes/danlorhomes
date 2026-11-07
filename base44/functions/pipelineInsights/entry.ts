import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { loadPipelineData, pipelineContextText } from '../../shared/crmIntel.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await loadPipelineData(base44);
    if (!data.opportunities.length && !data.clients.length) {
      return Response.json({ headline: 'Sin datos todavía', summary: '', priorities: [], risks: [] });
    }

    const prompt = `Eres el director comercial de DAN&LOR Servicios Inmobiliarios (Costa del Sol). Cada lunes preparas el briefing de la semana para el equipo: qué atender primero, por qué y qué hacer exactamente.

${pipelineContextText(data)}

CÓMO PRIORIZAR
- Ordena por impacto económico y urgencia real, no por volumen.
- Entre 3 y 5 prioridades. Cada una debe apoyarse en un dato del informe (importe, días, fecha) y proponer una acción concreta con responsable genérico y plazo.
- urgency alta: dinero en riesgo o plazo vencido esta semana; media: se puede resolver en las próximas dos semanas; baja: trabajo de fondo.
- En risks recoge solo amenazas visibles en los datos: mandatos caducando, oportunidades sin movimiento, cierres vencidos, cartera desajustada.
- El titular debe ser una frase corta con la conclusión de la semana, no un saludo.
- Español de España, tuteo, frases cortas, sin emojis ni relleno. Importes en euros con separador de miles y fechas dd/mm/aaaa. No inventes datos que no aparezcan arriba.`;

    const insight = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'claude-sonnet-5',
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          summary: { type: 'string' },
          priorities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                why: { type: 'string' },
                action: { type: 'string' },
                urgency: { type: 'string', enum: ['alta', 'media', 'baja'] },
              },
              required: ['title', 'why', 'action', 'urgency'],
            },
          },
          risks: { type: 'array', items: { type: 'string' } },
        },
        required: ['headline', 'summary', 'priorities', 'risks'],
      },
    });

    return Response.json({
      headline: (insight?.headline || '').trim(),
      summary: (insight?.summary || '').trim(),
      priorities: (insight?.priorities || []).slice(0, 5),
      risks: (insight?.risks || []).slice(0, 4),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}