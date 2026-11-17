import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { loadMlsIntel, mlsContextText } from '../../shared/mlsIntel.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const intel = await loadMlsIntel(base44, user.id);
    if (!intel.network.length && !intel.mine.length && !intel.clients.length) {
      return Response.json({
        empty: true,
        headline: 'Todavía no hay nada que cruzar en la red',
        summary: 'Publica un inmueble en la bolsa o registra demandantes para que el asesor pueda cruzar la cartera.',
        matches: [],
        demand_gaps: [],
        actions: [],
        pitch: { agency: '', text: '' },
      });
    }

    const prompt = `Eres el asesor de la bolsa inmobiliaria de DAN&LOR Servicios Inmobiliarios (Costa del Sol). El equipo comparte y recibe inmuebles de otras agencias y necesita saber qué cruces merecen una llamada hoy.

${mlsContextText(intel)}

CÓMO ANALIZAR
- En matches elige entre 3 y 6 cruces de la lista «CRUCES QUE ENCAJAN SEGÚN EL CRM», los de mayor encaje y más fáciles de cerrar. Copia los títulos y nombres exactos que aparecen arriba; no inventes inmuebles ni demandantes.
- En why explica en una frase por qué encaja (presupuesto, zona, tipo, habitaciones) y qué falta por confirmar.
- En priority usa alta solo si el encaje supera el 70 % y el demandante está activo.
- En demand_gaps resume en una línea cada perfil de la lista de demandantes sin oferta, indicando qué habría que captar para colocarlo.
- En actions, entre 2 y 4 pasos concretos para esta semana (a qué agencia llamar, qué demandante avisar, qué inmueble destacar), nombrando siempre la agencia o el demandante.
- En pitch redacta un mensaje breve para la agencia del primer cruce: máximo 110 palabras, presentación de DAN&LOR, el inmueble y el demandante interesado, propuesta de honorarios compartidos y una llamada a la acción clara. Sin emojis.
- En headline, una sola frase de menos de 90 caracteres con la oportunidad más valiosa.
- Español de España, tuteo, frases cortas. Importes en euros. No inventes datos de contacto.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          summary: { type: 'string' },
          matches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                listing: { type: 'string' },
                client: { type: 'string' },
                why: { type: 'string' },
                priority: { type: 'string', enum: ['alta', 'media', 'baja'] },
              },
              required: ['listing', 'client', 'why'],
            },
          },
          demand_gaps: { type: 'array', items: { type: 'string' } },
          actions: { type: 'array', items: { type: 'string' } },
          pitch: {
            type: 'object',
            properties: {
              agency: { type: 'string' },
              text: { type: 'string' },
            },
            required: ['text'],
          },
        },
        required: ['headline', 'summary', 'matches', 'actions'],
      },
    });

    return Response.json({
      empty: false,
      headline: (result?.headline || '').trim(),
      summary: (result?.summary || '').trim(),
      matches: (result?.matches || []).slice(0, 6),
      demand_gaps: (result?.demand_gaps || []).slice(0, 6),
      actions: (result?.actions || []).slice(0, 5),
      pitch: {
        agency: (result?.pitch?.agency || '').trim(),
        text: (result?.pitch?.text || '').trim(),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}