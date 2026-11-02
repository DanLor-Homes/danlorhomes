import React from 'react';
import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/crm';
import { mandateLabel } from '@/lib/mandates';

export default function MandateAlertRow({ property }) {
  const expired = property.days < 0;
  const days = Math.abs(property.days);

  return (
    <Link
      to="/propietarios"
      className={cn(
        'flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors',
        expired
          ? 'border-rose-500/25 bg-rose-500/5 hover:border-rose-500/50'
          : 'border-amber-500/25 bg-amber-500/5 hover:border-amber-500/50'
      )}
    >
      <KeyRound className={cn('mt-0.5 h-4 w-4 shrink-0', expired ? 'text-rose-400' : 'text-amber-400')} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{property.title}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {mandateLabel(property.mandato)} {expired ? 'caducado el' : 'caduca el'} {formatDate(property.mandate_end)}
          {expired
            ? ` · hace ${days} ${days === 1 ? 'día' : 'días'}`
            : property.days === 0
              ? ' · hoy'
              : ` · en ${property.days} ${property.days === 1 ? 'día' : 'días'}`}
          {property.owner_name ? ` · ${property.owner_name}` : ''}
        </p>
      </div>
    </Link>
  );
}