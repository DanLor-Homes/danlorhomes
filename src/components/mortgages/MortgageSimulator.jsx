import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/crm';
import { simulate } from '@/lib/mortgage';

const FIELDS = [
  { key: 'price', label: 'Precio del inmueble', suffix: '€', step: 5000 },
  { key: 'downPercent', label: 'Entrada', suffix: '%', step: 1 },
  { key: 'years', label: 'Plazo', suffix: 'años', step: 1 },
];

export default function MortgageSimulator({ form, onChange, tin }) {
  const result = simulate({ ...form, tin });

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <h2 className="font-heading text-base font-bold">Datos de la operación</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Se aplican a todas las entidades para comparar la cuota en igualdad de condiciones.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs">{field.label}</Label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                step={field.step}
                value={form[field.key]}
                onChange={(event) => onChange(field.key, event.target.value)}
                className="pr-12"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {field.suffix}
              </span>
            </div>
          </div>
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-4 sm:grid-cols-4">
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Entrada</dt>
          <dd className="font-heading text-sm font-bold">{formatCurrency(result.down)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">A financiar</dt>
          <dd className="font-heading text-sm font-bold">{formatCurrency(result.financed)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Intereses</dt>
          <dd className="font-heading text-sm font-bold">{formatCurrency(result.interest)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Total a pagar</dt>
          <dd className="font-heading text-sm font-bold">{formatCurrency(result.totalPaid)}</dd>
        </div>
      </dl>
    </div>
  );
}