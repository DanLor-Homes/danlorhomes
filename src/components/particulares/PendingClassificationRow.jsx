import React from 'react';
import { Building2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/crm';
import { portalLabel } from '@/lib/portals';

export default function PendingClassificationRow({ listing, evidence, onClassify }) {
  const meta = [portalLabel(listing.portal), listing.operation === 'alquiler' ? 'Alquiler' : 'Venta', listing.zone]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{listing.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {meta}
          {listing.price ? ` · ${formatCurrency(listing.price)}` : ''}
          {evidence ? ` · ${evidence}` : ''}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={() => onClassify(listing, 'particular')}>
          <UserRound className="h-3.5 w-3.5" /> Particular
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onClassify(listing, 'inmobiliaria')}>
          <Building2 className="h-3.5 w-3.5" /> Inmobiliaria
        </Button>
      </div>
    </div>
  );
}