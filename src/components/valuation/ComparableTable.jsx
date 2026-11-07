import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/crm';
import { propertyTypeLabel } from '@/lib/properties';

export default function ComparableTable({ rows, onDelete }) {
  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay comparables en esta zona. Añade testigos de mercado o revisa la ubicación.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border/70 text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <th className="pb-2 pr-3 font-semibold">Inmueble</th>
            <th className="pb-2 pr-3 font-semibold">Zona</th>
            <th className="pb-2 pr-3 font-semibold">Tipo</th>
            <th className="pb-2 pr-3 text-right font-semibold">m²</th>
            <th className="pb-2 pr-3 text-right font-semibold">Precio</th>
            <th className="pb-2 pr-3 text-right font-semibold">€/m²</th>
            <th className="pb-2 pr-3 text-right font-semibold">€/m² homog.</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.origin}-${row.id}`} className="border-b border-border/40 last:border-0">
              <td className="max-w-[240px] py-2 pr-3">
                <div className="flex items-center gap-2">
                  <span className="truncate">{row.title}</span>
                  <span
                    className={`flex-none rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      row.origin === 'cartera' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {row.origin === 'cartera' ? 'Cartera' : 'Testigo'}
                  </span>
                </div>
              </td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">{row.municipality || row.zone || '—'}</td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">{propertyTypeLabel(row.property_type)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{row.surface || '—'}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{formatCurrency(row.price)}</td>
              <td className="py-2 pr-3 text-right font-semibold tabular-nums">{formatCurrency(row.price_m2)}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-primary">{formatCurrency(row.normalized_m2)}</td>
              <td className="py-2 text-right">
                {row.origin === 'testigo' && onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(row.id)}
                    className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="Eliminar testigo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}