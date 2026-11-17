import React, { useState } from 'react';
import { Check, Copy, Loader2, Sparkles, TriangleAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { aiErrorMessage } from '@/lib/aiError';

const money = (value) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );

export default function RentalAdvisorPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const analyse = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('rentalAdvisor', {});
      setData(response.data || null);
    } catch (err) {
      setError(aiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = async () => {
    const text = data?.tenant_message?.text;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="card-surface mt-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span className="gold-rule" /> Inteligencia de alquileres
          </p>
          <h3 className="mt-1.5 font-heading text-[17px] font-semibold tracking-tight">Cobros y revisiones bajo control</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Revisa la deuda vencida, las revisiones de renta y redacta el recordatorio al inquilino.
          </p>
        </div>
        <button
          type="button"
          onClick={analyse}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? 'Analizando…' : data ? 'Actualizar análisis' : 'Analizar con IA'}
        </button>
      </div>

      {error && <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2.5 text-xs text-destructive">{error}</p>}

      {!loading && !data && !error && (
        <p className="mt-4 rounded-xl bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          Pide el análisis y el asesor ordenará la deuda por antigüedad e importe, avisará de las revisiones IPC y
          preparará el mensaje para el inquilino con el retraso más grave.
        </p>
      )}

      {data && (
        <div className="mt-4 space-y-5">
          <div>
            <p className="display-title text-[19px] leading-snug">{data.headline}</p>
            {data.summary && <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{data.summary}</p>}
          </div>

          <div>
            <p className="eyebrow">Cobros en riesgo</p>
            {data.collections?.length ? (
              <div className="mt-2 divide-y divide-border/60">
                {data.collections.map((item, index) => (
                  <div key={`${item.tenant}-${index}`} className="flex items-start gap-3 py-2.5">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium">
                        {item.tenant}
                        {item.property ? <span className="text-muted-foreground"> · {item.property}</span> : null}
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{item.action}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-heading text-[13px] font-semibold tabular-nums">{money(item.amount)}</p>
                      {item.days_late ? (
                        <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                          {item.days_late} días
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground">Sin recibos vencidos pendientes de cobro.</p>
            )}
          </div>

          {data.renewals?.length > 0 && (
            <div>
              <p className="eyebrow">Revisiones y vencimientos</p>
              <ul className="mt-1.5 space-y-1.5">
                {data.renewals.map((item, index) => (
                  <li key={index} className="text-[13px] leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.actions?.length > 0 && (
            <div>
              <p className="eyebrow">Siguientes pasos</p>
              <ol className="mt-1.5 space-y-1.5">
                {data.actions.map((item, index) => (
                  <li key={index} className="flex gap-2 text-[13px] leading-relaxed">
                    <span className="font-heading text-[11px] font-semibold text-gold">{index + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {data.tenant_message?.text && (
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="eyebrow">
                  Recordatorio para {data.tenant_message.tenant || 'el inquilino'}
                </p>
                <button
                  type="button"
                  onClick={copyMessage}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/80 bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-primary"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed">{data.tenant_message.text}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}