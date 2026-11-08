import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { aiErrorMessage } from '@/lib/aiError';
import { portalLabel } from '@/lib/portals';

export default function DuplicatesDialog({ open, onOpenChange, listings, onDone }) {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setData(null);
    setError('');
    setLoading(true);
    base44.functions
      .invoke('captureAi', {
        tool: 'duplicates',
        listings: listings.slice(0, 40).map((item) => ({
          id: item.id,
          title: item.title,
          portal: item.portal,
          zone: item.zone,
          operation: item.operation,
          price: item.price,
          surface: item.surface,
          rooms: item.rooms,
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

  const groups = useMemo(
    () =>
      (data?.groups || [])
        .map((group) => ({
          ...group,
          items: group.listing_ids.map((id) => listings.find((item) => item.id === id)).filter(Boolean),
        }))
        .filter((group) => group.items.length > 1),
    [data, listings]
  );

  const duplicates = useMemo(
    () => groups.flatMap((group) => group.items.filter((item) => item.id !== group.keep_id).map((item) => item.id)),
    [groups]
  );

  const handleDiscard = async () => {
    if (!duplicates.length) return;
    setSaving(true);
    try {
      await base44.entities.PortalListing.bulkUpdate(duplicates.map((id) => ({ id, status: 'descartado' })));
      toast({
        title: `${duplicates.length} duplicado${duplicates.length === 1 ? '' : 's'} descartado${duplicates.length === 1 ? '' : 's'}`,
        description: 'Se conserva el anuncio más completo de cada grupo.',
      });
      onOpenChange(false);
      onDone?.();
    } catch (err) {
      toast({ title: 'No se pudieron descartar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-4 w-4 text-primary" /> Duplicados entre portales
          </DialogTitle>
          <DialogDescription>El mismo inmueble publicado en varios portales, agrupado por la IA.</DialogDescription>
        </DialogHeader>

        {loading && (
          <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Comparando los anuncios…
          </p>
        )}
        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>
        )}

        {data && (
          <div className="space-y-3 text-sm">
            {data.summary && <p className="text-muted-foreground">{data.summary}</p>}
            {groups.length === 0 ? (
              <p className="rounded-xl border border-border/70 bg-muted/30 px-3 py-4 text-xs text-muted-foreground">
                No se han detectado anuncios repetidos en esta selección.
              </p>
            ) : (
              <>
                {groups.map((group, index) => (
                  <div key={`${group.keep_id}-${index}`} className="rounded-xl border border-border/70 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group.match_reason}</p>
                    <ul className="mt-2 space-y-1.5">
                      {group.items.map((item) => (
                        <li key={item.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="min-w-0 truncate">
                            {item.title}
                            <span className="text-muted-foreground"> · {portalLabel(item.portal)}</span>
                          </span>
                          {item.id === group.keep_id ? (
                            <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">
                              Se conserva
                            </span>
                          ) : (
                            <span className="shrink-0 text-[10px] text-muted-foreground">Duplicado</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <Button onClick={handleDiscard} disabled={saving || !duplicates.length}>
                  {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
                  Descartar {duplicates.length} duplicado{duplicates.length === 1 ? '' : 's'}
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}