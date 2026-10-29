import React, { useCallback, useEffect, useState } from 'react';
import { Archive as ArchiveIcon, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import EmptyState from '@/components/crm/EmptyState';
import StageBadge from '@/components/crm/StageBadge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/crm';
import { useToast } from '@/components/ui/use-toast';

export default function Archive() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const res = await base44.entities.Opportunity.filter({ archived: true }, { sort: '-archived_date', limit: 200 });
    setItems(res.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const restore = async (opportunity) => {
    await base44.entities.Opportunity.update(opportunity.id, { archived: false, archived_date: '' });
    setItems((list) => list.filter((item) => item.id !== opportunity.id));
    toast({ title: 'Oportunidad restaurada' });
  };

  const runArchive = async () => {
    setRunning(true);
    try {
      const res = await base44.functions.invoke('crmAutomations', {});
      toast({
        title: 'Archivado ejecutado',
        description: `${res.data?.archived ?? 0} oportunidades movidas al archivo`,
      });
      await load();
    } finally {
      setRunning(false);
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Histórico"
        title="Archivo"
        description="Oportunidades ganadas o perdidas cerradas hace más de 30 días."
      >
        <Button variant="outline" onClick={runArchive} disabled={running}>
          {running ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
          Ejecutar archivado
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <span>
          <strong className="font-semibold text-foreground">{items.length}</strong> archivadas
        </span>
        <span>
          Valor acumulado: <strong className="font-semibold text-foreground">{formatCurrency(totalValue)}</strong>
        </span>
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ArchiveIcon}
          title="El archivo está vacío"
          description="Las oportunidades cerradas se archivan automáticamente 30 días después de su cierre."
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  Archivada el {formatDate(item.archived_date)} · cierre {formatDate(item.expected_closing_date)}
                </p>
              </div>
              <StageBadge stage={item.stage} />
              <span className="text-sm font-semibold">{formatCurrency(item.amount)}</span>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => restore(item)}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restaurar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}