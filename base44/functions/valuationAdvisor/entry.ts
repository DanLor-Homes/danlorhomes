import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const euro = (value) => (Number(value) ? `${Number(value).toLocaleString('es-ES')} €` : 'sin dato');

const CONDITION_LABELS = {
  nuevo: 'obra nueva',
  reformado: 'reformado',
  buen_estado: 'buen estado',
  a_reformar: 'a reformar',
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const subject = payload.subject || {};
    const valuation = payload.valuation || {};
    const market = payload.market || {};
    const surface = Number(subject.surface) || 0;

    if (!surface) return Response.json({ error: 'Falta la superficie del inmueble' }, { status: 400 });
    if (!Number(valuation.estimate)) {
      return Response.json({ error: 'La tasación todavía no tiene valor: añade comparables o una referencia de zona' }, { status: 400 });
    }

    const comparables = (Array.isArray(payload.comparables) ? payload.comparables : [])
      .slice(0, 12)
      .map(
        (row) =>
          `- ${row.title || 'testigo'} · ${row.zone || 'zona sin definir'} · ${euro(row.price)} · ${
            row.surface || '?'
          } m² · ${euro(row.price_m2)}/m² · homogeneizado ${euro(row.normalized_m2)}/m² · ${
            CONDITION_LABELS[row.condition] || row.condition || 'estado sin indicar'
          }${row.year_built ? ` · ${row.year_built}` : ''} · ${row.origin === 'testigo' ? 'testigo de mercado' : 'cartera propia'}`
      )
      .join('\n');

    const factors = (Array.isArray(valuation.factorRows) ? valuation.factorRows : [])
      .map((row) => `- ${row.label}: coeficiente ${Number(row.factor).toFixed(2)}`)
      .join('\n');

    const context = `INMUEBLE A TASAR
Dirección o referencia: ${subject.address || 'sin dirección'}
Ubicación: ${[subject.municipality, subject.province].filter(Boolean).join(', ') || 'sin ubicación'}
Operación: ${subject.operation || 'venta'} · Tipo: ${subject.property_type || 'piso'}
Superficie: ${surface} m²
Estado de conservación: ${CONDITION_LABELS[subject.condition] || subject.condition || 'sin indicar'}
Año de construcción: ${subject.year_built || 'sin indicar'}

RESULTADO CALCULADO POR EL CRM
Tasación estimada: ${euro(valuation.estimate)} (${euro(valuation.pricePerM2)}/m²)
Horquilla: ${euro(valuation.low)} – ${euro(valuation.high)} · margen aplicado ${Math.round((Number(valuation.margin) || 0) * 100)} %
Fiabilidad del cálculo: ${valuation.confidence || 'referencia'} · comparables utilizados: ${Number(valuation.count) || 0}
Base del cálculo: ${valuation.basisSource === 'mercado' ? 'referencia de mercado' : 'mediana de comparables'} (${euro(valuation.basis)}/m²)
Ámbito de captura de comparables: ${valuation.scope || 'sin comparables'}
Referencia de mercado de la zona: ${euro(valuation.marketPrice)}/m²${market.label ? ` (${market.label}, ${market.source || 'referencia'})` : ''}
Desviación frente a la referencia: ${valuation.deltaPercent !== null && valuation.deltaPercent !== undefined ? `${valuation.deltaPercent} %` : 'sin dato'}

COEFICIENTES APLICADOS AL INMUEBLE
${factors || 'sin coeficientes'}

COMPARABLES USADOS
${comparables || 'ninguno: el cálculo se apoya solo en la referencia de mercado'}`;

    const prompt = `Eres el tasador senior de DAN&LOR Servicios Inmobiliarios (Costa del Sol). Tienes que justificar ante el propietario y ante el equipo comercial el precio que ha calculado el CRM, con rigor y sin adornos.

${context}

CÓMO JUSTIFICAR
- El precio no se recalcula: se explica. La estimación del CRM es la referencia y tu trabajo es argumentarla con los comparables y coeficientes de arriba.
- En drivers, entre 3 y 5 factores que sostienen el precio, cada uno con su dato: comparables concretos (cita títulos), coeficientes aplicados, referencia de zona o desviación frente al mercado.
- En comparables_used, una línea por comparable realmente utilizado, con su €/m² homogeneizado y por qué pesa. Si no hay comparables, devuelve la lista vacía y dilo.
- En risks, los límites reales del cálculo: pocos comparables, comparables de otro tipo de inmueble, dispersión amplia entre mínimo y máximo, apoyo solo en referencia de mercado, falta de año o estado, desviación fuerte frente a la zona. Sé concreto con las cifras.
- asking_price es el precio de salida recomendado para publicar: debe ser igual o algo superior a la estimación (máximo un 5 %) y quedar dentro de la horquilla salvo que justifiques lo contrario en asking_rationale.
- confidence_note explica en una frase qué haría falta para subir la fiabilidad (más testigos, datos de estado, etc.).
- En headline, una sola frase de menos de 90 caracteres con el precio y su motivo principal.
- Español de España, tuteo, frases cortas. Importes en euros y cifras con separador de miles. No inventes comparables, direcciones ni datos que no aparezcan arriba.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          summary: { type: 'string' },
          drivers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                detail: { type: 'string' },
              },
              required: ['label', 'detail'],
            },
          },
          comparables_used: { type: 'array', items: { type: 'string' } },
          risks: { type: 'array', items: { type: 'string' } },
          asking_price: { type: 'number' },
          asking_rationale: { type: 'string' },
          confidence_note: { type: 'string' },
        },
        required: ['headline', 'summary', 'drivers', 'risks', 'asking_price'],
      },
    });

    return Response.json({
      headline: (result?.headline || '').trim(),
      summary: (result?.summary || '').trim(),
      drivers: (result?.drivers || []).slice(0, 5),
      comparables_used: (result?.comparables_used || []).slice(0, 8),
      risks: (result?.risks || []).slice(0, 5),
      asking_price: Number(result?.asking_price) || null,
      asking_rationale: (result?.asking_rationale || '').trim(),
      confidence_note: (result?.confidence_note || '').trim(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}