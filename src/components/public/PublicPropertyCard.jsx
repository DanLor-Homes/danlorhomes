import React from 'react';
import { BedDouble, Image as ImageIcon, MapPin, Maximize } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { formatCurrency } from '@/lib/crm';
import { operationLabel, propertyTypeLabel } from '@/lib/properties';

export default function PublicPropertyCard({ property }) {
  const photo = property.photos?.[0];

  return (
    <article className="card-surface flex flex-col overflow-hidden">
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
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="font-heading text-[15px] font-semibold leading-tight">{property.title}</p>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          {property.zone || 'Zona a consultar'} · {propertyTypeLabel(property.type)}
        </p>
        <p className="font-heading text-lg font-bold leading-none">
          {formatCurrency(property.price)}
          {property.operation === 'alquiler' ? <span className="text-xs font-medium text-muted-foreground"> /mes</span> : null}
        </p>

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
          {property.bathrooms ? <span>{property.bathrooms} baños</span> : null}
        </div>

        {property.description ? (
          <p className="line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">{property.description}</p>
        ) : null}

        <Link
          to="/captacion"
          className="mt-auto inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Solicitar información
        </Link>
      </div>
    </article>
  );
}