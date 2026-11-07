import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CLIENT_TYPES, clientTypeOf } from '@/lib/clientType';
import { formatCurrency } from '@/lib/crm';

const MONTHS_BACK = 12;

const tooltipStyle = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 12,
  fontSize: 12,
};

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const compactEuro = (value) =>
  value >= 1000 ? `${Math.round(value / 1000)}k €` : new Intl.NumberFormat('es-ES').format(value);

export default function SalesByClientTypeChart({ opportunities = [], clients = [] }) {
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: MONTHS_BACK }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (MONTHS_BACK - 1 - i), 1);
      return {
        key: monthKey(date),
        label: new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' })
          .format(date)
          .replace('.', ''),
      };
    });
  }, []);

  const typeByClientId = useMemo(
    () => clients.reduce((acc, client) => ({ ...acc, [client.id]: clientTypeOf(client) }), {}),
    [clients]
  );

  const { data, totals } = useMemo(() => {
    const rows = months.map((month) => {
      const row = { month: month.label };
      CLIENT_TYPES.forEach((type) => {
        row[type.id] = 0;
      });
      return row;
    });
    const index = months.reduce((acc, month, i) => ({ ...acc, [month.key]: rows[i] }), {});
    const sums = CLIENT_TYPES.reduce((acc, type) => ({ ...acc, [type.id]: { value: 0, count: 0 } }), {});

    opportunities.forEach((op) => {
      const date = new Date(op.stage_changed_date || op.updated_date || op.created_date);
      if (Number.isNaN(date.getTime())) return;
      const row = index[monthKey(date)];
      if (!row) return;
      const type = typeByClientId[op.client_id] || 'sin_ficha';
      const amount = Number(op.amount) || 0;
      row[type] += amount;
      sums[type].value += amount;
      sums[type].count += 1;
    });

    return { data: rows, totals: sums };
  }, [months, opportunities, typeByClientId]);

  const grandTotal = CLIENT_TYPES.reduce((sum, type) => sum + totals[type.id].value, 0);
  const salesCount = CLIENT_TYPES.reduce((sum, type) => sum + totals[type.id].count, 0);
  const ticket = salesCount ? grandTotal / salesCount : 0;

  return (
    <section className="card-surface mt-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-sm font-bold">Evolución de las ventas por tipo de cliente</h3>
          <p className="text-xs text-muted-foreground">Importe cerrado en los últimos 12 meses</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-lg bg-primary/10 px-2 py-1 font-semibold text-primary">
            {formatCurrency(grandTotal, true)} vendido
          </span>
          <span className="rounded-lg bg-muted px-2 py-1 font-semibold text-muted-foreground">{salesCount} ventas</span>
          <span className="rounded-lg bg-muted px-2 py-1 font-semibold text-muted-foreground">
            Ticket medio {formatCurrency(ticket, true)}
          </span>
        </div>
      </div>

      <div className="mt-3 h-[300px]">
        {grandTotal > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 4 }} barGap={2}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tickFormatter={compactEuro}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                formatter={(value, name) => [formatCurrency(value), name]}
              />
              {CLIENT_TYPES.map((type) => (
                <Bar
                  key={type.id}
                  dataKey={type.id}
                  name={type.label}
                  stackId="ventas"
                  fill={type.color}
                  maxBarSize={30}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="grid h-full place-items-center text-xs text-muted-foreground">
            Todavía no hay ventas cerradas en los últimos 12 meses.
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        {CLIENT_TYPES.map((type) => (
          <span key={type.id} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: type.color }} />
            {type.label}
            <span className="font-semibold text-foreground">{formatCurrency(totals[type.id].value, true)}</span>
            <span>· {totals[type.id].count}</span>
          </span>
        ))}
      </div>
    </section>
  );
}