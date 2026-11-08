import React, { useEffect, useMemo, useState } from 'react';
import { Copy, RefreshCw, Search, Sparkles, UserRound, Wand2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/crm/PageHeader';
import StatCard from '@/components/crm/StatCard';
import EmptyState from '@/components/crm/EmptyState';
import ListingCard from '@/components/portals/ListingCard';
import ListingAiDialog from '@/components/portals/ListingAiDialog';
import PriorityDialog from '@/components/portals/PriorityDialog';
import DuplicatesDialog from '@/components/portals/DuplicatesDialog';
import ContactDialog from '@/components/portals/ContactDialog';
import PendingClassificationRow from '@/components/particulares/PendingClassificationRow';
import PortalCoverage from '@/components/particulares/PortalCoverage';
import ClientFormDialog from '@/components/clients/ClientFormDialog';
import { DragDropContext } from '@hello-pangea/dnd';
import DragStatusDock from '@/components/drag/DragStatusDock';
import DragList from '@/components/drag/DragList';
import DraggableItem from '@/components/drag/DraggableItem';
import useStatusDragDrop from '@/hooks/useStatusDragDrop';
import { asArray, PORTALS, LISTING_STATUS } from '@/lib/portals';
import { classificationHint, classifyPublisher } from '@/lib/publisherClassifier';
import { classifyPendingListings } from '@/lib/portalClassification';
import { buildClientDraft, discardListing, markListingContacted, markListingConverted } from '@/lib/listingActions';
import { cn } from '@/lib/utils';

const OPERATION_TABS = [
  { id: 'todas', label: 'Venta y alquiler' },
  { id: 'venta', label: 'Venta' },
  { id: 'alquiler', label: 'Alquiler' },
];

const PENDING_LIMIT = 8;

const LISTING_DROP_STATUSES = ['nuevo', 'revisado', 'contactado', 'convertido', 'descartado'].map((id) => ({
  id,
  label: LISTING_STATUS[id].label,
}));

export default function Particulares() {
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [sources, setSources] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [autoCount, setAutoCount] = useState(0);
  const [operation, setOperation] = useState('todas');
  const [term, setTerm] = useState('');
  const [contactListing, setContactListing] = useState(null);
  const [aiListing, setAiListing] = useState(null);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [duplicatesOpen, setDuplicatesOpen] = useState(false);
  const [formDialog, setFormDialog] = useState({ open: false, client: null, listing: null });

  const load = async () => {
    const [sourceRes, listingRes] = await Promise.all([
      base44.entities.PortalSource.list({ sort: '-created_date', limit: 50 }),
      base44.entities.PortalListing.list({ sort: '-first_seen', limit: 300 }),
    ]);

    const { listings: classified, count } = await classifyPendingListings(asArray(listingRes));
    setListings(classified);
    setSources(asArray(sourceRes));
    setAutoCount(count);
    setLoading(false);
  };

  useEffect(() => {
    load();
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const active = useMemo(() => listings.filter((item) => item.status !== 'descartado'), [listings]);

  const particular = useMemo(
    () =>
      active.filter(
        (item) =>
          item.publisher_type === 'particular' &&
          (operation === 'todas' || item.operation === operation) &&
          `${item.title} ${item.zone} ${item.portal} ${item.description || ''}`.toLowerCase().includes(term.toLowerCase())
      ),
    [active, operation, term]
  );

  const pending = useMemo(() => active.filter((item) => !item.publisher_type || item.publisher_type === 'desconocido'), [active]);

  const stats = useMemo(
    () => ({
      venta: active.filter((item) => item.publisher_type === 'particular' && item.operation === 'venta').length,
      alquiler: active.filter((item) => item.publisher_type === 'particular' && item.operation === 'alquiler').length,
      portales: new Set(sources.filter((item) => item.active).map((item) => item.portal)).size,
    }),
    [active, sources]
  );

  const handleScan = async () => {
    setScanning(true);
    try {
      const response = await base44.functions.invoke('portalMonitor', {});
      const created = response.data?.created || 0;
      const failures = (response.data?.sources || []).filter((item) => item.error);
      const blocked = failures.some((item) => /credit|integration|integraciones/i.test(item.error || ''));
      toast({
        title: created > 0 ? `${created} inmuebles nuevos` : 'Sin novedades',
        description: blocked
          ? 'Los créditos de integración del plan están agotados, así que la búsqueda no puede ejecutarse todavía.'
          : created > 0
            ? 'Se han clasificado automáticamente en particulares o inmobiliarias.'
            : 'No hay anuncios nuevos desde la última revisión.',
        variant: blocked ? 'destructive' : 'default',
      });
      await load();
    } catch (error) {
      const message = error?.response?.data?.message || error.message;
      toast({
        title: 'No se pudo buscar en los portales',
        description: /credit|integracion/i.test(message)
          ? 'Los créditos de integración del plan están agotados. Se renovarán el próximo ciclo.'
          : message,
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  const handleClassify = async (listing, publisherType) => {
    await base44.entities.PortalListing.update(listing.id, { publisher_type: publisherType });
    setListings((prev) => prev.map((item) => (item.id === listing.id ? { ...item, publisher_type: publisherType } : item)));
    toast({
      title: publisherType === 'particular' ? 'Marcado como particular' : 'Marcado como inmobiliaria',
      description: listing.title,
    });
  };

  const handleConvert = (listing) => {
    setFormDialog({ open: true, client: buildClientDraft(listing), listing });
  };

  const handleClientSaved = async (client) => {
    if (formDialog.listing && client?.id) {
      await markListingConverted(formDialog.listing, client.id);
    }
    setFormDialog({ open: false, client: null, listing: null });
    toast({ title: 'Cliente creado', description: 'Ficha autorrellenada con los datos del anuncio.' });
    await load();
  };

  const handleDiscard = async (listing) => {
    const removing = listing.status === 'descartado';
    try {
      if (removing) {
        await base44.entities.PortalListing.delete(listing.id);
      } else {
        await discardListing(listing);
      }
      setListings((prev) =>
        removing
          ? prev.filter((item) => item.id !== listing.id)
          : prev.map((item) => (item.id === listing.id ? { ...item, status: 'descartado' } : item))
      );
      toast({
        title: removing ? 'Inmueble eliminado' : 'Anuncio descartado',
        description: listing.title,
      });
    } catch (error) {
      toast({
        title: 'No se pudo quitar el inmueble',
        description: error?.message || 'Vuelve a intentarlo.',
        variant: 'destructive',
      });
    }
  };

  const handleContacted = async (listing) => {
    await markListingContacted(listing, user?.email || '');
    toast({ title: 'Contacto registrado', description: 'Tienes una tarea de seguimiento en 3 días.' });
    setContactListing(null);
    await load();
  };

  const drag = useStatusDragDrop({
    onMove: async (id, status) => {
      const listing = listings.find((item) => item.id === id);
      if (!listing || listing.status === status) return;
      setListings((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
      await base44.entities.PortalListing.update(id, { status });
      toast({
        title: 'Anuncio movido',
        description: `${listing.title} → ${LISTING_STATUS[status]?.label || status}`,
      });
    },
    onTrash: (id) => {
      const listing = listings.find((item) => item.id === id);
      if (listing) handleDiscard(listing);
    },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Captación"
        title="Particulares"
        description="Inmuebles publicados por propietarios, en venta o alquiler, detectados y clasificados automáticamente en todos los portales vigilados."
      >
        <Button variant="outline" onClick={() => setDuplicatesOpen(true)} disabled={particular.length < 2}>
          <Copy className="h-4 w-4" /> Duplicados
        </Button>
        <Button variant="outline" onClick={() => setPriorityOpen(true)} disabled={!particular.length}>
          <Sparkles className="h-4 w-4" /> A quién llamar
        </Button>
        <Button variant="outline" onClick={handleScan} disabled={scanning || !sources.length}>
          <RefreshCw className={cn('h-4 w-4', scanning && 'animate-spin')} />
          {scanning ? 'Buscando…' : 'Buscar en todas las webs'}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Particulares en venta" value={stats.venta} hint="Propietarios directos" icon={UserRound} />
        <StatCard label="Particulares en alquiler" value={stats.alquiler} hint="Propietarios directos" icon={UserRound} tone="violet" />
        <StatCard label="Sin clasificar" value={pending.length} hint="Sin señales suficientes" icon={Search} tone="amber" />
        <StatCard label="Portales vigilados" value={stats.portales} hint={`${PORTALS.length} portales disponibles`} icon={Wand2} tone="emerald" />
      </div>

      {autoCount > 0 && (
        <p className="mt-3 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-[11px] text-primary">
          Clasificación automática: {autoCount} anuncio{autoCount === 1 ? '' : 's'} asignado{autoCount === 1 ? '' : 's'} en esta revisión.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {OPERATION_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setOperation(tab.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                operation === tab.id
                  ? 'border-primary/40 bg-primary/12 text-foreground'
                  : 'border-border/70 text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Zona, título o portal"
            className="h-9 pl-8 text-sm"
          />
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Clasificando anuncios…</p>
        ) : particular.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title="Sin particulares clasificados"
            description={
              sources.length
                ? 'Pulsa «Buscar en todas las webs» para revisar los portales, o confirma abajo los anuncios pendientes de clasificar.'
                : 'Configura tus búsquedas de portal para empezar a detectar propietarios directos.'
            }
          />
        ) : (
          <DragDropContext onDragStart={drag.handleDragStart} onDragEnd={drag.handleDragEnd}>
            <DragStatusDock
              statuses={LISTING_DROP_STATUSES}
              dragging={drag.dragging}
              hint="Arrastra un anuncio para cambiar su estado o descartarlo"
            />
            <DragList className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {particular.map((listing, index) => (
                <DraggableItem key={listing.id} id={listing.id} index={index}>
                  <ListingCard
                    listing={listing}
                    publisherHint={classificationHint(listing)}
                    onContact={setContactListing}
                    onAnalyze={setAiListing}
                    onConvert={handleConvert}
                    onDiscard={handleDiscard}
                  />
                </DraggableItem>
              ))}
            </DragList>
          </DragDropContext>
        )}
      </div>

      {pending.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-heading text-sm font-bold">Pendientes de clasificar ({pending.length})</h2>
            <p className="text-[11px] text-muted-foreground">Anuncios sin señales claras: confírmalos en un clic.</p>
          </div>
          <div className="space-y-2">
            {pending.slice(0, PENDING_LIMIT).map((listing) => (
              <PendingClassificationRow
                key={listing.id}
                listing={listing}
                evidence={classifyPublisher(listing).evidence.join(', ')}
                onClassify={handleClassify}
              />
            ))}
          </div>
          {pending.length > PENDING_LIMIT && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              y {pending.length - PENDING_LIMIT} anuncios más en la lista de Portales.
            </p>
          )}
        </section>
      )}

      <PortalCoverage sources={sources} />

      <ListingAiDialog
        listing={aiListing}
        open={Boolean(aiListing)}
        onOpenChange={(open) => !open && setAiListing(null)}
        onContact={setContactListing}
        onConvert={handleConvert}
      />

      <PriorityDialog
        open={priorityOpen}
        onOpenChange={setPriorityOpen}
        listings={particular}
        onAnalyze={setAiListing}
      />

      <DuplicatesDialog
        open={duplicatesOpen}
        onOpenChange={setDuplicatesOpen}
        listings={active.filter((item) => item.publisher_type === 'particular')}
        onDone={load}
      />

      <ContactDialog
        listing={contactListing}
        open={Boolean(contactListing)}
        onOpenChange={(open) => !open && setContactListing(null)}
        onContacted={handleContacted}
      />

      <ClientFormDialog
        open={formDialog.open}
        onOpenChange={(open) => setFormDialog((prev) => ({ ...prev, open }))}
        client={formDialog.client}
        onSaved={handleClientSaved}
      />
    </div>
  );
}