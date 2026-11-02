import React from 'react';
import { Button } from '@/components/ui/button';
import { Building2, CalendarPlus, Pencil, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/crm';
import { TONE_CLASSES, mandateLabel } from '@/lib/mandates';
import { propertyTypeLabel } from '@/lib/properties';

export default function OwnerRow({ property, status, onEdit, onRenew }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3.5 transition-colors hover:border-primary/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="truncate text-sm font-semibold">{property.title}</p>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {property.owner_name || 'Sin propietario asignado'}
            {property.owner_phone ? ` · ${property.owner_phone}` : ''}
            {property.reference ? ` · ${property.reference}` : ''}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {property.zone || 'Sin zona'} · {propertyTypeLabel(property.property_type)} ·{' '}
            {formatCurrency(property.price)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
          <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', TONE_CLASSES[status.tone])}>
            {mandateLabel(status.type)}
          </span>
          <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', TONE_CLASSES[status.tone])}>
            {status.label}
          </span>
          {property.mandate_end && (
            <span className="rounded-full border border-border/70 px-2 py-0.5 text-[11px] text-muted-foreground">
              hasta {formatDate(property.mandate_end)}
            </span>
          )}
          {Number(property.commission_percent) > 0 && (
            <span className="rounded-full border border-border/70 px-2 py-0.5 text-[11px] text-muted-foreground">
              {property.commission_percent} %
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:shrink-0">
          {property.owner_phone && (
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={`tel:${property.owner_phone}`} aria-label="Llamar al propietario">
                <Phone className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRenew?.(property)} aria-label="Renovar 12 meses">
            <CalendarPlus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => onEdit?.(property)}>
            <Pencil className="mr-1 h-3 w-3" /> Mandato
          </Button>
        </div>
      </div>
    </div>
  );
}