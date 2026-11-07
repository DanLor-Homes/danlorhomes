import React, { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Brain, Check, Copy, Loader2, RefreshCw, Target } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const PRIORITY_STYLES = {
  alta: 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300',
  media: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  baja: 'border-slate-400/40 bg-slate-500/10 text-slate-600 dark:text-slate-300',
};

const TEMPERATURE_LABELS = { caliente: 'Caliente', templado: 'Templado', frio: 'Frío' };

export default function ClientAiBrief({ client, open, onOpenChange }) {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!client?.id) return;
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('clientBrief', { clientId: client.id });
      setData(response.data || null);
    } catch {
      setError('No se ha podido analizar la ficha ahora mismo. Inténtalo de nuevo en unos minutos.');
    } finally {
      setLoading(false);
    }
  }, [client?.id]);

  useEffect(() => {
    if (open && client?.id) {
      setData(null);
      load();
    }
  }, [open, client?.id, load]);

  const copyAction = async () => {
    if (!data?.next_action) return;
    await navigator.clipboard.writeText(data.next_action);
    toast({ title: 'Siguiente acción copiada' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2 font-heading">
            <Brain className="h-4 w-4 text-primary" /> Análisis IA
          </DialogTitle>
          <DialogDescription>
            Diagnóstico comercial de {client?.name} con el histórico, el pipeline y la cartera disponibles.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Analizando la ficha…
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        {!loading && data && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize',
                  PRIORITY_STYLES[data.priority] || PRIORITY_STYLES.media
                )}
              >
                Prioridad {data.priority}
              </span>
              {data.temperature && (
                <span className="rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Lead {TEMPERATURE_LABELS[data.temperature] || data.temperature}
                </span>
              )}
            </div>

            {data.summary && (
              <p className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 text-sm leading-relaxed">
                {data.summary}
              </p>
            )}

            {data.next_action && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <Target className="h-3.5 w-3.5" /> Siguiente acción
                </p>
                <p className="mt-1 text-sm leading-relaxed">{data.next_action}</p>
                <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs" onClick={copyAction}>
                  <Copy className="mr-1.5 h-3 w-3" /> Copiar
                </Button>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Señales a favor
                </p>
                {data.signals?.length ? (
                  <ul className="space-y-1">
                    {data.signals.map((signal) => (
                      <li key={signal} className="flex gap-1.5 text-xs leading-snug">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">Sin señales positivas todavía.</p>
                )}
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Riesgos</p>
                {data.risks?.length ? (
                  <ul className="space-y-1">
                    {data.risks.map((risk) => (
                      <li key={risk} className="flex gap-1.5 text-xs leading-snug">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">Sin riesgos detectados.</p>
                )}
              </div>
            </div>

            {data.recommended_properties?.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Inmuebles de la cartera que encajan
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.recommended_properties.map((title) => (
                    <span
                      key={title}
                      className="rounded-lg border border-border/70 bg-card px-2 py-1 text-[11px] text-foreground/80"
                    >
                      {title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button variant="outline" size="sm" className="w-full" onClick={load} disabled={loading}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Volver a analizar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}