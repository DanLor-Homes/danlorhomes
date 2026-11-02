import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BadgeCheck, CalendarClock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/crm/PageHeader';
import StatCard from '@/components/crm/StatCard';
import EmptyState from '@/components/crm/EmptyState';
import OwnerRow from '@/components/owners/OwnerRow';
import MandateDialog from '@/components/owners/MandateDialog';
import ExpiredMandatesSummary from '@/components/owners/ExpiredMandatesSummary';
import { STATE_RANK, mandateStatus } from '@/lib/mandates';
import { formatDate } from '@/lib/crm';
import { cn } from '@/lib/utils';

const FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'exclusivas', label: 'Exclusivas' },
  { id: 'por_vencer', label: 'Vencen pronto' },
  { id: 'caducadas', label: 'Caducados' },
  { id: 'sin_mandato', label: 'Sin mandato' },
];

const nextYear = (value) => {
  const current = value ? new Date(value) : null;
  const base = current && current > new Date() ? current : new Date();
  base.setMonth(base.getMonth() + 12);
  return base.toISOString().slice(0, 10);
};

export default function Owners() {
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    const [propertyRes, clientRes] = await Promise.all([
      base44.entities.Property.filter({}, { sort: 'owner_name', limit: 500 }),
      base44.entities.Client.filter({}, { sort: 'name', limit: 500 }),
    ]);
    setProperties(propertyRes.items || []);
    setClients(clientRes.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(
    () => properties.map((property) => ({ property, status: mandateStatus(property) })),
    [properties]
  );

  const counts = useMemo(
    () => ({
      exclusivas: rows.filter(({ status }) => status.type === 'exclusiva' && status.state !== 'caducado').length,
      porVencer: rows.filter(({ status }) => status.state === 'por_vencer').length,
      caducados: rows.filter(({ status }) => status.state === 'caducado').length,
      sinMandato: rows.filter(({ status }) => status.state === 'sin_mandato').length,
    }),
    [rows]
  );

  const expiredRows = useMemo(() => rows.filter(({ status }) => status.state === 'caducado'), [rows]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows
      .filter(({ status }) => {
        if (filter === 'exclusivas') return status.type === 'exclusiva' && status.state !== 'caducado';
        if (filter === 'por_vencer') return status.state === 'por_vencer';
        if (filter === 'caducadas') return status.state === 'caducado';
        if (filter === 'sin_mandato') return status.state === 'sin_mandato';
        return true;
      })
      .filter(({ property }) =>
        !term ||
        [property.owner_name, property.owner_phone, property.title, property.reference, property.zone, property.address]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term))
      )
      .sort((a, b) => STATE_RANK[a.status.state] - STATE_RANK[b.status.state] || (a.status.daysLeft ?? 9999) - (b.status.daysLeft ?? 9999));
  }, [rows, filter, search]);

  const renew = async (property) => {
    const type = property.mandate_type || (property.exclusive ? 'exclusiva' : 'abierta');
    const mandate_end = nextYear(property.mandate_end);
    await base44.entities.Property.update(property.id, {
      mandate_type: type,
      exclusive: type === 'exclusiva',
      mandate_end,
    });
    toast({ title: 'Mandato renovado', description: `Vigente hasta ${formatDate(mandate_end)}` });
    load();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Cartera"
        title="Propietarios y exclusivas"
        description="Controla qué inmuebles tienes en exclusiva, cuándo vence el mandato y qué honorarios has acordado."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Exclusivas activas" value={counts.exclusivas} hint="Mandatos firmados en exclusiva" icon={BadgeCheck} tone="emerald" />
        <StatCard label="Vencen en 30 días" value={counts.porVencer} hint="Conviene renovar ya" icon={CalendarClock} tone="amber" />
        <StatCard label="Caducados" value={counts.caducados} hint="Sin mandato vigente" icon={AlertTriangle} tone="rose" />
        <StatCard label="Sin mandato" value={counts.sinMandato} hint="Inmuebles sin nota de encargo" icon={ShieldAlert} tone="violet" />
      </div>

      {counts.caducados > 0 && (
        <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 sm:flex-row sm:items-center">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <p className="flex-1 text-sm">
            {counts.caducados} {counts.caducados === 1 ? 'mandato ya ha caducado' : 'mandatos ya han caducado'} sin renovar. El inmueble puede seguir publicado pero sin encargo vigente: renueva o cierra la captación.
          </p>
          <Button size="sm" variant="outline" onClick={() => setFilter('caducadas')}>
            Ver los caducados
          </Button>
        </div>
      )}

      {counts.porVencer > 0 && (
        <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 sm:flex-row sm:items-center">
          <CalendarClock className="h-4 w-4 shrink-0 text-amber-400" />
          <p className="flex-1 text-sm">
            {counts.porVencer} {counts.porVencer === 1 ? 'mandato vence' : 'mandatos vencen'} en los próximos 30 días. Renueva antes de perder al propietario.
          </p>
          <Button size="sm" variant="outline" onClick={() => setFilter('por_vencer')}>
            Ver los que vencen
          </Button>
        </div>
      )}

      <ExpiredMandatesSummary rows={expiredRows} />

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                filter === option.id
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar propietario, referencia o zona"
          className="sm:max-w-xs"
        />
      </div>

      <div className="mt-3 space-y-2">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Cargando cartera…</p>
        ) : visible.length === 0 ? (
          <EmptyState title="Sin propietarios en este filtro" description="Prueba otro estado de mandato o añade inmuebles desde Inmuebles." />
        ) : (
          visible.map(({ property, status }) => (
            <OwnerRow key={property.id} property={property} status={status} onEdit={setEditing} onRenew={renew} />
          ))
        )}
      </div>

      <MandateDialog
        open={Boolean(editing)}
        onOpenChange={(value) => !value && setEditing(null)}
        property={editing}
        clients={clients}
        onSaved={load}
      />
    </div>
  );
}