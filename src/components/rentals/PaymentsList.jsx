import React, { useMemo, useState } from 'react';
import { ReceiptText } from 'lucide-react';
import EmptyState from '@/components/crm/EmptyState';
import PaymentRow from '@/components/rentals/PaymentRow';
import { effectiveStatus } from '@/lib/rents';
import { cn } from '@/lib/utils';

const FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'vencido', label: 'Vencidos' },
  { id: 'cobrado', label: 'Cobrados' },
];

export default function PaymentsList({ payments, onEdit, monthName }) {
  const [filter, setFilter] = useState('todos');

  const rows = useMemo(
    () => payments.map((payment) => ({ ...payment, effective: effectiveStatus(payment) })),
    [payments]
  );

  const counts = useMemo(
    () =>
      FILTERS.reduce((acc, item) => {
        acc[item.id] = item.id === 'todos' ? rows.length : rows.filter((row) => row.effective === item.id).length;
        return acc;
      }, {})
    ,
    [rows]
  );

  const visible = filter === 'todos' ? rows : rows.filter((row) => row.effective === filter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
              filter === item.id
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border/70 text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label} <span className="tabular-nums opacity-70">{counts[item.id] || 0}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={rows.length ? 'Ningún recibo en este filtro' : `Sin recibos en ${monthName}`}
          description={
            rows.length
              ? 'Cambia el filtro para ver el resto de recibos del periodo.'
              : 'Genera los recibos del mes para pasar a cobro las rentas de los contratos activos.'
          }
        />
      ) : (
        <div className="space-y-2">
          {visible.map((payment) => (
            <PaymentRow key={payment.id} payment={payment} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}