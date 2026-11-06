import React, { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/crm';

const DEFAULTS = { price: 250000, down: 20, years: 30, rate: 3.1 };

export default function MortgageCalculator() {
  const [form, setForm] = useState(DEFAULTS);

  const result = useMemo(() => {
    const price = Number(form.price) || 0;
    const downPercent = Math.min(Math.max(Number(form.down) || 0, 0), 100);
    const years = Math.max(Number(form.years) || 1, 1);
    const rate = Math.max(Number(form.rate) || 0, 0);

    const downPayment = (price * downPercent) / 100;
    const financed = Math.max(price - downPayment, 0);
    const monthlyRate = rate / 100 / 12;
    const payments = years * 12;

    const quota =
      financed && monthlyRate
        ? (financed * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -payments))
        : financed / payments || 0;

    return {
      downPayment,
      financed,
      quota: Math.round(quota),
      total: Math.round(quota * payments),
      interest: Math.round(quota * payments - financed),
    };
  }, [form]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const FIELDS = [
    { key: 'price', label: 'Precio del inmueble', suffix: '€', step: 5000 },
    { key: 'down', label: 'Entrada aportada', suffix: '%', step: 1 },
    { key: 'years', label: 'Plazo', suffix: 'años', step: 1 },
    { key: 'rate', label: 'Tipo de interés', suffix: '%', step: 0.1 },
  ];

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <Calculator className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-bold leading-tight">Calculadora de hipoteca</h2>
          <p className="text-xs text-muted-foreground">Estima tu cuota mensual en segundos.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={`mortgage-${field.key}`}>{field.label}</Label>
            <div className="relative">
              <Input
                id={`mortgage-${field.key}`}
                type="number"
                min="0"
                step={field.step}
                value={form[field.key]}
                onChange={(event) => set(field.key, event.target.value)}
                className="pr-12"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                {field.suffix}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-primary/10 p-4">
          <p className="text-[11px] uppercase tracking-wider text-primary">Cuota mensual estimada</p>
          <p className="mt-1 font-heading text-2xl font-extrabold leading-none">{formatCurrency(result.quota)}</p>
        </div>
        <div className="space-y-1.5 rounded-xl border border-border/70 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Importe financiado</span>
            <span className="font-medium">{formatCurrency(result.financed)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Entrada</span>
            <span className="font-medium">{formatCurrency(result.downPayment)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Intereses totales</span>
            <span className="font-medium">{formatCurrency(result.interest)}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Cálculo orientativo con sistema de amortización francés. No incluye seguros, gastos de apertura ni impuestos.
        Sujeta a la aprobación de la entidad financiera.
      </p>
    </div>
  );
}