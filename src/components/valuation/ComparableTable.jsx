import React from 'react';
import { formatCurrency } from '@/lib/crm';
import { propertyTypeLabel } from '@/lib/properties';

export default function ComparableTable({ rows }) {
  if (!rows.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No hay comparables con precio y superficie registrados.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-sm">
        <thead>
          <tr className="border-b border-border/70 text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <th className="pb-2 pr-3 font-semibold">Inmueble</th>
            <th className="pb-2 pr-3 font-semibold">Zona</th>
            <th className="pb-2 pr-3 font-semibold">Tipo</th>
            <th className="pb-2 pr-3 text-right font-semibold">m²</th>
            <th className="pb-2 pr-3 text-right font-semibold">Precio</th>
            <th className="pb-2 text-right font-semibold">€/m²</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.id}-${row.scope}`} className="border-b border-border/40 last:border-0">
              <td className="max-w-[220px] truncate py-2 pr-3">{row.title}</td>
              <td className="py-2 pr-3">
                <span className="truncate text-xs text-muted-foreground">{row.zone}</span>
                <span
                  className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                    row.scope === 'Propia' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {row.scope}
                </span>
              </td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">{propertyTypeLabel(row.property_type)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{row.surface || '—'}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{formatCurrency(row.price)}</td>
              <td className="py-2 text-right font-semibold tabular-nums">{formatCurrency(row.price_m2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}