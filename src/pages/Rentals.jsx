import React, { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/crm/PageHeader';
import RentSummary from '@/components/rentals/RentSummary';
import RentalAdvisorPanel from '@/components/rentals/RentalAdvisorPanel';
import LeasesList from '@/components/rentals/LeasesList';
import PaymentsList from '@/components/rentals/PaymentsList';
import LeaseDialog from '@/components/rentals/LeaseDialog';
import PaymentDialog from '@/components/rentals/PaymentDialog';
import { contractedRent, missingPayments, monthKey, monthLabel, monthOptions, rentTotals } from '@/lib/rents';
import { cn } from '@/lib/utils';

const MONTHS = monthOptions();

export default function Rentals() {
  const { toast } = useToast();
  const [tab, setTab] = useState('cobros');
  const [month, setMonth] = useState(monthKey());
  const [leases, setLeases] = useState([]);
  const [properties, setProperties] = useState([]);
  const [payments, setPayments] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [leaseOpen, setLeaseOpen] = useState(false);
  const [editingLease, setEditingLease] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);

  const loadPayments = async (period) => {
    const page = await base44.entities.RentPayment.filter({ period }, { sort: 'due_date', limit: 300 });
    setPayments(page.items || []);
  };

  const loadLeases = async () => {
    const [leasePage, propertyPage] = await Promise.all([
      base44.entities.Lease.list({ sort: '-created_date', limit: 300 }),
      base44.entities.Property.list({ sort: 'title', limit: 500 }),
    ]);
    setLeases(leasePage.items || []);
    setProperties(propertyPage.items || []);
  };

  useEffect(() => {
    loadLeases();
  }, []);

  useEffect(() => {
    loadPayments(month);
  }, [month]);

  const totals = useMemo(() => rentTotals(payments), [payments]);
  const contracted = useMemo(() => contractedRent(leases), [leases]);
  const activeLeases = leases.filter((lease) => lease.status === 'activo').length;

  const generate = async () => {
    const items = missingPayments(leases, payments, month);
    if (!items.length) {
      toast({
        title: 'No quedan recibos por generar',
        description: `Los contratos activos ya tienen su recibo de ${monthLabel(month)}.`,
      });
      return;
    }
    setGenerating(true);
    try {
      await base44.entities.RentPayment.bulkCreate(items);
      await loadPayments(month);
      toast({ title: `${items.length} ${items.length === 1 ? 'recibo generado' : 'recibos generados'}` });
    } finally {
      setGenerating(false);
    }
  };

  const openLease = (lease = null) => {
    setEditingLease(lease);
    setLeaseOpen(true);
  };

  const refresh = async () => {
    await loadLeases();
    await loadPayments(month);
  };

  const tabs = [
    { id: 'cobros', label: 'Cobros', count: payments.length },
    { id: 'contratos', label: 'Contratos', count: leases.length },
  ];

  return (
    <div className="app-canvas mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        eyebrow="Alquileres"
        title="Alquileres y cobro de rentas"
        description="Contratos de alquiler, recibos mensuales y control de cobros con aviso de rentas vencidas."
      >
        <Button onClick={() => openLease(null)}>
          <Plus className="h-4 w-4" /> Nuevo contrato
        </Button>
      </PageHeader>

      <RentSummary contracted={contracted} totals={totals} activeLeases={activeLeases} />

      <RentalAdvisorPanel />

      <div className="mb-4 mt-6 flex flex-wrap items-center gap-1.5">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
              tab === item.id
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border/70 text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label} <span className="tabular-nums opacity-70">{item.count}</span>
          </button>
        ))}
      </div>

      {tab === 'cobros' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={generate} disabled={generating}>
              <RefreshCw className={cn('h-4 w-4', generating && 'animate-spin')} />
              Generar recibos del mes
            </Button>
          </div>

          <PaymentsList payments={payments} monthName={monthLabel(month)} onEdit={setEditingPayment} />
        </div>
      ) : (
        <LeasesList leases={leases} onEdit={openLease} />
      )}

      <LeaseDialog
        open={leaseOpen}
        lease={editingLease}
        properties={properties}
        onOpenChange={setLeaseOpen}
        onSaved={refresh}
      />

      <PaymentDialog
        open={Boolean(editingPayment)}
        payment={editingPayment}
        onOpenChange={(value) => !value && setEditingPayment(null)}
        onSaved={() => loadPayments(month)}
      />
    </div>
  );
}