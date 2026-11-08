import React from 'react';
import { MessageCircle, Sparkles, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/crm';
import { captureHint } from '@/lib/followUp';
import { LISTING_STATUS, portalLabel } from '@/lib/portals';
import { cn } from '@/lib/utils';

export default function CaptureRow({ listing, onContact, onAnalyze, onConvert, onDiscard }) {
  const hint = captureHint(listing);
  const status = LISTING_STATUS[listing.status] || LISTING_STATUS.nuevo;

  return (
    <article className="card-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
          <span className={cn('rounded-md px-1.5 py-0.5', status.tone)}>{status.label}</span>
          <span className="text-muted-foreground">{portalLabel(listing.portal)}</span>
          <span className="text-muted-foreground">{listing.operation === 'alquiler' ? 'Alquiler' : 'Venta'}</span>
        </div>
        <p className="mt-1 truncate font-heading text-sm font-semibold">{listing.title}</p>
        <p className="text-xs text-muted-foreground">
          {[
            listing.zone,
            listing.price ? formatCurrency(listing.price) : null,
            listing.surface ? `${listing.surface} m²` : null,
            listing.contact_phone || 'Contacto solo en el portal',
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <p className={cn('mt-1.5 text-[11px] font-medium', hint.urgent ? 'text-amber-600 dark:text-amber-300' : 'text-muted-foreground')}>
          {hint.text}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={() => onAnalyze(listing)}>
          <Sparkles className="h-3.5 w-3.5" /> IA
        </Button>
        <Button size="sm" onClick={() => onContact(listing)}>
          <MessageCircle className="h-3.5 w-3.5" /> Contactar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onConvert(listing)}>
          <UserPlus className="h-3.5 w-3.5" /> Cliente
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => onDiscard(listing)}
          aria-label="Descartar anuncio"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
  );
}