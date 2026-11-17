import React, { useState } from 'react';
import { Check, Copy, Loader2, Scale, Sparkles, TriangleAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { aiErrorMessage } from '@/lib/aiError';

const money = (value) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );

export default function ValuationAdvisor({ payload, canValue }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const analyse = async () => {
    if (loading || !canValue) return;
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('valuationAdvisor', payload);
      setData(response.data || null);
    } catch (err) {
      setError(aiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!data) return;
    const lines = [
      data.headline,
      data.summary,
      `Precio de salida: ${money(data.asking_price)}`,
      data.asking_rationale,
      'Motivos',
      ...(data.drivers || []).map((item) => `- ${item.label}: ${item.detail}`),
      ...(data.comparables_used?.length ? ['Comparables', ...data.comparables_used.map((item) => `- ${item}`)] : []),
      ...(data.risks?.length ? ['Límites', ...data.risks.map((item) => `- ${item}`)] : []),
      data.confidence_note,
    ].filter(Boolean);
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="card-surface mt-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span className="gold-rule" /> Informe de tasación con IA
          </p>
          <h3 className="mt-1.5 font-heading text-[17px] font-semibold tracking-tight">Justificación del precio</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Explica el precio con los comparables usados, los coeficientes aplicados y los límites del cálculo.
          </p>
        </div>
        <button
          type="button"
          onClick={analyse}
          disabled={loading || !canValue}
          className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? 'Redactando…' : data ? 'Actualizar informe' : 'Justificar con IA'}
        </button>
      </div>

      {!canValue && (
        <p className="mt-4 rounded-xl bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
          Indica la superficie y consigue comparables o una referencia de zona para poder justificar el precio.
        </p>
      )}

      {error && <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2.5 text-xs text-destructive">{error}</p>}

      {!loading && canValue && !data && !error && (
        <p className="mt-4 rounded-xl bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          El informe ordena los motivos del precio, cita los comparables que lo sostienen, avisa de la fiabilidad real
          del cálculo y propone un precio de salida para publicar.
        </p>
      )}

      {data && (
        <div className="mt-4 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="display-title text-[19px] leading-snug">{data.headline}</p>
              {data.summary && (
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{data.summary}</p>
              )}
            </div>
            <button
              type="button"
              onClick={copy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/80 bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copiado' : 'Copiar informe'}
            </button>
          </div>

          {data.asking_price ? (
            <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
              <p className="eyebrow flex items-center gap-2 text-primary">
                <Scale className="h-3 w-3" /> Precio de salida recomendado
              </p>
              <p className="mt-1.5 font-heading text-[24px] font-semibold leading-none tabular-nums">
                {money(data.asking_price)}
              </p>
              {data.asking_rationale && (
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{data.asking_rationale}</p>
              )}
            </div>
          ) : null}

          {data.drivers?.length > 0 && (
            <div>
              <p className="eyebrow">Qué sostiene el precio</p>
              <div className="mt-2 divide-y divide-border/60">
                {data.drivers.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="py-2.5">
                    <p className="text-[13.5px] font-medium">{item.label}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.comparables_used?.length > 0 && (
            <div>
              <p className="eyebrow">Comparables que lo sostienen</p>
              <ul className="mt-1.5 space-y-1.5">
                {data.comparables_used.map((item, index) => (
                  <li key={index} className="text-[13px] leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.risks?.length > 0 && (
            <div>
              <p className="eyebrow flex items-center gap-2">
                <TriangleAlert className="h-3 w-3" /> Límites del cálculo
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {data.risks.map((item, index) => (
                  <li key={index} className="text-[13px] leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.confidence_note && (
            <p className="rounded-xl bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              <b className="font-semibold text-foreground">Para mejorar la fiabilidad:</b> {data.confidence_note}
            </p>
          )}
        </div>
      )}
    </section>
  );
}