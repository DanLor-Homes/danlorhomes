import React, { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import MortgageSimulator from '@/components/mortgages/MortgageSimulator';
import BankRateTable from '@/components/mortgages/BankRateTable';
import BankRateDialog from '@/components/mortgages/BankRateDialog';
import PendingEntities from '@/components/mortgages/PendingEntities';
import { MORTGAGE_DEFAULTS } from '@/lib/mortgage';

export default function Mortgages() {
  const [offers, setOffers] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState(MORTGAGE_DEFAULTS);
  const [dialog, setDialog] = useState({ open: false, offer: null });
  const { toast } = useToast();

  const load = useCallback(async () => {
    const response = await base44.entities.BankRate.filter({}, { sort: 'bank', limit: 200 });
    const items = (response.items || []).filter((offer) => offer.active !== false);
    setOffers(items.filter((offer) => offer.tin != null));
    setPending(items.filter((offer) => offer.tin == null));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: Number(value) }));

  const refresh = async () => {
    setRefreshing(true);
    try {
      const response = await base44.functions.invoke('bankRates', {});
      const data = response.data || {};
      const updated = (data.updated || []).length;
      const failed = (data.failed || []).length;
      toast({
        title: `${updated} tipos leídos de la web`,
        description: failed ? `${failed} entidades no permitieron la lectura: añádelas a mano.` : 'Todas las entidades respondieron.',
      });
      await load();
    } catch (error) {
      toast({
        title: 'No se pudieron leer los tipos',
        description: error?.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const remove = async (offer) => {
    if (!window.confirm(`¿Quitar la oferta de ${offer.bank}?`)) return;
    await base44.entities.BankRate.delete(offer.id);
    toast({ title: 'Oferta eliminada', description: offer.bank });
    load();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Financiación"
        title="Hipotecas"
        description="Compara lo que ofrece cada entidad para la misma operación y calcula la cuota al instante."
      >
        <Button variant="secondary" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Leyendo webs…' : 'Actualizar tipos'}
        </Button>
        <Button onClick={() => setDialog({ open: true, offer: null })}>
          <Plus className="h-4 w-4" /> Añadir entidad
        </Button>
      </PageHeader>

      <div className="space-y-4">
        <MortgageSimulator
          form={form}
          onChange={updateForm}
          tin={offers.length ? Math.min(...offers.map((offer) => offer.tin)) : 3}
        />

        <BankRateTable
          offers={offers}
          form={form}
          loading={loading}
          onEdit={(offer) => setDialog({ open: true, offer })}
          onDelete={remove}
        />

        <PendingEntities offers={pending} onEdit={(offer) => setDialog({ open: true, offer })} />

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          La lectura automática toma el TIN y la TAE publicados en la web de cada banco. Algunas entidades bloquean
          la lectura o cambian su página: en ese caso añade o corrige la oferta a mano antes de presentarla a un cliente.
        </p>
      </div>

      <BankRateDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        offer={dialog.offer}
        onSaved={() => {
          setDialog({ open: false, offer: null });
          load();
        }}
      />
    </div>
  );
}