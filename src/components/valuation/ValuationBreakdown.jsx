import React from 'react';
import { formatCurrency } from '@/lib/crm';

const scopeLabel = {
  municipio: 'mismo municipio',
  provincia: 'misma provincia',
  zona: 'misma zona',
  mercado: 'referencia de mercado',
};

export default function ValuationBreakdown({ valuation }) {
  const { basis, basisSource, count, scope, factorRows, factor, surface, estimate, marketEstimate, marketPrice, operation } =
    valuation;
  const rent = operation === 'alquiler';
  const unit = rent ? '/m²·mes' : '/m²';

  if (!basis) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Cómo se calcula</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Indica la superficie y al menos un comparable (o el €/m² de la zona) para ver el desglose del cálculo.
        </p>
      </div>
    );
  }

  const visibleRows = factorRows.filter((row) => Math.abs(row.factor - 1) > 0.001);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Cómo se calcula</p>

      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">
            €/m² base ·{' '}
            {basisSource === 'comparables' ? `${count} comparables, ${scopeLabel[scope] || scope}` : 'referencia de mercado'}
          </dt>
          <dd className="font-semibold tabular-nums">
            {formatCurrency(basis)}
            {unit}
          </dd>
        </div>
        {visibleRows.map((row) => (
          <div key={row.key} className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="tabular-nums">
              ×{row.factor.toFixed(2).replace('.', ',')}
            </dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-1.5">
          <dt className="text-muted-foreground">Coeficiente total</dt>
          <dd className="font-semibold tabular-nums">×{factor.toFixed(2).replace('.', ',')}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Superficie</dt>
          <dd className="tabular-nums">{surface} m²</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-1.5">
          <dt className="font-semibold">Valor estimado</dt>
          <dd className="font-heading text-sm font-extrabold tabular-nums">{formatCurrency(estimate)}</dd>
        </div>
      </dl>

      {marketPrice && marketEstimate && (
        <p className="mt-3 border-t border-border/60 pt-2 text-[11px] leading-relaxed text-muted-foreground">
          Referencia de mercado de la zona: {formatCurrency(marketPrice)}
          {unit}, equivalente a {formatCurrency(marketEstimate)}
          {rent ? '/mes' : ''} para este inmueble.
        </p>
      )}
    </div>
  );
}