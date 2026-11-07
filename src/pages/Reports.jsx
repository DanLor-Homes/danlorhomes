import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import StatCard from '@/components/crm/StatCard';
import { Loader2, Percent, Target, Trophy } from 'lucide-react';
import { CHANNELS, CHANNEL_LABELS, STAGES, formatCurrency } from '@/lib/crm';
import MonthlyOutcomeChart from '@/components/reports/MonthlyOutcomeChart';
import ChannelPdfButton from '@/components/reports/ChannelPdfButton';

const tooltipStyle = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 12,
  fontSize: 12,
};

export default function Reports() {
  const [opportunities, setOpportunities] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Opportunity.filter({}, { sort: '-updated_date', limit: 500 }),
      base44.entities.Channel.list(),
    ]).then(([oppRes, channelRes]) => {
      setOpportunities(oppRes.items || []);
      setChannels(Array.isArray(channelRes) ? channelRes : channelRes?.items || []);
      setLoading(false);
    });
  }, []);

  const channelSlugById = useMemo(
    () => channels.reduce((acc, channel) => ({ ...acc, [channel.id]: channel.name }), {}),
    [channels]
  );

  const funnel = useMemo(
    () =>
      STAGES.map((stage) => {
        const list = opportunities.filter((op) => op.stage === stage.id && !op.archived);
        return {
          id: stage.id,
          label: stage.label,
          value: list.reduce((sum, op) => sum + (Number(op.amount) || 0), 0),
          count: list.length,
          color: stage.color,
        };
      }),
    [opportunities]
  );

  const channelData = useMemo(
    () =>
      CHANNELS.map((channel) => {
        const list = opportunities.filter((op) => channelSlugById[op.channel_id] === channel.id);
        const won = list.filter((op) => op.status === 'won');
        return {
          id: channel.id,
          label: channel.label,
          pipeline: list.reduce((sum, op) => sum + (Number(op.amount) || 0), 0),
          ganado: won.reduce((sum, op) => sum + (Number(op.amount) || 0), 0),
          count: list.length,
          wonCount: won.length,
          rate: list.length ? Math.round((won.length / list.length) * 100) : 0,
        };
      }).filter((row) => row.count > 0),
    [opportunities, channelSlugById]
  );

  const channelOpportunities = (slug) => opportunities.filter((op) => channelSlugById[op.channel_id] === slug);

  const totals = useMemo(() => {
    const won = opportunities.filter((op) => op.status === 'won');
    const lost = opportunities.filter((op) => op.status === 'lost');
    const wonValue = won.reduce((sum, op) => sum + (Number(op.amount) || 0), 0);
    return {
      wonValue,
      rate: won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : 0,
      best: channelData.slice().sort((a, b) => b.ganado - a.ganado)[0],
    };
  }, [opportunities, channelData]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Analítica"
        title="Informes"
        description="Rendimiento por canal de captación y conversión a lo largo del embudo."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Importe ganado" value={formatCurrency(totals.wonValue)} icon={Trophy} tone="emerald" />
        <StatCard label="Tasa de cierre" value={`${totals.rate}%`} icon={Percent} tone="primary" />
        <StatCard
          label="Canal más productivo"
          value={totals.best?.label || '—'}
          hint={totals.best ? `${formatCurrency(totals.best.ganado)} ganados` : 'Sin datos aún'}
          icon={Target}
          tone="violet"
        />
      </div>

      <MonthlyOutcomeChart opportunities={opportunities} channelSlugById={channelSlugById} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card-surface p-5">
          <h3 className="font-heading text-sm font-bold">Embudo de ventas</h3>
          <p className="mb-3 text-xs text-muted-foreground">Valor acumulado por etapa</p>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatCurrency(value, true)}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={104}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [formatCurrency(value), 'Valor']}
                  cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {funnel.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card-surface p-5">
          <h3 className="font-heading text-sm font-bold">Rendimiento por canal</h3>
          <p className="mb-3 text-xs text-muted-foreground">Pipeline generado frente a importe ganado</p>
          <div className="h-[340px]">
            {channelData.length === 0 ? (
              <p className="grid h-full place-items-center text-xs text-muted-foreground">
                Aún no hay oportunidades con canal asignado.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={(value) => formatCurrency(value, true)}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(value)} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="pipeline" name="Pipeline" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="ganado" name="Ganado" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <section className="card-surface mt-4 overflow-hidden">
        <div className="border-b border-border/70 px-5 py-3">
          <h3 className="font-heading text-sm font-bold">Conversión por canal</h3>
        </div>
        <div className="hidden grid-cols-[1.4fr_repeat(4,1fr)_auto] gap-4 border-b border-border/70 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
          <span>Canal</span>
          <span>Oportunidades</span>
          <span>Pipeline</span>
          <span>Ganado</span>
          <span>Tasa</span>
          <span className="text-right">Informe</span>
        </div>
        {channelData.length === 0 ? (
          <p className="px-5 py-6 text-xs text-muted-foreground">Sin datos de canal todavía.</p>
        ) : (
          channelData.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-2 gap-2 border-b border-border/50 px-5 py-2.5 text-xs last:border-0 sm:grid-cols-[1.4fr_repeat(4,1fr)_auto] sm:gap-4 sm:items-center"
            >
              <span className="font-medium">{CHANNEL_LABELS[row.id] || row.label}</span>
              <span className="text-muted-foreground">{row.count}</span>
              <span className="text-muted-foreground">{formatCurrency(row.pipeline)}</span>
              <span className="text-muted-foreground">{formatCurrency(row.ganado)}</span>
              <span className="font-semibold text-primary">{row.rate}%</span>
              <ChannelPdfButton channel={row} stats={row} opportunities={channelOpportunities(row.id)} />
            </div>
          ))
        )}
      </section>
    </div>
  );
}