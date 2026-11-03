import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Loader2, Pencil, Plus, Search, Trash2, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import EmptyState from '@/components/crm/EmptyState';
import ClientFormDialog from '@/components/clients/ClientFormDialog';
import ClientDetailSheet from '@/components/clients/ClientDetailSheet';
import LeadScoreBadge from '@/components/clients/LeadScoreBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import BulkClientBar from '@/components/clients/BulkClientBar';
import BulkTaskDialog from '@/components/clients/BulkTaskDialog';
import BulkEmailDialog from '@/components/clients/BulkEmailDialog';
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
import { useToast } from '@/components/ui/use-toast';
import { ruleForZone } from '@/lib/assignment';
import { scoreLead } from '@/lib/leadScoring';
import { statusMeta } from '@/lib/clientStatus';
import { cn } from '@/lib/utils';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [rules, setRules] = useState([]);
  const [activity, setActivity] = useState({});
  const [pipeline, setPipeline] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('score');
  const [distributing, setDistributing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkTaskOpen, setBulkTaskOpen] = useState(false);
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [applyingStatus, setApplyingStatus] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const [clientRes, ruleRes, interactionAgg, opportunityAgg] = await Promise.all([
      base44.entities.Client.filter({}, { sort: 'name', limit: 500 }),
      base44.entities.AssignmentRule.list({ sort: 'zone', limit: 100 }),
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
    setRules(ruleRes.items || []);
    setActivity(activityMap);
    setPipeline(pipelineMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const scores = useMemo(() => {
    const map = {};
    clients.forEach((client) => {
      const act = activity[client.id] || {};
      const opp = pipeline[client.id] || {};
      map[client.id] = {
        ...scoreLead({
          client,
          interactionCount: act.count || 0,
          lastInteraction: act.last || null,
          openValue: opp.value || 0,
          openCount: opp.count || 0,
        }),
        last: act.last || null,
      };
    });
    return map;
  }, [clients, activity, pipeline]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? clients.filter(
          (client) =>
            client.name?.toLowerCase().includes(term) ||
            client.email?.toLowerCase().includes(term) ||
            client.geographic_zone?.toLowerCase().includes(term) ||
            client.assigned_to?.toLowerCase().includes(term) ||
            client.contact_person?.toLowerCase().includes(term)
        )
      : [...clients];

    if (sort === 'score') {
      return list.sort(
        (a, b) => (scores[b.id]?.score || 0) - (scores[a.id]?.score || 0) || (a.name || '').localeCompare(b.name || '')
      );
    }
    if (sort === 'activity') {
      return list.sort((a, b) => new Date(scores[b.id]?.last || 0) - new Date(scores[a.id]?.last || 0));
    }
    return list;
  }, [clients, search, sort, scores]);

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
            ? 'Todos los clientes con zona ya tienen responsable.'
            : 'Crea reglas de reparto en Ajustes.',
        });
        return;
      }

      await base44.entities.Client.bulkUpdate(updates);
      toast({ title: 'Leads repartidos', description: `${updates.length} clientes asignados por zona` });
      load();
    } finally {
      setDistributing(false);
    }
  };

  const openDetail = (client) => {
    setSelected(client);
    setDetailOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    await base44.entities.Client.delete(toDelete.id);
    setClients((list) => list.filter((c) => c.id !== toDelete.id));
    setToDelete(null);
    toast({ title: 'Cliente eliminado' });
  };

  const selectedClients = useMemo(
    () => clients.filter((client) => selectedIds.includes(client.id)),
    [clients, selectedIds]
  );

  const toggleSelect = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  const allVisibleSelected = visible.length > 0 && visible.every((client) => selectedIds.includes(client.id));

  const toggleSelectAll = () => setSelectedIds(allVisibleSelected ? [] : visible.map((client) => client.id));

  const applyStatus = async (status) => {
    if (selectedIds.length === 0) return;
    setApplyingStatus(true);
    try {
      await base44.entities.Client.bulkUpdate(selectedIds.map((id) => ({ id, status })));
      setClients((list) => list.map((client) => (selectedIds.includes(client.id) ? { ...client, status } : client)));
      toast({
        title: 'Estado actualizado',
        description: `${selectedIds.length} clientes marcados como ${statusMeta(status).label.toLowerCase()}`,
      });
      setSelectedIds([]);
    } finally {
      setApplyingStatus(false);
    }
  };

  const unassigned = clients.filter((client) => !client.assigned_to).length;

  return (
    <div>
      <PageHeader
        eyebrow="Cartera"
        title="Clientes"
        description={`${clients.length} fichas registradas · ${unassigned} sin responsable asignado.`}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente"
            className="w-full pl-8 sm:w-56"
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
        <Button variant="outline" onClick={distribute} disabled={distributing}>
          {distributing ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="mr-1.5 h-4 w-4" />
          )}
          Repartir por zona
        </Button>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Nuevo cliente
        </Button>
      </PageHeader>

      {selectedIds.length > 0 && (
        <BulkClientBar
          count={selectedIds.length}
          busy={applyingStatus}
          onStatusChange={applyStatus}
          onAssignTask={() => setBulkTaskOpen(true)}
          onSendEmail={() => setBulkEmailOpen(true)}
          onClear={() => setSelectedIds([])}
        />
      )}

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Sin clientes"
          description="Crea la primera ficha de cliente para empezar a registrar oportunidades e interacciones."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Nuevo cliente
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          <div className="hidden grid-cols-[20px_1.6fr_1.3fr_1fr_0.9fr_0.6fr_auto] gap-4 border-b border-border/70 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
            <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAll} aria-label="Seleccionar todos" />
            <span>Cliente</span>
            <span>Contacto</span>
            <span>Zona</span>
            <span>Responsable</span>
            <span>Score</span>
            <span />
          </div>
          {visible.map((client) => (
            <div
              key={client.id}
              onClick={() => openDetail(client)}
              className="group grid cursor-pointer grid-cols-1 gap-1 border-b border-border/50 px-4 py-3 transition-colors last:border-0 hover:bg-accent/40 md:grid-cols-[20px_1.6fr_1.3fr_1fr_0.9fr_0.6fr_auto] md:items-center md:gap-4"
            >
              <div onClick={(event) => event.stopPropagation()} className="flex items-center">
                <Checkbox
                  checked={selectedIds.includes(client.id)}
                  onCheckedChange={() => toggleSelect(client.id)}
                  aria-label={`Seleccionar ${client.name}`}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-medium">{client.name}</p>
                  <span
                    className={cn(
                      'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium',
                      statusMeta(client.status).className
                    )}
                  >
                    {statusMeta(client.status).label}
                  </span>
                </div>
                <p className="truncate text-[11px] text-muted-foreground">{client.email || 'Sin email'}</p>
              </div>
              <div className="min-w-0 text-xs text-muted-foreground">
                <p className="truncate">{client.contact_person || '—'}</p>
                <p className="truncate">{client.phone || ''}</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{client.geographic_zone || '—'}</p>
                {client.daily_property_search && (
                  <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    Búsqueda diaria
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">{client.assigned_to || 'Sin asignar'}</p>
              <div>
                <LeadScoreBadge score={scores[client.id]?.score || 0} />
              </div>
              <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditing(client);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={(event) => {
                    event.stopPropagation();
                    setToDelete(client);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientFormDialog open={formOpen} onOpenChange={setFormOpen} client={editing} onSaved={load} />

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

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(next) => !next && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la ficha del cliente. Las oportunidades e interacciones asociadas conservarán la referencia.
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