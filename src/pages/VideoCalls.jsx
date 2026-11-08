import React, { useEffect, useState } from 'react';
import { Loader2, Video } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import VideoCallDialog from '@/components/video/VideoCallDialog';
import VideoCallRow from '@/components/video/VideoCallRow';
import VideoRoom from '@/components/video/VideoRoom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { roomFromContent, roomUrl } from '@/lib/video';

export default function VideoCalls() {
  const [clients, setClients] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    const [interactions, clientsPage] = await Promise.all([
      base44.entities.Interaction.filter({ source: 'videollamada' }, { sort: '-date', limit: 30 }),
      base44.entities.Client.list({ sort: 'name', limit: 300 }),
    ]);
    setClients(clientsPage.items || []);
    setCalls((interactions.items || []).map((item) => ({ ...item, room: roomFromContent(item.content) })));
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const clientById = (id) => clients.find((client) => client.id === id);

  const handleCreate = async ({ client_id, date, room }) => {
    setSaving(true);
    try {
      const created = await base44.entities.Interaction.create({
        client_id,
        type: 'reunion',
        date,
        content: `Videollamada: ${roomUrl(room)}`,
        source: 'videollamada',
      });
      await load();
      setOpen(false);
      setActive({ ...created, room });
    } catch (error) {
      toast({ title: 'No se pudo crear la videollamada', description: error?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Comercial"
        title="Videollamadas"
        description="Crea una sala privada por cliente, comparte el enlace y reúnete sin salir del CRM."
      >
        <Button onClick={() => setOpen(true)}>
          <Video className="mr-1.5 h-4 w-4" /> Nueva videollamada
        </Button>
      </PageHeader>

      {active ? (
        <VideoRoom call={active} client={clientById(active.client_id)} onLeave={() => setActive(null)} />
      ) : (
        <section className="card-surface overflow-hidden">
          <div className="border-b border-border/70 px-4 py-3">
            <h3 className="font-heading text-sm font-bold">Últimas videollamadas</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Quedan registradas en el histórico del cliente como reunión.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
            </div>
          ) : calls.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <p className="text-sm font-medium">Todavía no hay videollamadas</p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Crea la primera sala y comparte el enlace por WhatsApp o correo con tu cliente.
              </p>
            </div>
          ) : (
            calls.map((call) => (
              <VideoCallRow key={call.id} call={call} client={clientById(call.client_id)} onJoin={setActive} />
            ))
          )}
        </section>
      )}

      <VideoCallDialog
        open={open}
        onOpenChange={setOpen}
        clients={clients}
        saving={saving}
        onCreate={handleCreate}
      />
    </div>
  );
}