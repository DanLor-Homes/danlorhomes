import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Plus, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import PipelineCard from '@/components/pipeline/PipelineCard';
import OpportunityDialog from '@/components/pipeline/OpportunityDialog';
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
import { CHANNEL_LABELS, STAGES, formatCurrency, probabilityForStage, statusForStage } from '@/lib/crm';

export default function Pipeline() {
  const [opportunities, setOpportunities] = useState([]);
  const [clients, setClients] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    const [oppRes, clientRes, channelRes] = await Promise.all([
      base44.entities.Opportunity.filter({ archived: false }, { sort: '-updated_date', limit: 500 }),
      base44.entities.Client.filter({}, { sort: 'name', limit: 500 }),
      base44.entities.Channel.list(),
    ]);
    setOpportunities(oppRes.items || []);
    setClients(clientRes.items || []);
    setChannels(Array.isArray(channelRes) ? channelRes : channelRes?.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const clientMap = useMemo(
    () => clients.reduce((acc, client) => ({ ...acc, [client.id]: client.name }), {}),
    [clients]
  );

  const channelLabelMap = useMemo(
    () => channels.reduce((acc, channel) => ({ ...acc, [channel.id]: CHANNEL_LABELS[channel.name] || channel.name }), {}),
    [channels]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return opportunities;
    return opportunities.filter(
      (op) =>
        op.name?.toLowerCase().includes(term) ||
        (clientMap[op.client_id] || '').toLowerCase().includes(term)
    );
  }, [opportunities, search, clientMap]);

  const totalOpen = filtered
    .filter((op) => op.status === 'open')
    .reduce((sum, op) => sum + (Number(op.amount) || 0), 0);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    const stage = destination.droppableId;
    const previous = opportunities;

    setOpportunities((list) =>
      list.map((op) =>
        op.id === draggableId
          ? { ...op, stage, probability: probabilityForStage(stage), status: statusForStage(stage) }
          : op
      )
    );

    try {
      await base44.entities.Opportunity.update(draggableId, {
        stage,
        probability: probabilityForStage(stage),
        status: statusForStage(stage),
        stage_changed_date: new Date().toISOString(),
      });
      if (statusForStage(stage) === 'won') {
        base44.analytics.track({ eventName: 'opportunity_won' });
      }
    } catch (error) {
      setOpportunities(previous);
    }
  };

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    await base44.entities.Opportunity.delete(toDelete.id);
    setOpportunities((list) => list.filter((op) => op.id !== toDelete.id));
    setToDelete(null);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Embudo de ventas"
        title="Pipeline"
        description="Arrastra cada oportunidad entre etapas: la probabilidad y el estado se actualizan solos."
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar oportunidad o cliente"
            className="w-full pl-8 sm:w-64"
          />
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" /> Nueva oportunidad
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <span>
          <strong className="font-semibold text-foreground">{filtered.length}</strong> oportunidades
        </span>
        <span>
          Pipeline abierto: <strong className="font-semibold text-foreground">{formatCurrency(totalOpen)}</strong>
        </span>
      </div>

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
            {STAGES.map((stage) => {
              const items = filtered.filter((op) => op.stage === stage.id);
              const value = items.reduce((sum, op) => sum + (Number(op.amount) || 0), 0);
              return (
                <div key={stage.id} className="flex w-[268px] shrink-0 flex-col">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-xs font-semibold">{stage.label}</span>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {items.length}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{stage.probability}%</span>
                  </div>
                  <p className="mb-2 px-1 font-heading text-[11px] font-semibold text-muted-foreground">
                    {formatCurrency(value)}
                  </p>
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[140px] max-h-[calc(100vh-19rem)] flex-1 space-y-2 overflow-y-auto rounded-2xl border border-dashed p-2 transition-colors ${
                          snapshot.isDraggingOver ? 'border-primary/60 bg-primary/5' : 'border-border/60 bg-muted/20'
                        }`}
                      >
                        {items.map((op, index) => (
                          <PipelineCard
                            key={op.id}
                            opportunity={op}
                            index={index}
                            clientName={clientMap[op.client_id]}
                            channelName={channelLabelMap[op.channel_id] || ''}
                            onClick={(selected) => {
                              setEditing(selected);
                              setDialogOpen(true);
                            }}
                            onDelete={setToDelete}
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      <OpportunityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        opportunity={editing}
        clients={clients}
        channels={channels}
        onSaved={load}
      />

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(next) => !next && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará esta oportunidad del pipeline. Esta acción no se puede deshacer.
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