import React from 'react';
import { AlertTriangle, BadgeCheck, Clock, Wallet } from 'lucide-react';
import StatCard from '@/components/crm/StatCard';
import { formatCurrency } from '@/lib/crm';

export default function RentSummary({ contracted, totals, activeLeases }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Renta contratada"
        value={formatCurrency(contracted)}
        hint={`${activeLeases} ${activeLeases === 1 ? 'contrato activo' : 'contratos activos'}`}
        icon={Wallet}
        tone="primary"
      />
      <StatCard label="Cobrado" value={formatCurrency(totals.cobrado)} hint="Recibos del periodo" icon={BadgeCheck} tone="emerald" />
      <StatCard label="Pendiente" value={formatCurrency(totals.pendiente)} hint="Aún no vence" icon={Clock} tone="amber" />
      <StatCard label="Vencido" value={formatCurrency(totals.vencido)} hint="Sin cobrar fuera de plazo" icon={AlertTriangle} tone="rose" />
    </div>
  );
}