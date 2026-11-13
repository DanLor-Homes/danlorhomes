import React from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, daysUntil } from '@/lib/crm';
import { LEASE_STATUSES, statusMeta } from '@/lib/rents';
import { cn } from '@/lib/utils';

export default function LeaseRow({ lease, onEdit }) {
  const status = statusMeta(LEASE_STATUSES, lease.status);
  const reviewIn = daysUntil(lease.next_review_date);
  const reviewSoon = reviewIn !== null && reviewIn <= 45;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-heading text-sm font-semibold">{lease.tenant_name || 'Inquilino'}</p>
          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', status.className)}>{status.label}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {lease.property_title || 'Sin inmueble'} · día de cobro {lease.payment_day || 1} ·{' '}
          {formatDate(lease.start_date)} → {lease.end_date ? formatDate(lease.end_date) : 'sin fecha de fin'}
        </p>
        {reviewSoon && (
          <p className="mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            Revisión de renta {reviewIn < 0 ? 'vencida' : `en ${reviewIn} días`} ({formatDate(lease.next_review_date)})
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="font-heading text-sm font-bold tabular-nums">{formatCurrency(lease.monthly_rent)}</p>
        <p className="text-[11px] text-muted-foreground">al mes</p>
      </div>
      <Button size="sm" variant="ghost" onClick={() => onEdit(lease)}>
        <Pencil className="h-3.5 w-3.5" /> Editar
      </Button>
    </div>
  );
}