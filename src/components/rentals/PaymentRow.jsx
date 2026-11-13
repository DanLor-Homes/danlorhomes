import React from 'react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/crm';
import { PAYMENT_STATUSES, methodLabel, statusMeta } from '@/lib/rents';
import { cn } from '@/lib/utils';

export default function PaymentRow({ payment, onEdit }) {
  const status = statusMeta(PAYMENT_STATUSES, payment.effective);
  const collected = payment.status === 'cobrado';

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-heading text-sm font-semibold">{payment.tenant_name || 'Inquilino'}</p>
          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', status.className)}>{status.label}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {payment.property_title || 'Sin inmueble'} · vence {formatDate(payment.due_date)}
          {collected && payment.paid_date ? ` · cobrado el ${formatDate(payment.paid_date)}` : ''}
          {collected && payment.method ? ` · ${methodLabel(payment.method)}` : ''}
        </p>
      </div>
      <div className="text-right">
        <p className="font-heading text-sm font-bold tabular-nums">{formatCurrency(payment.amount)}</p>
        {collected && Number(payment.paid_amount) && Number(payment.paid_amount) !== Number(payment.amount) && (
          <p className="text-[11px] text-muted-foreground tabular-nums">cobrado {formatCurrency(payment.paid_amount)}</p>
        )}
      </div>
      <Button size="sm" variant={collected ? 'ghost' : 'outline'} onClick={() => onEdit(payment)}>
        {collected ? 'Detalle' : 'Cobrar'}
      </Button>
    </div>
  );
}