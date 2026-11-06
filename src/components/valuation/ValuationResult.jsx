import React from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/crm';
import ZoneStatsCard from './ZoneStatsCard';

export default function ValuationResult({ subject, valuation, referenceZone, hasReference, saving, onSave }) {
  const { ownStats, refStats, estimate, low, high, pricePerM2, deltaPercent, basis } = valuation;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <ZoneStatsCard label="Zona propia" zone={subject.zone} stats={ownStats} tone="own" />
        <ZoneStatsCard
          label="Zona de referencia"
          zone={hasReference ? referenceZone : 'Sin definir'}
          stats={hasReference ? refStats : null}
          note={!hasReference ? 'Elige una zona de referencia para comparar.' : undefined}
          tone="reference"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        {estimate ? (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Tasación estimada</p>
            <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
              <p className="font-heading text-3xl font-extrabold tracking-tight">{formatCurrency(estimate)}</p>
              <p className="pb-1 text-xs text-muted-foreground">
                {formatCurrency(low)} – {formatCurrency(high)}
              </p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {subject.surface} m² · {formatCurrency(pricePerM2)}/m² ·{' '}
              {basis === 'own' ? 'comparables de la zona propia' : 'comparables de la zona de referencia'}
            </p>

            {deltaPercent !== null && (
              <p className="mt-2 text-xs">
                <span className={`font-semibold ${deltaPercent >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {deltaPercent >= 0 ? '+' : ''}
                  {deltaPercent}%
                </span>{' '}
                <span className="text-muted-foreground">en €/m² frente a {referenceZone}</span>
              </p>
            )}

            <Button size="sm" className="mt-3" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Guardar tasación
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Registra la superficie del inmueble y al menos dos comparables con precio para calcular la tasación.
          </p>
        )}
      </div>
    </div>
  );
}