import React from 'react';
import { formatCurrency } from '@/lib/crm';

const TONES = {
  own: 'border-primary/30 bg-primary/5',
  reference: 'border-border bg-muted/40',
};

export default function ZoneStatsCard({ label, zone, stats, note, tone = 'own' }) {
  return (
    <div className={`rounded-2xl border p-4 ${TONES[tone] || TONES.reference}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate font-heading text-base font-bold">{zone || 'Sin zona'}</p>

      {stats ? (
        <>
          <p className="mt-3 font-heading text-2xl font-extrabold tracking-tight">
            {formatCurrency(stats.median)}
            <span className="ml-1 text-xs font-medium text-muted-foreground">/m²</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.count} comparables · {formatCurrency(stats.min)} – {formatCurrency(stats.max)}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Sin comparables suficientes en esta zona.</p>
      )}

      {note && <p className="mt-2 text-[11px] italic text-muted-foreground">{note}</p>}
    </div>
  );
}