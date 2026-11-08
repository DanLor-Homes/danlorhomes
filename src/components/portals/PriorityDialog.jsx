import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { aiErrorMessage } from '@/lib/aiError';
import { daysSince } from '@/lib/followUp';
import { portalLabel } from '@/lib/portals';
import { cn } from '@/lib/utils';

const PRIORITY = {
  alta: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
  media: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  baja: 'bg-muted text-muted-foreground',
};

export default function PriorityDialog({ open, onOpenChange, listings, onAnalyze }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setData(null);
    setError('');
    setLoading(true);
    base44.functions
      .invoke('captureAi', {
        tool: 'priority',
        listings: listings.slice(0, 15).map((item) => ({
          title: item.title,
          portal: item.portal,
          zone: item.zone,
          operation: item.operation,
          price: item.price,
          surface: item.surface,
          days: daysSince(item.first_seen) || 0,
          status: item.status,
        })),
      })
      .then((response) => {
        if (alive) setData(response.data || {});
      })
      .catch((err) => {
        if (alive) setError(aiErrorMessage(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, listings]);

  const rows = (data?.ranked || [])
    .map((item) => ({ ...item, listing: listings[Math.round(item.ref) - 1] }))
    .filter((item) => item.listing);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> A quién llamar primero
          </DialogTitle>
          <DialogDescription>
            Priorización de los {Math.min(listings.length, 15)} anuncios de particulares con más valor de captación.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Ordenando los anuncios por urgencia…
          </p>
        )}
        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>
        )}

        {data && (
          <div className="space-y-3 text-sm">
            {data.summary && <p className="text-muted-foreground">{data.summary}</p>}
            {rows.length === 0 ? (
              <p className="rounded-xl border border-border/70 bg-muted/30 px-3 py-4 text-xs text-muted-foreground">
                No hay anuncios suficientes para priorizar.
              </p>
            ) : (
              <ol className="space-y-2">
                {rows.map((row, index) => (
                  <li key={`${row.ref}-${row.listing.id}`} className="rounded-xl border border-border/70 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-heading text-[13px] font-semibold">
                          {index + 1}. {row.listing.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {portalLabel(row.listing.portal)} · {row.listing.zone || 'sin zona'} ·{' '}
                          {row.listing.price ? `${Number(row.listing.price).toLocaleString('es-ES')} €` : 'precio no publicado'}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          PRIORITY[row.priority] || PRIORITY.baja
                        )}
                      >
                        {row.priority}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed">{row.reason}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{row.next_action}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1 h-7 px-2 text-[11px]"
                      onClick={() => {
                        onOpenChange(false);
                        onAnalyze?.(row.listing);
                      }}
                    >
                      <Sparkles className="h-3 w-3" /> Preparar la llamada
                    </Button>
                  </li>
                ))}
              </ol>
            )}
            {(data.quick_wins || []).length > 0 && (
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">Para hoy</p>
                <ul className="list-disc space-y-1 pl-4 text-xs text-primary">
                  {data.quick_wins.map((win) => (
                    <li key={win}>{win}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}