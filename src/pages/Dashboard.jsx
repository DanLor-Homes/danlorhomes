import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Coins,
  ListChecks,
  Percent,
  Target,
  TrendingUp,
  CalendarClock,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import StatCard from '@/components/crm/StatCard';
import { Button } from '@/components/ui/button';
import {
  OPEN_STAGES,
  WON_STAGES,
  LOST_STAGES,
  daysSince,
  daysUntil,
  formatCurrency,
  formatDate,
  todayISO,
} from '@/lib/crm';

export default function Dashboard() {
  const [opportunities, setOpportunities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [oppRes, taskRes] = await Promise.all([
      base44.entities.Opportunity.filter({ archived: false }, { sort: '-updated_date', limit: 500 }),
      base44.entities.CommercialTask.filter({}, { sort: 'due_date', limit: 500 }),
    ]);
    setOpportunities(oppRes.items || []);
    setTasks(taskRes.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await base44.functions.invoke('crmAutomations', {});
      } catch (error) {
        // Las automatizaciones se reintentan en el siguiente acceso
      }
      if (active) await load();
    })();
    return () => {
      active = false;
    };
  }, [load]);

  const metrics = useMemo(() => {
    const open = opportunities.filter((o) => o.status === 'open');
    const won = opportunities.filter((o) => o.status === 'won');
    const lost = opportunities.filter((o) => o.status === 'lost');
    const pipelineValue = open.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const wonValue = won.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const ticket = won.length ? wonValue / won.length : 0;
    const closeRate = won.length + lost.length ? (won.length / (won.length + lost.length)) * 100 : 0;
    const today = todayISO();
    const pendingToday = tasks.filter((t) => t.status === 'pendiente' && t.due_date && t.due_date <= today);
    const byStage = OPEN_STAGES.map((stage) => {
      const list = open.filter((o) => o.stage === stage.id);
      return {
        ...stage,
        count: list.length,
        value: list.reduce((sum, o) => sum + (Number(o.amount) || 0), 0),
      };
    });
    return { open, won, lost, pipelineValue, wonValue, ticket, closeRate, pendingToday, byStage };
  }, [opportunities, tasks]);

  const alerts = useMemo(() => {
    const staleQuotes = opportunities
      .filter((o) => o.status === 'open' && o.stage === 'presupuesto_enviado')
      .map((o) => ({ ...o, days: daysSince(o.stage_changed_date) ?? 0 }))
      .filter((o) => o.days >= 5);

    const risky = opportunities
      .filter((o) => o.status === 'open' && o.expected_closing_date)
      .map((o) => ({ ...o, remaining: daysUntil(o.expected_closing_date) }))
      .filter((o) => o.remaining !== null && o.remaining >= 0 && o.remaining < 3);

    const overdue = tasks.filter((t) => t.status === 'pendiente' && t.due_date && t.due_date < todayISO());

    return { staleQuotes, risky, overdue };
  }, [opportunities, tasks]);

  const maxStageValue = Math.max(...metrics.byStage.map((s) => s.value), 1);
  const upcomingTasks = tasks
    .filter((t) => t.status === 'pendiente')
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
    .slice(0, 6);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Resumen comercial"
        title="Dashboard"
        description="Estado del embudo, rendimiento del equipo y avisos automáticos de seguimiento."
      >
        <Button asChild variant="outline">
          <Link to="/pipeline">
            Ver pipeline <ArrowUpRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Pipeline abierto"
          value={formatCurrency(metrics.pipelineValue)}
          hint={`${metrics.open.length} oportunidades abiertas`}
          icon={Target}
        />
        <StatCard
          label="Etapas activas"
          value={metrics.byStage.filter((s) => s.count > 0).length}
          hint={`de ${OPEN_STAGES.length} etapas del embudo`}
          icon={TrendingUp}
          tone="violet"
        />
        <StatCard
          label="Tasa de cierre"
          value={`${metrics.closeRate.toFixed(0)}%`}
          hint={`${metrics.won.length} ganadas · ${metrics.lost.length} perdidas`}
          icon={Percent}
          tone="emerald"
        />
        <StatCard
          label="Ticket medio"
          value={formatCurrency(metrics.ticket)}
          hint={`${formatCurrency(metrics.wonValue)} ganado`}
          icon={Coins}
          tone="amber"
        />
        <StatCard
          label="Tareas para hoy"
          value={metrics.pendingToday.length}
          hint={alerts.overdue.length ? `${alerts.overdue.length} vencidas` : 'Sin tareas vencidas'}
          icon={ListChecks}
          tone={alerts.overdue.length ? 'rose' : 'primary'}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="card-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-sm font-bold">Oportunidades por etapa</h3>
                <p className="text-xs text-muted-foreground">Valor estimado acumulado en cada fase</p>
              </div>
              <Link to="/informes" className="text-xs font-medium text-primary hover:underline">
                Informes
              </Link>
            </div>
            <div className="space-y-3">
              {metrics.byStage.map((stage) => (
                <div key={stage.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
                    <span className="font-medium text-foreground/90">{stage.label}</span>
                    <span className="text-muted-foreground">
                      {stage.count} · {formatCurrency(stage.value)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(stage.value ? 4 : 0, (stage.value / maxStageValue) * 100)}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card-surface p-5">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="font-heading text-sm font-bold">Avisos automáticos</h3>
            </div>
            {alerts.staleQuotes.length + alerts.risky.length + alerts.overdue.length === 0 ? (
              <p className="rounded-xl border border-border/60 bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
                Todo al día: sin presupuestos sin respuesta, cierres inminentes ni tareas vencidas.
              </p>
            ) : (
              <div className="space-y-2">
                {alerts.staleQuotes.map((op) => (
                  <div key={`quote-${op.id}`} className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{op.name}</p>
                      <p className="text-[11px] text-muted-foreground">Presupuesto enviado sin respuesta hace {op.days} días</p>
                    </div>
                  </div>
                ))}
                {alerts.risky.map((op) => (
                  <div key={`risk-${op.id}`} className="flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/5 px-3 py-2.5">
                    <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{op.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Cierre previsto {formatDate(op.expected_closing_date)} · quedan {op.remaining} días
                      </p>
                    </div>
                  </div>
                ))}
                {alerts.overdue.map((task) => (
                  <div key={`task-${task.id}`} className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
                    <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <p className="text-[11px] text-muted-foreground">Vencida el {formatDate(task.due_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="card-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold">Próximas tareas</h3>
            <Link to="/tareas" className="text-xs font-medium text-primary hover:underline">
              Todas
            </Link>
          </div>
          {upcomingTasks.length === 0 ? (
            <p className="rounded-xl border border-border/60 bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
              Sin tareas pendientes.
            </p>
          ) : (
            <ul className="space-y-3">
              {upcomingTasks.map((task) => {
                const overdue = task.due_date < todayISO();
                return (
                  <li key={task.id} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium leading-snug">{task.title}</p>
                    <p className={`mt-0.5 text-[11px] ${overdue ? 'text-rose-400' : 'text-muted-foreground'}`}>
                      {overdue ? 'Vencida · ' : ''}
                      {formatDate(task.due_date)}
                      {task.assignee ? ` · ${task.assignee}` : ''}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}