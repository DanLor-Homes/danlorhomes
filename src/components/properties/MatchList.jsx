import React from 'react';
import { Home } from 'lucide-react';
import { formatCurrency } from '@/lib/crm';
import { findMatches } from '@/lib/properties';
import { cn } from '@/lib/utils';

export default function MatchList({ property, clients, onOpenClient }) {
  const matches = findMatches(property, clients);

  if (matches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/70 px-3 py-4 text-xs text-muted-foreground">
        Ningún demandante de la cartera encaja todavía. Define presupuesto, zona y tipo de inmueble en la ficha del
        cliente para activar el cruce automático.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {matches.slice(0, 8).map(({ client, score, reasons }) => (
        <button
          key={client.id}
          type="button"
          onClick={() => onOpenClient?.(client)}
          className="flex w-full items-start gap-2.5 rounded-xl border border-border/70 bg-card px-3 py-2 text-left transition-colors hover:border-primary/40"
        >
          <span
            className={cn(
              'grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold',
              score >= 80 ? 'bg-chart-2/15 text-chart-2' : 'bg-primary/12 text-primary'
            )}
          >
            {score}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{client.name}</span>
              {client.budget_max ? (
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  hasta {formatCurrency(client.budget_max)}
                </span>
              ) : null}
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
              {reasons.join(' · ')}
            </span>
          </span>
          <Home className="mt-1.5 h-3 w-3 shrink-0 text-muted-foreground" />
        </button>
      ))}
      {matches.length > 8 && (
        <p className="pl-1 text-[11px] text-muted-foreground">y {matches.length - 8} demandantes más</p>
      )}
    </div>
  );
}