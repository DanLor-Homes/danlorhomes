import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { OPEN_STAGES, daysSince, daysUntil, formatCurrency, todayISO } from '@/lib/crm';
import { mandateStatus, mandateTypeOf } from '@/lib/mandates';
import MandatesSummary from '@/components/owners/MandatesSummary';
import HotStaleLeads from '@/components/leads/HotStaleLeads';
import QuickRepliesCard from '@/components/dashboard/QuickRepliesCard';
import AutomationSwitches from '@/components/dashboard/AutomationSwitches';
import { scoreLead } from '@/lib/leadScoring';
import EditorialHero from '@/components/dashboard/editorial/EditorialHero';
import MetricsStrip from '@/components/dashboard/editorial/MetricsStrip';
import StageList from '@/components/dashboard/editorial/StageList';
import AlertsBriefing from '@/components/dashboard/editorial/AlertsBriefing';
import UpcomingTasks from '@/components/dashboard/editorial/UpcomingTasks';

const MANDATE_ALERT_LIMIT = 4;
const AUTOMATION_RUN_KEY = 'danlor_last_automation_run';
const AUTOMATION_INTERVAL_MS = 5 * 60 * 1000;

export default function Dashboard() {
  const [opportunities, setOpportunities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [activity, setActivity] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const [oppRes, taskRes, propertyRes, clientRes, interactionAgg] = await Promise.all([
      base44.entities.Opportunity.filter({ archived: false }, { sort: '-updated_date', limit: 500 }),
      base44.entities.CommercialTask.filter({}, { sort: 'due_date', limit: 500 }),
      base44.entities.Property.filter({}, { sort: 'mandate_end', limit: 500 }),
      base44.entities.Client.filter({}, { sort: 'name', limit: 500 }),
      base44.entities.Interaction.aggregate({ groupBy: 'client_id', max: ['date'] }),
    ]);

    const activityMap = {};
    (interactionAgg.rows || []).forEach((row) => {
      activityMap[row.client_id] = { count: row.count || 0, last: row.max_date || row.date_max || null };
    });

    setOpportunities(oppRes.items || []);
    setTasks(taskRes.items || []);
    setProperties(propertyRes.items || []);
    setClients(clientRes.items || []);
    setActivity(activityMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const lastRun = Number(sessionStorage.getItem(AUTOMATION_RUN_KEY) || 0);
      if (Date.now() - lastRun > AUTOMATION_INTERVAL_MS) {
        try {
          await base44.functions.invoke('crmAutomations', {});
          sessionStorage.setItem(AUTOMATION_RUN_KEY, String(Date.now()));
        } catch (error) {
          // Las automatizaciones se reintentan en el siguiente acceso
        }
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

    const mandateRows = properties
      .filter((p) => p.mandate_end && mandateTypeOf(p) !== 'sin_mandato')
      .map((p) => ({ ...p, days: daysUntil(p.mandate_end), mandato: mandateTypeOf(p) }))
      .filter((p) => p.days !== null);

    const mandatesExpired = mandateRows.filter((p) => p.days < 0).sort((a, b) => a.days - b.days);
    const mandatesThisWeek = mandateRows
      .filter((p) => p.days >= 0 && p.days <= 7)
      .sort((a, b) => a.days - b.days);

    return { staleQuotes, risky, overdue, mandatesExpired, mandatesThisWeek };
  }, [opportunities, tasks, properties]);

  const mandateRows = useMemo(
    () => properties.map((property) => ({ property, status: mandateStatus(property) })),
    [properties]
  );

  const hotLeads = useMemo(() => {
    const openByClient = {};
    opportunities
      .filter((o) => o.status === 'open')
      .forEach((o) => {
        const entry = openByClient[o.client_id] || { count: 0, value: 0 };
        entry.count += 1;
        entry.value += Number(o.amount) || 0;
        openByClient[o.client_id] = entry;
      });

    return clients
      .map((client) => {
        const act = activity[client.id] || {};
        const opp = openByClient[client.id] || {};
        const lead = scoreLead({
          client,
          interactionCount: act.count || 0,
          lastInteraction: act.last || null,
          openValue: opp.value || 0,
          openCount: opp.count || 0,
        });
        return { client, ...lead, days: daysSince(act.last) };
      })
      .filter((lead) => lead.band.id === 'hot' && (lead.days === null || lead.days > 30))
      .sort((a, b) => (b.days ?? 9999) - (a.days ?? 9999))
      .slice(0, 4);
  }, [clients, activity, opportunities]);

  const openMandateGroup = (selection) => {
    const params = new URLSearchParams({
      grupo: selection.dimension,
      clave: selection.key,
      etiqueta: selection.label,
    });
    navigate(`/propietarios?${params.toString()}`);
  };

  const maxStageValue = Math.max(...metrics.byStage.map((s) => s.value), 1);
  const upcomingTasks = tasks
    .filter((t) => t.status === 'pendiente')
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
    .slice(0, 6);

  const strip = [
    {
      label: 'Pipeline abierto',
      value: formatCurrency(metrics.pipelineValue),
      hint: `${metrics.open.length} oportunidades abiertas`,
    },
    {
      label: 'Etapas activas',
      value: metrics.byStage.filter((s) => s.count > 0).length,
      hint: `de ${OPEN_STAGES.length} etapas del embudo`,
    },
    {
      label: 'Tasa de cierre',
      value: `${metrics.closeRate.toFixed(0)}%`,
      hint: `${metrics.won.length} ganadas · ${metrics.lost.length} perdidas`,
    },
    {
      label: 'Ticket medio',
      value: formatCurrency(metrics.ticket),
      hint: `${formatCurrency(metrics.wonValue)} ganado`,
    },
    {
      label: 'Tareas para hoy',
      value: metrics.pendingToday.length,
      hint: alerts.overdue.length ? `${alerts.overdue.length} vencidas` : 'Sin tareas vencidas',
    },
  ];

  if (loading) {
    return (
      <div className="ed-panel flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e4ddd0] border-t-[#2D6A4F]" />
      </div>
    );
  }

  return (
    <div className="ed-panel">
      <EditorialHero pipelineValue={formatCurrency(metrics.pipelineValue)} />

      <MetricsStrip items={strip} />

      <div className="ed-body">
        <StageList stages={metrics.byStage} maxStageValue={maxStageValue} />
        <AlertsBriefing alerts={alerts} limit={MANDATE_ALERT_LIMIT} />
      </div>

      <div className="ed-band">
        <HotStaleLeads leads={hotLeads} />
        <QuickRepliesCard leads={hotLeads} />
      </div>

      <div className="ed-low">
        <AutomationSwitches />
        <UpcomingTasks tasks={upcomingTasks} />
        <MandatesSummary
          rows={mandateRows}
          title="Resumen de mandatos"
          onSelect={openMandateGroup}
          variant="editorial"
        />
      </div>
    </div>
  );
}