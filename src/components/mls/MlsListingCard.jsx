import React from 'react';
import { Image as ImageIcon, MapPin, BedDouble, Bath, Maximize, Network, Percent } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { formatCurrency } from '@/lib/crm';
import { operationLabel, propertyTypeLabel } from '@/lib/properties';
import { MLS_STATUS_STYLES, mlsStatusLabel } from '@/lib/mls';
import { cn } from '@/lib/utils';

export default function MlsListingCard({ listing, onOpen }) {
  const photo = listing.photos?.[0]?.file_url;

  return (
    <article
      onClick={() => onOpen(listing)}
      className="card-surface group flex cursor-pointer flex-col overflow-hidden transition-colors hover:border-primary/40"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {photo ? (
          <Image src={photo} alt={listing.title} className="h-full w-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-7 w-7" />
          </div>
        )}
        <span className="absolute left-2.5 top-2.5 rounded-md bg-background/85 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur">
          {operationLabel(listing.operation)}
        </span>
        <span className="absolute right-2.5 top-2.5 inline-flex max-w-[55%] items-center gap-1 truncate rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
          <Network className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">{listing.agency}</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-heading text-[15px] font-semibold leading-tight">{listing.title}</p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              {listing.zone || listing.municipality || 'Sin zona'} · {propertyTypeLabel(listing.property_type)}
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
              MLS_STATUS_STYLES[listing.status] || 'bg-muted text-muted-foreground'
            )}
          >
            {mlsStatusLabel(listing.status)}
          </span>
        </div>

        <p className="font-heading text-lg font-bold leading-none">{formatCurrency(listing.price)}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {listing.surface ? (
            <span className="flex items-center gap-1">
              <Maximize className="h-3 w-3" /> {listing.surface} m²
            </span>
          ) : null}
          {listing.rooms ? (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3 w-3" /> {listing.rooms} hab.
            </span>
          ) : null}
          {listing.bathrooms ? (
            <span className="flex items-center gap-1">
              <Bath className="h-3 w-3" /> {listing.bathrooms} baños
            </span>
          ) : null}
        </div>

        {listing.commission_percent ? (
          <p className="mt-auto flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
            <Percent className="h-3 w-3" /> {listing.commission_percent} % honorarios compartidos
          </p>
        ) : null}
      </div>
    </article>
  );
}