import React from 'react';
import { Bath, BedDouble, Building2, ExternalLink, Mail, MapPin, MessageCircle, Phone, Ruler, Sparkles, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { formatCurrency } from '@/lib/crm';
import { LISTING_STATUS, portalLabel, propertyTypeLabel } from '@/lib/portals';

export default function ListingCard({ listing, publisherHint, onContact, onConvert, onDiscard, onAnalyze }) {
  const status = LISTING_STATUS[listing.status] || LISTING_STATUS.nuevo;
  const summary = [
    { icon: Ruler, value: listing.surface ? `${listing.surface} m²` : null },
    { icon: BedDouble, value: listing.rooms ? `${listing.rooms} hab.` : null },
    { icon: Bath, value: listing.bathrooms ? `${listing.bathrooms} baños` : null },
    { icon: MapPin, value: listing.zone || null },
  ].filter((item) => item.value);

  return (
    <article className="card-surface flex flex-col overflow-hidden">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {listing.image_url ? (
          <Image
            src={listing.image_url}
            alt={listing.title}
            className="h-full w-full object-cover"
            fittingType="fill"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <Building2 className="h-6 w-6" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Sin foto</span>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
          {portalLabel(listing.portal)}
        </span>
        <span className={`absolute right-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur ${status.tone}`}>
          {status.label}
        </span>
        {listing.photo_generated && (
          <span className="absolute bottom-2 left-2 rounded-md bg-background/85 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
            Imagen orientativa
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {listing.operation === 'alquiler' ? 'Alquiler' : 'Venta'}
          </span>
          <span className="rounded-md border border-border/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {propertyTypeLabel(listing.property_type)}
          </span>
          {listing.publisher_type && listing.publisher_type !== 'desconocido' && (
            <span className="rounded-md border border-border/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {listing.publisher_type === 'inmobiliaria' ? 'Inmobiliaria' : 'Particular'}
            </span>
          )}
          {listing.published_hint && (
            <span className="text-[10px] text-muted-foreground">{listing.published_hint}</span>
          )}
        </div>

        <div className="mt-2 flex items-start justify-between gap-3">
          <h3 className="min-w-0 font-heading text-sm font-semibold leading-snug">{listing.title}</h3>
          <p className="shrink-0 font-heading text-sm font-bold">
            {listing.price ? formatCurrency(listing.price) : '—'}
          </p>
        </div>

        {summary.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
            {summary.map(({ icon: Icon, value }) => (
              <span key={value} className="inline-flex min-w-0 items-center gap-1">
                <Icon className="h-3 w-3 shrink-0" />
                <span className="truncate">{value}</span>
              </span>
            ))}
          </div>
        )}

        {listing.description && (
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{listing.description}</p>
        )}
        {publisherHint && <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-primary">{publisherHint}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {listing.contact_name && <span className="truncate">{listing.contact_name}</span>}
          {listing.contact_phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {listing.contact_phone}
            </span>
          )}
          {listing.contact_email && (
            <span className="inline-flex items-center gap-1 truncate">
              <Mail className="h-3 w-3" />
              {listing.contact_email}
            </span>
          )}
          {!listing.contact_phone && !listing.contact_email && <span>Contacto solo en el portal</span>}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
          <Button size="sm" onClick={() => onContact(listing)}>
            <MessageCircle className="h-3.5 w-3.5" /> Contactar
          </Button>
          {onAnalyze && (
            <Button size="sm" variant="outline" onClick={() => onAnalyze(listing)}>
              <Sparkles className="h-3.5 w-3.5" /> IA
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onConvert(listing)}>
            <UserPlus className="h-3.5 w-3.5" /> Cliente
          </Button>
          {listing.url && (
            <Button size="sm" variant="ghost" asChild>
              <a href={listing.url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> Ver
              </a>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-muted-foreground"
            onClick={() => onDiscard(listing)}
            aria-label="Descartar anuncio"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}