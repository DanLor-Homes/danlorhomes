import React from 'react';
import { ExternalLink, Mail, MessageCircle, Phone, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/crm';
import { LISTING_STATUS, portalLabel } from '@/lib/portals';

export default function ListingCard({ listing, onContact, onConvert, onDiscard }) {
  const status = LISTING_STATUS[listing.status] || LISTING_STATUS.nuevo;
  const meta = [
    listing.zone,
    listing.surface ? `${listing.surface} m²` : '',
    listing.rooms ? `${listing.rooms} hab.` : '',
    listing.published_hint,
  ].filter(Boolean);

  return (
    <article className="card-surface flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            {portalLabel(listing.portal)}
          </span>
          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {listing.operation === 'alquiler' ? 'Alquiler' : 'Venta'}
          </span>
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${status.tone}`}>
            {status.label}
          </span>
        </div>
        <p className="shrink-0 font-heading text-sm font-bold">
          {listing.price ? formatCurrency(listing.price) : '—'}
        </p>
      </div>

      <h3 className="mt-2 font-heading text-sm font-semibold leading-snug">{listing.title}</h3>
      {meta.length > 0 && <p className="mt-1 text-[11px] text-muted-foreground">{meta.join(' · ')}</p>}
      {listing.description && (
        <p className="mt-2 max-h-10 overflow-hidden text-xs text-muted-foreground">{listing.description}</p>
      )}

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

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <Button size="sm" onClick={() => onContact(listing)}>
          <MessageCircle className="h-3.5 w-3.5" /> Contactar
        </Button>
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
    </article>
  );
}