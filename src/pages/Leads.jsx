import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Flame, Loader2, Search, Thermometer, UserPlus, UserRoundCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import EmptyState from '@/components/crm/EmptyState';
import StatCard from '@/components/crm/StatCard';
import ClientDetailSheet from '@/components/clients/ClientDetailSheet';
import ClientFormDialog from '@/components/clients/ClientFormDialog';
import InteractionDialog from '@/components/interactions/InteractionDialog';
import BulkClientBar from '@/components/clients/BulkClientBar';
import BulkTaskDialog from '@/components/clients/BulkTaskDialog';
import BulkEmailDialog from '@/components/clients/BulkEmailDialog';
import ExportClientsButton from '@/components/clients/ExportClientsButton';
import ClientDropDock from '@/components/clients/drag/ClientDropDock';
import LeadsTable from '@/components/leads/LeadsTable';
import SalesByClientTypeChart from '@/components/leads/SalesByClientTypeChart';
import CaptureAiPanel from '@/components/leads/ai/CaptureAiPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { CLIENT_STATUSES, statusMeta } from '@/lib/clientStatus';
import { ruleForZone } from '@/lib/assignment';
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
  const [rules, setRules] = useState([]);
  const [activity, setActivity] = useState({});
  const [pipeline, setPipeline] = useState({});
  const [wonSales, setWonSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('score');
  const [distributing, setDistributing] = useState(false);
  const [applyingStatus, setApplyingStatus] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [logClientId, setLogClientId] = useState(null);
  const [bulkTaskOpen, setBulkTaskOpen] = useState(false);
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
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
    const [clientRes, ruleRes, interactionAgg, opportunityAgg, wonRes] = await Promise.all([
      base44.entities.Client.filter({}, { sort: 'name', limit: 500 }),
      base44.entities.AssignmentRule.list({ sort: 'zone', limit: 100 }).catch(() => ({ items: [] })),
      base44.entities.Interaction.aggregate({ groupBy: 'client_id', max: ['date'] }).catch(() => ({ rows: [] })),
      base44.entities.Opportunity.aggregate({ query: { status: 'open' }, groupBy: 'client_id', sum: ['amount'] }).catch(
        () => ({ rows: [] })
      ),
      base44.entities.Opportunity.filter({ status: 'won' }, { sort: '-stage_changed_date', limit: 500 }).catch(() => ({
        items: [],
      })),
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
    setRules(ruleRes.items || []);
    setActivity(activityMap);
    setPipeline(pipelineMap);
    setWonSales(wonRes.items || []);
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
      unassigned: clients.filter((client) => !client.assigned_to).length,
    }),
    [leads, clients]
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = leads.filter((lead) => {
      if (filter === 'stale' && !isStaleHot(lead)) return false;
      if (filter !== 'todos' && filter !== 'stale' && lead.band.id !== filter) return false;
      if (statusFilter !== 'todos' && lead.client.status !== statusFilter) return false;
      const { client } = lead;
      if (!term) return true;
      return [client.name, client.email, client.contact_person, client.geographic_zone, client.search_zones, client.assigned_to]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });

    if (sort === 'activity') {
      return [...list].sort((a, b) => new Date(b.last || 0) - new Date(a.last || 0));
    }
    if (sort === 'name') {
      return [...list].sort((a, b) => (a.client.name || '').localeCompare(b.client.name || ''));
    }
    return list;
  }, [leads, filter, statusFilter, search, sort]);

  const selectedClients = useMemo(
    () => clients.filter((client) => selectedIds.includes(client.id)),
    [clients, selectedIds]
  );

  const allVisibleSelected = visible.length > 0 && visible.every((lead) => selectedIds.includes(lead.client.id));

  const toggleSelect = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  const toggleSelectAll = () =>
    setSelectedIds(allVisibleSelected ? [] : visible.map((lead) => lead.client.id));

  const applyStatus = async (status) => {
    if (selectedIds.length === 0) return;
    setApplyingStatus(true);
    try {
      await base44.entities.Client.bulkUpdate(selectedIds.map((id) => ({ id, status })));
      setClients((list) => list.map((client) => (selectedIds.includes(client.id) ? { ...client, status } : client)));
      toast({
        title: 'Estado actualizado',
        description: `${selectedIds.length} fichas marcadas como ${statusMeta(status).label.toLowerCase()}`,
      });
      setSelectedIds([]);
    } finally {
      setApplyingStatus(false);
    }
  };

  const distribute = async () => {
    setDistributing(true);
    try {
      const updates = clients
        .filter((client) => !client.assigned_to)
        .map((client) => {
          const rule = ruleForZone(client.geographic_zone, rules);
          return rule ? { id: client.id, assigned_to: rule.assignee } : null;
        })
        .filter(Boolean);

      if (updates.length === 0) {
        toast({
          title: 'Nada que repartir',
          description: rules.length
            ? 'Todas las fichas con zona ya tienen responsable.'
            : 'Crea reglas de reparto en Ajustes.',
        });
        return;
      }

      await base44.entities.Client.bulkUpdate(updates);
      toast({ title: 'Leads repartidos', description: `${updates.length} fichas asignadas por zona` });
      load();
    } finally {
      setDistributing(false);
    }
  };

  const openDetail = (client) => {
    setSelected(client);
    setDetailOpen(true);
  };

  const openLog = (client) => {
    setLogClientId(client.id);
    setLogOpen(true);
  };

  const openEdit = (client) => {
    setEditing(client);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    await base44.entities.Client.delete(toDelete.id);
    setClients((list) => list.filter((item) => item.id !== toDelete.id));
    setSelectedIds((ids) => ids.filter((id) => id !== toDelete.id));
    if (selected?.id === toDelete.id) {
      setDetailOpen(false);
      setSelected(null);
    }
    setToDelete(null);
    toast({ title: 'Cliente eliminado' });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Captación"
        title="Leads y ventas"
        description={`${counts.hot} leads calientes y ${counts.warm} templados sobre ${clients.length} fichas · ${counts.unassigned} sin responsable asignado.`}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o zona"
            className="w-full pl-8 sm:w-60"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Ordenar por score</SelectItem>
            <SelectItem value="activity">Última actividad</SelectItem>
            <SelectItem value="name">Nombre</SelectItem>
          </SelectContent>
        </Select>
        <ExportClientsButton clients={visible.map((lead) => lead.client)} filename="leads" />
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Nuevo cliente
        </Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Leads calientes" value={counts.hot} hint="Score 70 o superior" icon={Flame} tone="rose" />
        <StatCard label="Leads templados" value={counts.warm} hint="Score entre 40 y 69" icon={Thermometer} tone="amber" />
        <StatCard
          label="Pipeline caliente"
          value={formatCurrency(counts.hotValue, true)}
          hint={`${counts.stalled} leads sin contacto hace más de 30 días`}
          icon={UserRoundCheck}
          tone="emerald"
        />
        <StatCard
          label="Sin responsable"
          value={counts.unassigned}
          hint={`${clients.length} fichas en cartera`}
          icon={Building2}
          tone="violet"
        />
      </div>

      <SalesByClientTypeChart opportunities={wonSales} clients={clients} />

      <CaptureAiPanel leads={leads} />

      <div className="mt-5 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((option) => {
            const total = option.id === 'todos' ? leads.length : counts[option.id] ?? 0;
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 w-full text-[11px] sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos" className="text-xs">
                Todos los estados
              </SelectItem>
              {CLIENT_STATUSES.map((status) => (
                <SelectItem key={status.id} value={status.id} className="text-xs">
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={distribute} disabled={distributing}>
          {distributing ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="mr-1.5 h-4 w-4" />
          )}
          Repartir por zona
        </Button>
      </div>

      {selectedIds.length > 0 && (
        <div className="mt-3">
          <BulkClientBar
            count={selectedIds.length}
            busy={applyingStatus}
            onStatusChange={applyStatus}
            onAssignTask={() => setBulkTaskOpen(true)}
            onSendEmail={() => setBulkEmailOpen(true)}
            onClear={() => setSelectedIds([])}
          />
        </div>
      )}

      {loading ? (
        <div className="mt-3 flex h-40 items-center justify-center rounded-2xl border border-border/70 bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-border/70 bg-card p-6">
          <EmptyState
            icon={UserRoundCheck}
            title="Sin leads en este filtro"
            description="Registra interacciones y completa el perfil de búsqueda de tus clientes para que su puntuación suba."
          />
        </div>
      ) : (
        <DragDropContext onDragStart={drag.handleDragStart} onDragEnd={drag.handleDragEnd}>
          <div className="mt-3">
            <ClientDropDock dragging={drag.dragging} />
          </div>

          <div className="mt-3">
            <LeadsTable
              leads={visible}
              selectedIds={selectedIds}
              allSelected={allVisibleSelected}
              onToggleAll={toggleSelectAll}
              onToggle={toggleSelect}
              onOpen={openDetail}
              onLog={openLog}
              onEdit={openEdit}
              onDelete={setToDelete}
            />
          </div>
        </DragDropContext>
      )}

      <ClientDetailSheet
        client={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={(client) => {
          setDetailOpen(false);
          openEdit(client);
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

      <BulkTaskDialog
        open={bulkTaskOpen}
        onOpenChange={setBulkTaskOpen}
        clients={selectedClients}
        onDone={() => setSelectedIds([])}
      />

      <BulkEmailDialog
        open={bulkEmailOpen}
        onOpenChange={setBulkEmailOpen}
        clientIds={selectedIds}
        clients={selectedClients}
        onDone={() => setSelectedIds([])}
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