import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmptyState from '@/components/crm/EmptyState';
import MlsFilters from '@/components/mls/MlsFilters';
import MlsListingCard from '@/components/mls/MlsListingCard';
import MlsListingDialog from '@/components/mls/MlsListingDialog';
import MlsPublishDialog from '@/components/mls/MlsPublishDialog';
import MyMlsListings from '@/components/mls/MyMlsListings';
import MlsInterestsPanel from '@/components/mls/MlsInterestsPanel';
import MlsPartnersPanel from '@/components/mls/MlsPartnersPanel';
import { emptyMlsFilters, isMineListing } from '@/lib/mls';
import { MessageSquare, Network, Plus, Search, Share2 } from 'lucide-react';

const buildQuery = (filters) => {
  const query = {};
  if (filters.operation) query.operation = filters.operation;
  if (filters.property_type) query.property_type = filters.property_type;
  if (filters.zone) query.zone = filters.zone;
  if (filters.status) query.status = filters.status;
  const maxPrice = Number(filters.max_price);
  if (maxPrice > 0) query.price = { $lte: maxPrice };
  const term = filters.q.trim();
  if (term) {
    query.$or = [
      { title: { $regex: term, $options: 'i' } },
      { zone: { $regex: term, $options: 'i' } },
      { agency: { $regex: term, $options: 'i' } },
    ];
  }
  return query;
};

export default function Bolsa() {
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState(emptyMlsFilters);
  const [listings, setListings] = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [interests, setInterests] = useState([]);
  const [partners, setPartners] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [publishOpen, setPublishOpen] = useState(false);

  const loadSupport = async () => {
    const [interestPage, partnerPage, listingPage, zonePage] = await Promise.all([
      base44.entities.MlsInterest.list({ sort: '-created_date', limit: 200 }),
      base44.entities.MlsPartner.list({ sort: 'name', limit: 200 }),
      base44.entities.MlsListing.list({ sort: '-published_date', limit: 200 }),
      base44.entities.MlsListing.list({ distinct: 'zone' }),
    ]);
    setInterests(interestPage.items || []);
    setPartners(partnerPage.items || []);
    setAllListings(listingPage.items || []);
    setZones((zonePage.items || []).filter(Boolean));
  };

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
    loadSupport();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const page = await base44.entities.MlsListing.filter(buildQuery(filters), {
          sort: '-published_date',
          limit: 60,
        });
        if (!cancelled) setListings(page.items || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, filters.q ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters]);

  const refresh = () => {
    loadSupport();
    setFilters((prev) => ({ ...prev }));
  };

  const mine = useMemo(
    () => allListings.filter((listing) => isMineListing(listing, user?.id)),
    [allListings, user]
  );
  const newInterests = interests.filter((interest) => interest.status === 'nuevo').length;

  return (
    <div>
      <PageHeader
        eyebrow="Bolsa inmobiliaria"
        title="Bolsa de la red (MLS)"
        description="Comparte inmuebles con otras agencias, encuentra cartera ajena para tus compradores y acuerda los honorarios sin salir del CRM."
      >
        <Button className="gap-1.5" onClick={() => setPublishOpen(true)}>
          <Plus className="h-4 w-4" /> Compartir inmueble
        </Button>
      </PageHeader>

      <Tabs defaultValue="bolsa">
        <TabsList className="mb-4 flex w-full flex-wrap justify-start gap-1 sm:w-auto">
          <TabsTrigger value="bolsa" className="gap-1.5">
            <Search className="h-3.5 w-3.5" /> Bolsa ({listings.length})
          </TabsTrigger>
          <TabsTrigger value="mias" className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" /> Mis publicaciones ({mine.length})
          </TabsTrigger>
          <TabsTrigger value="intereses" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Solicitudes
            {newInterests > 0 ? ` (${newInterests})` : ''}
          </TabsTrigger>
          <TabsTrigger value="red" className="gap-1.5">
            <Network className="h-3.5 w-3.5" /> Red ({partners.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bolsa">
          <MlsFilters filters={filters} onChange={setFilters} zones={zones} />

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
            </div>
          ) : listings.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <MlsListingCard key={listing.id} listing={listing} onOpen={setSelected} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="Ningún inmueble coincide con la búsqueda"
              description="Prueba con otra zona, sube el presupuesto o cambia el estado para ver toda la bolsa."
              action={
                <Button size="sm" variant="outline" onClick={() => setFilters(emptyMlsFilters())}>
                  Limpiar filtros
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="mias">
          <MyMlsListings
            listings={mine}
            interests={interests}
            onOpen={setSelected}
            onChanged={refresh}
            onPublish={() => setPublishOpen(true)}
          />
        </TabsContent>

        <TabsContent value="intereses">
          <MlsInterestsPanel interests={interests} onChanged={refresh} />
        </TabsContent>

        <TabsContent value="red">
          <MlsPartnersPanel partners={partners} onChanged={refresh} />
        </TabsContent>
      </Tabs>

      <MlsListingDialog
        listing={selected}
        onClose={() => setSelected(null)}
        isMine={isMineListing(selected, user?.id)}
        interests={selected ? interests.filter((item) => item.mls_listing_id === selected.id) : []}
        user={user}
        onChanged={refresh}
      />

      <MlsPublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        onSaved={refresh}
        user={user}
      />
    </div>
  );
}