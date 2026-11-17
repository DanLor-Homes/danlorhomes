import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CLIENT_TYPES, clientTypeOf } from '@/lib/clientType';
import { formatCurrency } from '@/lib/crm';
import {
  AXIS_TICK,
  CURSOR_FILL,
  GRID_STROKE,
  SERIES_COLORS,
  TOOLTIP_STYLE,
  TOOLTIP_ITEM_STYLE,
  TOOLTIP_LABEL_STYLE,
} from '@/lib/chartTheme';

const MONTHS_BACK = 12;

const colorOf = (id) => SERIES_COLORS[id] || '#9aa3a0';

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
    <section className="card-surface mt-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h3 className="font-heading text-[15px] font-semibold tracking-tight">Evolución de las ventas por tipo de cliente</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Importe cerrado en los últimos 12 meses</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em]">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary ring-1 ring-primary/15">
            {formatCurrency(grandTotal, true)} vendido
          </span>
          <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{salesCount} ventas</span>
          <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
            Ticket medio {formatCurrency(ticket, true)}
          </span>
        </div>
      </div>

      <div className="mt-3 h-[300px]">
        {grandTotal > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 4 }} barGap={2}>
              <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="2 6" />
              <XAxis
                dataKey="month"
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                interval={0}
                tickMargin={8}
              />
              <YAxis
                tickFormatter={compactEuro}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                cursor={CURSOR_FILL}
                formatter={(value, name) => [formatCurrency(value), name]}
              />
              {CLIENT_TYPES.map((type) => (
                <Bar
                  key={type.id}
                  dataKey={type.id}
                  name={type.label}
                  stackId="ventas"
                  fill={colorOf(type.id)}
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
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorOf(type.id) }} />
            {type.label}
            <span className="font-semibold text-foreground">{formatCurrency(totals[type.id].value, true)}</span>
            <span>· {totals[type.id].count}</span>
          </span>
        ))}
      </div>
    </section>
  );
}