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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { formatCurrency, daysSince } from '@/lib/crm';
import { scoreLead, SCORE_BANDS } from '@/lib/leadScoring';
import { statusMeta } from '@/lib/clientStatus';
import ExportClientsButton from '@/components/clients/ExportClientsButton';
import ClientDropDock from '@/components/clients/drag/ClientDropDock';
import ClientDragList from '@/components/clients/drag/ClientDragList';
import DraggableClientRow from '@/components/clients/drag/DraggableClientRow';
import useClientDragDrop from '@/hooks/useClientDragDrop';
import { useToast } from '@/components/ui/use-toast';
import { DragDropContext } from '@hello-pangea/dnd';

const FILTERS = [
  { id: 'todos', label: 'Todos' },
  ...SCORE_BANDS.map((band) => ({ id: band.id, label: band.label })),
  { id: 'stale', label: 'Calientes sin contacto' },
];

const isStaleHot = (lead) =>
  lead.band.id === 'hot' && (!lead.last || (daysSince(lead.last) ?? 999) > 30);

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
  const [toDelete, setToDelete] = useState(null);
  const { toast } = useToast();

  const drag = useClientDragDrop({
    onMove: async (clientId, status) => {
      const client = clients.find((item) => item.id === clientId);
      if (!client || client.status === status) return;
      setClients((list) => list.map((item) => (item.id === clientId ? { ...item, status } : item)));
      await base44.entities.Client.update(clientId, { status });
      toast({ title: 'Cliente movido', description: `${client.name} → ${statusMeta(status).label}` });
    },
    onTrash: (clientId) => {
      const client = clients.find((item) => item.id === clientId);
      if (client) setToDelete(client);
    },
  });

  const load = useCallback(async () => {
    const [clientRes, interactionAgg, opportunityAgg] = await Promise.all([
      base44.entities.Client.filter({}, { sort: 'name', limit: 500 }),
      base44.entities.Interaction.aggregate({ groupBy: 'client_id', max: ['date'] }).catch(() => ({ rows: [] })),
      base44.entities.Opportunity.aggregate({ query: { status: 'open' }, groupBy: 'client_id', sum: ['amount'] }).catch(
        () => ({ rows: [] })
      ),
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
      stale: leads.filter(isStaleHot).length,
    }),
    [leads]
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (filter === 'stale' && !isStaleHot(lead)) return false;
      if (filter !== 'todos' && filter !== 'stale' && lead.band.id !== filter) return false;
      const { client } = lead;
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

  const confirmDelete = async () => {
    if (!toDelete) return;
    await base44.entities.Client.delete(toDelete.id);
    if (selected?.id === toDelete.id) {
      setDetailOpen(false);
      setSelected(null);
    }
    setToDelete(null);
    load();
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
        <ExportClientsButton clients={visible.map((lead) => lead.client)} filename="leads" />
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

      <DragDropContext onDragStart={drag.handleDragStart} onDragEnd={drag.handleDragEnd}>
        <ClientDropDock dragging={drag.dragging} />

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
            <ClientDragList>
              <div className="hidden grid-cols-[1.5fr_0.9fr_1.5fr_0.7fr_auto] gap-4 border-b border-border/70 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
                <span>Lead</span>
                <span>Puntuación</span>
                <span>Señales</span>
                <span>Actividad</span>
                <span />
              </div>
              {visible.map((lead, index) => (
                <DraggableClientRow key={lead.client.id} clientId={lead.client.id} index={index}>
                  <LeadRow
                    client={lead.client}
                    lead={lead}
                    onOpen={openDetail}
                    onLog={openLog}
                    onDelete={setToDelete}
                  />
                </DraggableClientRow>
              ))}
            </ClientDragList>
          )}
        </div>
      </DragDropContext>

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

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(next) => !next && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la ficha del lead. Las oportunidades e interacciones asociadas conservarán la referencia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}