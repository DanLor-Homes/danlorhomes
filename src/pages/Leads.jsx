import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Flame, Loader2, Search, Thermometer, UserRoundCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import EmptyState from '@/components/crm/EmptyState';
import StatCard from '@/components/crm/StatCard';
import LeadRow from '@/components/leads/LeadRow';
import ClientDetailSheet from '@/components/clients/ClientDetailSheet';
import ClientFormDialog from '@/components/clients/ClientFormDialog';
import InteractionDialog from '@/components/interactions/InteractionDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatCurrency, daysSince } from '@/lib/crm';
import { scoreLead, SCORE_BANDS } from '@/lib/leadScoring';

const FILTERS = [
  { id: 'todos', label: 'Todos' },
  ...SCORE_BANDS.map((band) => ({ id: band.id, label: band.label })),
];

export default function Leads() {
  const [clients, setClients] = useState([]);
  const [activity, setActivity] = useState({});
  const [pipeline, setPipeline] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [logClientId, setLogClientId] = useState(null);

  const load = useCallback(async () => {
    const [clientRes, interactionAgg, opportunityAgg] = await Promise.all([
      base44.entities.Client.filter({}, { sort: 'name', limit: 500 }),
      base44.entities.Interaction.aggregate({ groupBy: 'client_id', max: ['date'] }),
      base44.entities.Opportunity.aggregate({ query: { status: 'open' }, groupBy: 'client_id', sum: ['amount'] }),
    ]);

    const activityMap = {};
    (interactionAgg.rows || []).forEach((row) => {
      activityMap[row.client_id] = { count: row.count || 0, last: row.max_date || row.date_max || null };
    });

    const pipelineMap = {};
    (opportunityAgg.rows || []).forEach((row) => {
      pipelineMap[row.client_id] = { count: row.count || 0, value: row.sum_amount || 0 };
    });

    setClients(clientRes.items || []);
    setActivity(activityMap);
    setPipeline(pipelineMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const leads = useMemo(
    () =>
      clients
        .map((client) => {
          const act = activity[client.id] || {};
          const opp = pipeline[client.id] || {};
          return {
            client,
            ...scoreLead({
              client,
              interactionCount: act.count || 0,
              lastInteraction: act.last || null,
              openValue: opp.value || 0,
              openCount: opp.count || 0,
            }),
            last: act.last || null,
            openValue: opp.value || 0,
          };
        })
        .sort((a, b) => b.score - a.score || (a.client.name || '').localeCompare(b.client.name || '')),
    [clients, activity, pipeline]
  );

  const counts = useMemo(
    () => ({
      hot: leads.filter((lead) => lead.band.id === 'hot').length,
      warm: leads.filter((lead) => lead.band.id === 'warm').length,
      cold: leads.filter((lead) => lead.band.id === 'cold').length,
      hotValue: leads
        .filter((lead) => lead.band.id === 'hot')
        .reduce((total, lead) => total + (lead.openValue || 0), 0),
      stalled: leads.filter(
        (lead) => lead.band.id !== 'cold' && (!lead.last || (daysSince(lead.last) ?? 999) > 30)
      ).length,
    }),
    [leads]
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return leads.filter(({ client, band }) => {
      if (filter !== 'todos' && band.id !== filter) return false;
      if (!term) return true;
      return [client.name, client.email, client.geographic_zone, client.search_zones, client.assigned_to]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [leads, filter, search]);

  const openDetail = (client) => {
    setSelected(client);
    setDetailOpen(true);
  };

  const openLog = (client) => {
    setLogClientId(client.id);
    setLogOpen(true);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Captación"
        title="Leads cualificados"
        description={`${counts.hot} leads calientes y ${counts.warm} templados sobre ${clients.length} fichas registradas.`}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar lead"
            className="w-full pl-8 sm:w-56"
          />
        </div>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Leads calientes" value={counts.hot} hint="Score 70 o superior" icon={Flame} tone="rose" />
        <StatCard label="Leads templados" value={counts.warm} hint="Score entre 40 y 69" icon={Thermometer} tone="amber" />
        <StatCard
          label="Pipeline caliente"
          value={formatCurrency(counts.hotValue, true)}
          hint={`${counts.stalled} leads cualificados sin contacto hace más de 30 días`}
          icon={UserRoundCheck}
          tone="emerald"
        />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((option) => {
            const total =
              option.id === 'todos' ? leads.length : counts[option.id] ?? 0;
            return (
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
                {option.label} · {total}
              </button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Nuevo cliente
        </Button>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-border/70 bg-card">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : visible.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={UserRoundCheck}
              title="Sin leads en este filtro"
              description="Registra interacciones y completa el perfil de búsqueda de tus clientes para que su puntuación suba."
            />
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[1.5fr_0.9fr_1.5fr_0.7fr_auto] gap-4 border-b border-border/70 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
              <span>Lead</span>
              <span>Puntuación</span>
              <span>Señales</span>
              <span>Actividad</span>
              <span />
            </div>
            {visible.map((lead) => (
              <LeadRow key={lead.client.id} client={lead.client} lead={lead} onOpen={openDetail} onLog={openLog} />
            ))}
          </>
        )}
      </div>

      <ClientDetailSheet
        client={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={(client) => {
          setDetailOpen(false);
          setEditing(client);
          setFormOpen(true);
        }}
        onChanged={load}
      />

      <ClientFormDialog open={formOpen} onOpenChange={setFormOpen} client={editing} onSaved={load} />

      <InteractionDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        clients={clients}
        defaultClientId={logClientId}
        onSaved={load}
      />
    </div>
  );
}