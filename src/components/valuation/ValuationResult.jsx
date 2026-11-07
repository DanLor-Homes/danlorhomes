import React from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/crm';

const CONFIDENCE = {
  alta: { label: 'Fiabilidad alta', className: 'bg-primary/15 text-primary' },
  media: { label: 'Fiabilidad media', className: 'bg-accent text-accent-foreground' },
  baja: { label: 'Fiabilidad baja', className: 'bg-muted text-muted-foreground' },
  referencia: { label: 'Referencia de mercado', className: 'bg-muted text-muted-foreground' },
};

export default function ValuationResult({ valuation, saving, onSave, canSave = true }) {
  const { estimate, low, high, pricePerM2, confidence, count, deltaPercent, marketPrice, canValue, surface } = valuation;
  const badge = CONFIDENCE[confidence] || CONFIDENCE.referencia;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Tasación estimada</p>
        {canValue && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>{badge.label}</span>
        )}
      </div>

      {canValue ? (
        <>
          <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
            <p className="font-heading text-3xl font-extrabold tracking-tight">{formatCurrency(estimate)}</p>
            <p className="pb-1 text-xs text-muted-foreground">
              {formatCurrency(low)} – {formatCurrency(high)}
            </p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {surface} m² · {formatCurrency(pricePerM2)}/m² ·{' '}
            {count > 0 ? `${count} comparable${count === 1 ? '' : 's'}` : 'sin comparables, referencia de mercado'}
          </p>

          {deltaPercent !== null && (
            <p className="mt-2 text-xs">
              <span className={`font-semibold ${deltaPercent >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {deltaPercent >= 0 ? '+' : ''}
                {String(deltaPercent).replace('.', ',')}%
              </span>{' '}
              <span className="text-muted-foreground">
                frente a la referencia de la zona ({formatCurrency(marketPrice)}/m²)
              </span>
            </p>
          )}

          {canSave && (
            <Button size="sm" className="mt-3" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Guardar tasación
            </Button>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          {surface
            ? 'Sin comparables ni referencia de zona: añade testigos de mercado o indica el €/m² de referencia.'
            : 'Indica la superficie del inmueble para calcular la tasación.'}
        </p>
      )}
    </div>
  );
}