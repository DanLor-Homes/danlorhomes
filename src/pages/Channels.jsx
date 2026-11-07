import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GripVertical, Loader2, Megaphone, Plus } from 'lucide-react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import DraggableItem from '@/components/drag/DraggableItem';
import ChannelCard from '@/components/channels/ChannelCard';
import PageHeader from '@/components/crm/PageHeader';
import EmptyState from '@/components/crm/EmptyState';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CHANNELS } from '@/lib/crm';
import { useToast } from '@/components/ui/use-toast';

export default function Channels() {
  const [channels, setChannels] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const [channelRes, oppRes] = await Promise.all([
      base44.entities.Channel.list(),
      base44.entities.Opportunity.filter({ archived: false }, { sort: '-updated_date', limit: 500 }),
    ]);
    const channelList = Array.isArray(channelRes) ? channelRes : channelRes?.items || [];
    setChannels([...channelList].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)));
    setOpportunities(oppRes.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const map = {};
    opportunities.forEach((op) => {
      const key = op.channel_id || '__none';
      if (!map[key]) map[key] = { count: 0, value: 0, won: 0 };
      map[key].count += 1;
      map[key].value += Number(op.amount) || 0;
      if (op.status === 'won') map[key].won += Number(op.amount) || 0;
    });
    return map;
  }, [opportunities]);

  const available = CHANNELS.filter((channel) => !channels.some((item) => item.name === channel.id));

  const addChannel = async () => {
    if (!newName) return;
    setSaving(true);
    try {
      await base44.entities.Channel.create({ name: newName, active: true, order: channels.length });
      setDialogOpen(false);
      setNewName('');
      await load();
      toast({ title: 'Canal añadido' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (channel) => {
    setChannels((list) => list.map((item) => (item.id === channel.id ? { ...item, active: !channel.active } : item)));
    await base44.entities.Channel.update(channel.id, { active: !channel.active });
  };

  const remove = async (channel) => {
    setChannels((list) => list.filter((item) => item.id !== channel.id));
    await base44.entities.Channel.delete(channel.id);
  };

  const handleDragEnd = async (result) => {
    setDragging(false);
    const { source, destination } = result;
    if (!destination || destination.index === source.index) return;

    const next = Array.from(channels);
    const [moved] = next.splice(source.index, 1);
    next.splice(destination.index, 0, moved);
    const reordered = next.map((item, index) => ({ ...item, order: index }));

    setChannels(reordered);
    await base44.entities.Channel.bulkUpdate(reordered.map(({ id, order }) => ({ id, order })));
  };

  return (
    <div>
      <PageHeader
        eyebrow="Captación"
        title="Canales"
        description="Origen de cada oportunidad: trece fuentes fijas definidas en el modelo comercial."
      >
        <Button onClick={() => setDialogOpen(true)} disabled={available.length === 0}>
          <Plus className="mr-1.5 h-4 w-4" /> Añadir canal
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : channels.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Sin canales configurados"
          description="Añade los canales de captación para poder atribuir cada oportunidad."
          action={<Button size="sm" onClick={() => setDialogOpen(true)}>Añadir canal</Button>}
        />
      ) : (
        <>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <GripVertical className="h-3.5 w-3.5" />
            {dragging ? 'Suelta la tarjeta en su nueva posición' : 'Arrastra una tarjeta para cambiar el orden de los canales'}
          </p>
          <DragDropContext onDragStart={() => setDragging(true)} onDragEnd={handleDragEnd}>
            <Droppable droppableId="channels" direction="vertical">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {channels.map((channel, index) => (
                    <DraggableItem key={channel.id} id={channel.id} index={index}>
                      <ChannelCard
                        channel={channel}
                        stats={stats[channel.id] || { count: 0, value: 0, won: 0 }}
                        onToggle={toggleActive}
                        onRemove={remove}
                      />
                    </DraggableItem>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo canal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Canal de captación</Label>
            <Select value={newName} onValueChange={setNewName}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un canal" />
              </SelectTrigger>
              <SelectContent>
                {available.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addChannel} disabled={!newName || saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}