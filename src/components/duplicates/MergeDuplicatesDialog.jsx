import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { mergeDuplicates } from '@/lib/mergeDuplicates';

const RELATION_TEXT = {
  Client: 'Sus oportunidades, interacciones, tareas, facturas e inmuebles pasarán a la ficha conservada.',
  WebLead: 'Los datos y mensajes de las demás se copiarán en la ficha conservada.',
};

export default function MergeDuplicatesDialog({ open, onOpenChange, entity, records, onMerged }) {
  const [masterId, setMasterId] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const ids = records.map((record) => record.id).join('|');

  useEffect(() => {
    if (open) setMasterId(records[0]?.id || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ids]);

  const master = records.find((record) => record.id === masterId) || records[0];
  const duplicates = records.filter((record) => record.id !== master?.id);

  const handleMerge = async () => {
    setSaving(true);
    try {
      await mergeDuplicates(
        entity,
        master.raw,
        duplicates.map((record) => record.raw)
      );
      toast({
        title: 'Fichas fusionadas',
        description: `Se conserva ${master.name}. ${duplicates.length} ${duplicates.length === 1 ? 'ficha repetida eliminada' : 'fichas repetidas eliminadas'}.`,
      });
      onMerged?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'No se pudo fusionar',
        description: error?.message || 'Inténtalo de nuevo en unos segundos.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Fusionar fichas duplicadas</DialogTitle>
          <DialogDescription>
            Elige la ficha que quieres conservar. Se completará con los datos que le falten y se eliminarán las demás.
            {RELATION_TEXT[entity] ? ` ${RELATION_TEXT[entity]}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          {records.map((record) => {
            const active = record.id === master?.id;
            return (
              <button
                key={record.id}
                type="button"
                onClick={() => setMasterId(record.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                  active
                    ? 'border-primary/60 bg-primary/[0.07]'
                    : 'border-border/70 hover:bg-accent/50'
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{record.name}</span>
                  {record.meta && <span className="block truncate text-xs text-muted-foreground">{record.meta}</span>}
                </span>
                <span
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 text-[11px] font-semibold',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {active ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Se conserva
                    </>
                  ) : (
                    'Se elimina'
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          La fusión no se puede deshacer. Revisa que los datos de {master?.name} sean los correctos.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleMerge} disabled={saving || duplicates.length === 0} className="gap-1.5">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Fusionar {records.length} fichas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}