import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Globe, Plus, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/crm/PageHeader';
import StatCard from '@/components/crm/StatCard';
import EmptyState from '@/components/crm/EmptyState';
import SourceCard from '@/components/portals/SourceCard';
import SourceDialog from '@/components/portals/SourceDialog';
import ListingCard from '@/components/portals/ListingCard';
import ContactDialog from '@/components/portals/ContactDialog';
import ClientFormDialog from '@/components/clients/ClientFormDialog';
import { DragDropContext } from '@hello-pangea/dnd';
import DragStatusDock from '@/components/drag/DragStatusDock';
import DragList from '@/components/drag/DragList';
import DraggableItem from '@/components/drag/DraggableItem';
import useStatusDragDrop from '@/hooks/useStatusDragDrop';
import { asArray, LISTING_STATUS } from '@/lib/portals';
import { buildClientDraft, discardListing, markListingContacted, markListingConverted } from '@/lib/listingActions';
import { classifyPendingListings } from '@/lib/portalClassification';
import { cn } from '@/lib/utils';

const PUBLISHER_TABS = [
  { id: 'particular', label: 'Particulares' },
  { id: 'inmobiliaria', label: 'Inmobiliarias' },
];

const FILTERS = [
  { id: 'nuevo', label: 'Nuevos' },
  { id: 'contactado', label: 'Contactados' },
  { id: 'convertido', label: 'Clientes' },
  { id: 'descartado', label: 'Descartados' },
  { id: 'todos', label: 'Todos' },
];

const LISTING_DROP_STATUSES = ['nuevo', 'revisado', 'contactado', 'convertido', 'descartado'].map((id) => ({
  id,
  label: LISTING_STATUS[id].label,
}));

export default function Portales() {
  const { toast } = useToast();
  const [sources, setSources] = useState([]);
  const [listings, setListings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState('nuevo');
  const [publisher, setPublisher] = useState('particular');
  const [sourceDialog, setSourceDialog] = useState({ open: false, source: null });
  const [contactListing, setContactListing] = useState(null);
  const [formDialog, setFormDialog] = useState({ open: false, client: null, listing: null });

  const load = async () => {
    const [sourceRes, listingRes] = await Promise.all([
      base44.entities.PortalSource.list({ sort: '-created_date', limit: 50 }),
      base44.entities.PortalListing.list({ sort: '-first_seen', limit: 200 }),
    ]);
    const { listings: classified } = await classifyPendingListings(asArray(listingRes));
    setSources(asArray(sourceRes));
    setListings(classified);
    setLoading(false);
  };

  useEffect(() => {
    load();
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const counts = useMemo(
    () => ({
      nuevos: listings.filter((item) => item.status === 'nuevo').length,
      contactados: listings.filter((item) => item.status === 'contactado').length,
      convertidos: listings.filter((item) => item.status === 'convertido').length,
      activas: sources.filter((item) => item.active).length,
    }),
    [listings, sources]
  );

  const publisherCounts = useMemo(
    () => ({
      particular: listings.filter((item) => item.publisher_type === 'particular').length,
      inmobiliaria: listings.filter((item) => item.publisher_type === 'inmobiliaria').length,
      desconocido: listings.filter((item) => !item.publisher_type || item.publisher_type === 'desconocido').length,
    }),
    [listings]
  );

  const visible = useMemo(() => {
    const byPublisher = listings.filter((item) =>
      publisher === 'desconocido'
        ? !item.publisher_type || item.publisher_type === 'desconocido'
        : item.publisher_type === publisher
    );
    return filter === 'todos' ? byPublisher : byPublisher.filter((item) => item.status === filter);
  }, [listings, filter, publisher]);

  const handleScan = async (source) => {
    setScanning(true);
    try {
      const response = await base44.functions.invoke('portalMonitor', source ? { source_id: source.id } : {});
      const created = response.data?.created || 0;
      const failures = (response.data?.sources || []).filter((item) => item.error);
      toast({
        title: created > 0 ? `${created} inmuebles nuevos` : 'Sin novedades',
        description:
          created > 0
            ? 'Se han añadido al listado de captación.'
            : failures.length
              ? 'Alguna búsqueda no devolvió resultados. Vuelve a intentarlo más tarde.'
              : 'No hay anuncios nuevos desde la última revisión.',
      });
      await load();
    } catch (error) {
      toast({
        title: 'No se pudo revisar los portales',
        description: error?.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  const handleConvert = (listing) => {
    setFormDialog({ open: true, client: buildClientDraft(listing), listing });
  };

  const handleClientSaved = async (client) => {
    try {
      if (formDialog.listing && client?.id) {
        await markListingConverted(formDialog.listing, client.id);
      }
      setFormDialog({ open: false, client: null, listing: null });
      toast({ title: 'Cliente creado', description: 'Ficha autorrellenada con los datos del anuncio.' });
      await load();
    } catch (error) {
      toast({ title: 'No se pudo cerrar la captación', description: error.message, variant: 'destructive' });
    }
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
    try {
      await markListingContacted(listing, user?.email || '');
      toast({ title: 'Contacto registrado', description: 'Tienes una tarea de seguimiento en 3 días.' });
      setContactListing(null);
      await load();
    } catch (error) {
      toast({ title: 'No se pudo registrar el contacto', description: error.message, variant: 'destructive' });
    }
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

  const handleDeleteSource = async (source) => {
    if (!window.confirm(`¿Eliminar la búsqueda «${source.label}»?`)) return;
    await base44.entities.PortalSource.delete(source.id);
    await load();
  };

  const handleToggleSource = async (source, active) => {
    await base44.entities.PortalSource.update(source.id, { active });
    await load();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Captación"
        title="Portales"
        description="Revisa a diario los inmuebles publicados en los portales, contacta con el anunciante y conviértelo en cliente."
      >
        <Button variant="outline" onClick={() => handleScan(null)} disabled={scanning || !sources.length}>
          <RefreshCw className={cn('h-4 w-4', scanning && 'animate-spin')} />
          {scanning ? 'Revisando…' : 'Revisar ahora'}
        </Button>
        <Button onClick={() => setSourceDialog({ open: true, source: null })}>
          <Plus className="h-4 w-4" /> Nueva búsqueda
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Inmuebles nuevos" value={counts.nuevos} hint="Pendientes de revisar" icon={Building2} />
        <StatCard label="Contactados" value={counts.contactados} hint="Con seguimiento abierto" icon={Globe} tone="violet" />
        <StatCard label="Convertidos" value={counts.convertidos} hint="Ya son clientes" icon={Plus} tone="emerald" />
        <StatCard label="Búsquedas activas" value={counts.activas} hint={`${sources.length} configuradas`} icon={RefreshCw} tone="amber" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="inline-flex gap-1 rounded-full border border-border/70 bg-muted/40 p-1">
          {PUBLISHER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPublisher(tab.id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                publisher === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] font-medium text-muted-foreground">{publisherCounts[tab.id]}</span>
            </button>
          ))}
        </div>
        {publisherCounts.desconocido > 0 && (
          <button
            onClick={() => setPublisher('desconocido')}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              publisher === 'desconocido'
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-300'
                : 'border-dashed border-border/70 text-muted-foreground hover:text-foreground'
            )}
          >
            Sin clasificar · {publisherCounts.desconocido}
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              filter === item.id
                ? 'border-primary/40 bg-primary/12 text-foreground'
                : 'border-border/70 text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Cargando portales…</p>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Sin inmuebles en esta vista"
            description={
              sources.length
                ? 'Pulsa «Revisar ahora» para buscar anuncios nuevos con las búsquedas activas.'
                : 'Crea tu primera búsqueda de portal para empezar a recibir inmuebles.'
            }
            action={
              <Button size="sm" onClick={() => setSourceDialog({ open: true, source: null })}>
                <Plus className="h-3.5 w-3.5" /> Nueva búsqueda
              </Button>
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
              {visible.map((listing, index) => (
                <DraggableItem key={listing.id} id={listing.id} index={index}>
                  <ListingCard
                    listing={listing}
                    onContact={setContactListing}
                    onConvert={handleConvert}
                    onDiscard={handleDiscard}
                  />
                </DraggableItem>
              ))}
            </DragList>
          </DragDropContext>
        )}
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-sm font-bold">Búsquedas de portales</h2>
          <p className="text-[11px] text-muted-foreground">
            Revisión automática cada día a las 07:00 (hora peninsular) · También puedes lanzarla con «Revisar ahora»
          </p>
        </div>

        {sources.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="Sin búsquedas configuradas"
            description="Añade el portal, la zona y la operación que quieres vigilar."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                scanning={scanning}
                onScan={handleScan}
                onEdit={(item) => setSourceDialog({ open: true, source: item })}
                onDelete={handleDeleteSource}
                onToggle={handleToggleSource}
              />
            ))}
          </div>
        )}
      </section>

      <SourceDialog
        open={sourceDialog.open}
        source={sourceDialog.source}
        onOpenChange={(open) => setSourceDialog({ open, source: open ? sourceDialog.source : null })}
        onSaved={load}
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