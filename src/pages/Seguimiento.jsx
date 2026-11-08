import React, { useEffect, useMemo, useState } from 'react';
import { Building2, CalendarClock, MessageCircle, ScanSearch } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/crm/PageHeader';
import StatCard from '@/components/crm/StatCard';
import CaptureList from '@/components/seguimiento/CaptureList';
import PortfolioList from '@/components/seguimiento/PortfolioList';
import ListingAiDialog from '@/components/portals/ListingAiDialog';
import ContactDialog from '@/components/portals/ContactDialog';
import ClientFormDialog from '@/components/clients/ClientFormDialog';
import { asArray } from '@/lib/portals';
import { daysUntil } from '@/lib/followUp';
import {
  buildClientDraft,
  discardListing,
  isoInDays,
  markListingContacted,
  markListingConverted,
} from '@/lib/listingActions';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'captacion', label: 'Anuncios en captación' },
  { id: 'cartera', label: 'Cartera de inmuebles' },
];

const CAPTURE_STATUSES = ['nuevo', 'revisado', 'contactado'];
const CLOSED_PROPERTY_STATUSES = ['vendido', 'retirado'];

export default function Seguimiento() {
  const { toast } = useToast();
  const [tab, setTab] = useState('captacion');
  const [listings, setListings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiListing, setAiListing] = useState(null);
  const [contactListing, setContactListing] = useState(null);
  const [formDialog, setFormDialog] = useState({ open: false, client: null, listing: null });

  const load = async () => {
    const [listingRes, propertyRes, interactionRes] = await Promise.all([
      base44.entities.PortalListing.list({ sort: '-first_seen', limit: 300 }),
      base44.entities.Property.list({ sort: '-created_date', limit: 300 }),
      base44.entities.Interaction.filter({ type: 'visita' }, { sort: '-date', limit: 500 }),
    ]);
    setListings(asArray(listingRes));
    setProperties(asArray(propertyRes));
    setInteractions(asArray(interactionRes));
    setLoading(false);
  };

  useEffect(() => {
    load();
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const capture = useMemo(
    () =>
      listings
        .filter((item) => CAPTURE_STATUSES.includes(item.status))
        .sort((a, b) => new Date(a.first_seen || 0) - new Date(b.first_seen || 0)),
    [listings]
  );

  const portfolio = useMemo(
    () => properties.filter((item) => !CLOSED_PROPERTY_STATUSES.includes(item.status)),
    [properties]
  );

  const visitsByProperty = useMemo(() => {
    const map = {};
    interactions.forEach((item) => {
      if (!item.property_id) return;
      const entry = map[item.property_id] || { count: 0, last: null };
      entry.count += 1;
      if (!entry.last || new Date(item.date) > new Date(entry.last)) entry.last = item.date;
      map[item.property_id] = entry;
    });
    return map;
  }, [interactions]);

  const stats = useMemo(
    () => ({
      captacion: capture.length,
      contactados: capture.filter((item) => item.status === 'contactado').length,
      cartera: portfolio.length,
      mandatos: portfolio.filter((item) => {
        const days = daysUntil(item.mandate_end);
        return days !== null && days <= 30;
      }).length,
    }),
    [capture, portfolio]
  );

  const handleContacted = async (listing) => {
    await markListingContacted(listing, user?.email || '');
    toast({ title: 'Contacto registrado', description: 'Tienes una tarea de seguimiento en 3 días.' });
    setContactListing(null);
    await load();
  };

  const handleConvert = (listing) => {
    setFormDialog({ open: true, client: buildClientDraft(listing), listing });
  };

  const handleClientSaved = async (client) => {
    if (formDialog.listing && client?.id) {
      await markListingConverted(formDialog.listing, client.id);
    }
    setFormDialog({ open: false, client: null, listing: null });
    toast({ title: 'Cliente creado', description: 'La captación sale del seguimiento y pasa al CRM.' });
    await load();
  };

  const handleDiscard = async (listing) => {
    try {
      await discardListing(listing);
      setListings((prev) => prev.map((item) => (item.id === listing.id ? { ...item, status: 'descartado' } : item)));
      toast({ title: 'Anuncio descartado', description: listing.title });
    } catch (error) {
      toast({ title: 'No se pudo descartar', description: error.message, variant: 'destructive' });
    }
  };

  const handleFollowUp = async (property) => {
    await base44.entities.CommercialTask.create({
      title: `Seguimiento de ${property.title}`.slice(0, 90),
      due_date: isoInDays(3),
      status: 'pendiente',
      category: 'seguimiento',
      auto_generated: true,
      assignee: user?.email || '',
    });
    toast({ title: 'Tarea creada', description: `Seguimiento de ${property.title} en 3 días.` });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Inmuebles"
        title="Seguimiento"
        description="Del anuncio captado en el portal hasta la ficha en cartera: qué toca hoy en cada inmueble."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="En captación" value={stats.captacion} hint="Anuncios sin cerrar" icon={ScanSearch} />
        <StatCard label="Contactados" value={stats.contactados} hint="Seguimiento abierto" icon={MessageCircle} tone="violet" />
        <StatCard label="Cartera activa" value={stats.cartera} hint="Inmuebles en comercialización" icon={Building2} tone="emerald" />
        <StatCard label="Mandatos a vencer" value={stats.mandatos} hint="Próximos 30 días" icon={CalendarClock} tone="amber" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-1.5">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              tab === item.id
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
          <p className="py-10 text-center text-sm text-muted-foreground">Cargando seguimiento…</p>
        ) : tab === 'captacion' ? (
          <CaptureList
            listings={capture}
            onContact={setContactListing}
            onAnalyze={setAiListing}
            onConvert={handleConvert}
            onDiscard={handleDiscard}
          />
        ) : (
          <PortfolioList properties={portfolio} visitsByProperty={visitsByProperty} onFollowUp={handleFollowUp} />
        )}
      </div>

      <ListingAiDialog
        listing={aiListing}
        open={Boolean(aiListing)}
        onOpenChange={(open) => !open && setAiListing(null)}
        onContact={setContactListing}
        onConvert={handleConvert}
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