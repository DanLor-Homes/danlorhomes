import React from 'react';
import { Image as ImageIcon, MapPin, BedDouble, Maximize, Star } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { formatCurrency } from '@/lib/crm';
import { operationLabel, pricePerM2, propertyStatusLabel, propertyTypeLabel } from '@/lib/properties';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  captacion: 'bg-chart-4/15 text-chart-4',
  disponible: 'bg-chart-2/15 text-chart-2',
  reservado: 'bg-chart-3/15 text-chart-3',
  vendido: 'bg-primary/15 text-primary',
  retirado: 'bg-muted text-muted-foreground',
};

export default function PropertyCard({ property, matches = 0, onClick }) {
  const photo = property.photos?.[0]?.file_url;
  const perM2 = pricePerM2(property.price, property.surface);

  return (
    <article
      onClick={onClick}
      className="card-surface card-hover group flex cursor-pointer flex-col overflow-hidden"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {photo ? (
          <Image src={photo} alt={property.title} className="h-full w-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-7 w-7" />
          </div>
        )}
        <span className="absolute left-2.5 top-2.5 rounded-md bg-background/85 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur">
          {operationLabel(property.operation)}
        </span>
        {property.exclusive && (
          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            <Star className="h-2.5 w-2.5" /> Exclusiva
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-heading text-[15px] font-semibold leading-tight">{property.title}</p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              {property.zone || 'Sin zona'} · {propertyTypeLabel(property.property_type)}
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
              STATUS_STYLES[property.status] || 'bg-muted text-muted-foreground'
            )}
          >
            {propertyStatusLabel(property.status)}
          </span>
        </div>

        <p className="font-heading text-lg font-bold leading-none">{formatCurrency(property.price)}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {property.surface ? (
            <span className="flex items-center gap-1">
              <Maximize className="h-3 w-3" /> {property.surface} m²
            </span>
          ) : null}
          {property.rooms ? (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3 w-3" /> {property.rooms} hab.
            </span>
          ) : null}
          {perM2 ? <span>{formatCurrency(perM2)}/m²</span> : null}
        </div>

        {matches > 0 && (
          <p className="mt-auto rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
            {matches} {matches === 1 ? 'demandante encaja' : 'demandantes encajan'}
          </p>
        )}
      </div>
    </article>
  );
}