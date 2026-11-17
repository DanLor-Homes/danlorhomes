import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { loadRentalIntel, rentalContextText } from '../../shared/rentalIntel.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const intel = await loadRentalIntel(base44);

    const prompt = `Eres el asesor de alquileres de DAN&LOR Servicios Inmobiliarios (Costa del Sol). El equipo te pasa la cartera de rentas y espera un diagnóstico breve y accionable antes de la reunión semanal.

${rentalContextText(intel)}

CÓMO ANALIZAR
- Ordena por dinero y por antigüedad: primero la deuda vencida más antigua y de mayor importe, después las revisiones de renta y los contratos que terminan.
- En collections incluye solo recibos vencidos que aparezcan arriba, con el importe exacto y los días de retraso reales. Si no hay deuda vencida, devuelve la lista vacía y dilo en el resumen.
- En renewals, una línea por revisión de renta o contrato que termina, con la fecha y la decisión pendiente (actualizar renta, renovar, recuperar el inmueble).
- En actions, entre 2 y 4 pasos concretos para esta semana, cada uno con el inquilino o el inmueble al que se refiere.
- tenant_message: mensaje para el caso más urgente. Máximo 90 palabras, tono cordial y firme, tuteo, con importe y periodo, plazo de 48 horas para responder o pagar, y firma «DAN&LOR Servicios Inmobiliarios». Sin emojis ni amenazas.
- En headline, una sola frase de menos de 90 caracteres con lo más importante.
- Español de España, frases cortas. Importes en euros y fechas dd/mm/aaaa. No inventes datos, inquilinos ni importes.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          summary: { type: 'string' },
          collections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tenant: { type: 'string' },
                property: { type: 'string' },
                amount: { type: 'number' },
                days_late: { type: 'number' },
                action: { type: 'string' },
              },
              required: ['tenant', 'action'],
            },
          },
          renewals: { type: 'array', items: { type: 'string' } },
          actions: { type: 'array', items: { type: 'string' } },
          tenant_message: {
            type: 'object',
            properties: {
              tenant: { type: 'string' },
              text: { type: 'string' },
            },
            required: ['text'],
          },
        },
        required: ['headline', 'summary', 'collections', 'actions'],
      },
    });

    return Response.json({
      headline: (result?.headline || '').trim(),
      summary: (result?.summary || '').trim(),
      collections: (result?.collections || []).slice(0, 8),
      renewals: (result?.renewals || []).slice(0, 6),
      actions: (result?.actions || []).slice(0, 5),
      tenant_message: {
        tenant: (result?.tenant_message?.tenant || '').trim(),
        text: (result?.tenant_message?.text || '').trim(),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}