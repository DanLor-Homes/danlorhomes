import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHANNELS } from '@/lib/crm';
import {
  AXIS_TICK,
  CURSOR_FILL,
  GRID_STROKE,
  SERIES_ACCENTS,
  TOOLTIP_STYLE,
  TOOLTIP_ITEM_STYLE,
  TOOLTIP_LABEL_STYLE,
} from '@/lib/chartTheme';

const MONTHS_BACK = 12;

const SERIES = [
  ...CHANNELS.map((channel, index) => ({
    id: channel.id,
    label: channel.label,
    color: SERIES_ACCENTS[index % SERIES_ACCENTS.length],
  })),
  { id: 'sin_origen', label: 'Sin origen', color: '#b3b1a9' },
];

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function MonthlyOutcomeChart({ opportunities, channelSlugById }) {
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

  const data = useMemo(() => {
    const rows = months.map((month) => ({ month: month.label }));
    const index = {};
    months.forEach((month, i) => {
      index[month.key] = rows[i];
      SERIES.forEach((serie) => {
        rows[i][`won_${serie.id}`] = 0;
        rows[i][`lost_${serie.id}`] = 0;
      });
    });

    const knownChannels = new Set(SERIES.map((serie) => serie.id));

    opportunities
      .filter((op) => op.status === 'won' || op.status === 'lost')
      .forEach((op) => {
        const date = new Date(op.stage_changed_date || op.updated_date || op.created_date);
        if (Number.isNaN(date.getTime())) return;
        const row = index[monthKey(date)];
        if (!row) return;
        const slug = channelSlugById[op.channel_id];
        const channelId = knownChannels.has(slug) ? slug : 'sin_origen';
        row[`${op.status}_${channelId}`] += 1;
      });

    return rows;
  }, [months, opportunities, channelSlugById]);

  const totals = useMemo(
    () =>
      data.reduce(
        (acc, row) => {
          SERIES.forEach((serie) => {
            acc.won += row[`won_${serie.id}`];
            acc.lost += row[`lost_${serie.id}`];
          });
          return acc;
        },
        { won: 0, lost: 0 }
      ),
    [data]
  );

  const hasData = totals.won + totals.lost > 0;
  const rate = totals.won + totals.lost ? Math.round((totals.won / (totals.won + totals.lost)) * 100) : 0;
  const activeChannels = SERIES.filter((serie) =>
    data.some((row) => row[`won_${serie.id}`] + row[`lost_${serie.id}`] > 0)
  );

  return (
    <section className="card-surface mt-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h3 className="font-heading text-[15px] font-semibold tracking-tight">Ganadas y perdidas por mes</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Últimos 12 meses, segmentadas por origen del contacto</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em]">
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400">
            {totals.won} ganadas
          </span>
          <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-400">
            {totals.lost} perdidas
          </span>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary ring-1 ring-primary/15">{rate}% de cierre</span>
        </div>
      </div>

      <div className="mt-3 h-[340px]">
        {hasData ? (
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
                allowDecimals={false}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                cursor={CURSOR_FILL}
              />
              {SERIES.map((serie) => (
                <Bar
                  key={`won_${serie.id}`}
                  dataKey={`won_${serie.id}`}
                  name={`${serie.label} · ganadas`}
                  stackId="won"
                  fill={serie.color}
                  maxBarSize={22}
                />
              ))}
              {SERIES.map((serie) => (
                <Bar
                  key={`lost_${serie.id}`}
                  dataKey={`lost_${serie.id}`}
                  name={`${serie.label} · perdidas`}
                  stackId="lost"
                  fill={serie.color}
                  fillOpacity={0.35}
                  maxBarSize={22}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="grid h-full place-items-center text-xs text-muted-foreground">
            Todavía no hay oportunidades ganadas ni perdidas en los últimos 12 meses.
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-foreground/70" /> Ganadas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-foreground/25" /> Perdidas
        </span>
        <span className="h-3 w-px bg-border" />
        {activeChannels.map((serie) => (
          <span key={serie.id} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: serie.color }} />
            {serie.label}
          </span>
        ))}
      </div>
    </section>
  );
}