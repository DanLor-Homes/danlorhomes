import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/lib/crm';
import { operationLabel, propertyTypeLabel } from '@/lib/properties';
import MlsStatusSelect from '@/components/mls/MlsStatusSelect';
import EmptyState from '@/components/crm/EmptyState';
import { Image as ImageIcon, MessageSquare, Network, Plus } from 'lucide-react';

export default function MyMlsListings({ listings, interests, onOpen, onChanged, onPublish }) {
  const { toast } = useToast();

  const handleStatus = async (listing, status) => {
    await base44.entities.MlsListing.update(listing.id, { status });
    toast({ title: 'Estado actualizado en la bolsa' });
    onChanged?.();
  };

  if (!listings.length) {
    return (
      <EmptyState
        icon={Network}
        title="Todavía no compartes ningún inmueble"
        description="Publica inmuebles de tu cartera para que otras agencias de la red puedan traerte compradores."
        action={
          <Button size="sm" className="gap-1.5" onClick={onPublish}>
            <Plus className="h-4 w-4" /> Compartir inmueble
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {listings.map((listing) => {
        const photo = listing.photos?.[0]?.file_url;
        const received = interests.filter((item) => item.mls_listing_id === listing.id).length;

        return (
          <article
            key={listing.id}
            className="card-surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center"
          >
            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
              {photo ? (
                <Image src={photo} alt={listing.title} className="h-full w-full" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-[15px] font-semibold leading-tight">{listing.title}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {operationLabel(listing.operation)} · {propertyTypeLabel(listing.property_type)} ·{' '}
                {listing.zone || listing.municipality || 'Sin zona'}
                {listing.published_date ? ` · ${formatDate(listing.published_date)}` : ''}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">{formatCurrency(listing.price)}</span>
                {listing.commission_percent ? <span>{listing.commission_percent} % compartido</span> : null}
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> {received}{' '}
                  {received === 1 ? 'solicitud' : 'solicitudes'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MlsStatusSelect listing={listing} onChange={handleStatus} />
              <Button variant="outline" size="sm" onClick={() => onOpen(listing)}>
                Ver
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}