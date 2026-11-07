import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const OPEN_STAGES = ['nuevo_lead', 'reunion_agendada', 'visita', 'presupuesto', 'presupuesto_enviado'];
const STAGE_LABELS = {
  nuevo_lead: 'Nuevo lead',
  reunion_agendada: 'Reunión agendada',
  visita: 'Visita',
  presupuesto: 'Presupuesto',
  presupuesto_enviado: 'Presupuesto enviado',
};
const CLOSED_STATUSES = ['won', 'lost'];
const DAY_MS = 86400000;
const STALL_DAYS = 7;
const CLOSING_SOON_DAYS = 3;

function toTime(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function taskKind(title) {
  if (title.startsWith('Cierre previsto')) return 'cierre';
  if (title.startsWith('Desbloquear')) return 'etapa';
  return 'retomar';
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [oppRes, interactionRes, taskRes, ruleRes] = await Promise.all([
      base44.entities.Opportunity.filter({ archived: false }, { limit: 500 }),
      base44.entities.Interaction.filter({}, { sort: '-date', limit: 500 }),
      base44.entities.CommercialTask.filter({ status: 'pendiente' }, { limit: 500 }),
      base44.entities.AutomationRule.filter({}, { limit: 50 }),
    ]);

    const ruleState = {};
    for (const rule of ruleRes.items || []) {
      ruleState[rule.key] = rule.active !== false;
    }
    const ruleEnabled = (key) => ruleState[key] !== false;

    const opportunities = oppRes.items || [];
    const interactions = interactionRes.items || [];
    const pendingTasks = taskRes.items || [];

    const lastInteractionByClient = {};
    for (const interaction of interactions) {
      const time = toTime(interaction.date);
      if (!time) continue;
      const current = lastInteractionByClient[interaction.client_id];
      if (!current || time > current) lastInteractionByClient[interaction.client_id] = time;
    }

    const autoTaskKeys = new Set();
    for (const task of pendingTasks) {
      if (!task.auto_generated || !task.opportunity_id) continue;
      autoTaskKeys.add(`${task.opportunity_id}:${taskKind(task.title || '')}`);
    }

    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    const tasksToCreate = [];
    const interactionUpdates = [];
    let closingSoon = 0;
    let stalled = 0;

    for (const opportunity of opportunities) {
      const lastInteraction = lastInteractionByClient[opportunity.client_id] || null;
      if (lastInteraction && (!opportunity.last_interaction_date || toTime(opportunity.last_interaction_date) !== lastInteraction)) {
        interactionUpdates.push({ id: opportunity.id, last_interaction_date: new Date(lastInteraction).toISOString() });
      }

      if (!OPEN_STAGES.includes(opportunity.stage)) continue;

      const closingTime = toTime(opportunity.expected_closing_date);
      const remainingDays = closingTime === null ? null : Math.ceil((closingTime - now) / DAY_MS);
      if (
        ruleEnabled('cierre') &&
        remainingDays !== null &&
        remainingDays < CLOSING_SOON_DAYS &&
        !autoTaskKeys.has(`${opportunity.id}:cierre`)
      ) {
        closingSoon += 1;
        tasksToCreate.push({
          title: `Cierre previsto: ${opportunity.name}`,
          due_date: opportunity.expected_closing_date,
          status: 'pendiente',
          opportunity_id: opportunity.id,
          assignee: user.email || '',
          auto_generated: true,
        });
        autoTaskKeys.add(`${opportunity.id}:cierre`);
      }

      const stageAnchor = toTime(opportunity.stage_changed_date) || toTime(opportunity.created_date) || now;
      const stageDays = Math.floor((now - stageAnchor) / DAY_MS);

      if (stageDays >= STALL_DAYS) {
        if (ruleEnabled('desbloquear') && !autoTaskKeys.has(`${opportunity.id}:etapa`)) {
          stalled += 1;
          tasksToCreate.push({
            title: `Desbloquear ${opportunity.name}: ${stageDays} días en ${STAGE_LABELS[opportunity.stage] || 'la etapa actual'}`,
            due_date: today,
            status: 'pendiente',
            opportunity_id: opportunity.id,
            assignee: user.email || '',
            auto_generated: true,
          });
          autoTaskKeys.add(`${opportunity.id}:etapa`);
        }
        continue;
      }

      const reference =
        lastInteraction || toTime(opportunity.stage_changed_date) || toTime(opportunity.created_date) || now;
      const idleDays = Math.floor((now - reference) / DAY_MS);

      if (ruleEnabled('retomar') && idleDays >= 7 && !autoTaskKeys.has(`${opportunity.id}:retomar`)) {
        tasksToCreate.push({
          title: `Retomar contacto con ${opportunity.name}`,
          due_date: new Date(now + 2 * DAY_MS).toISOString().slice(0, 10),
          status: 'pendiente',
          opportunity_id: opportunity.id,
          assignee: user.email || '',
          auto_generated: true,
        });
        autoTaskKeys.add(`${opportunity.id}:retomar`);
      }
    }

    const toArchive = opportunities
      .filter((opportunity) => {
        if (!ruleEnabled('archivar')) return false;
        if (!CLOSED_STATUSES.includes(opportunity.status)) return false;
        const closing = toTime(opportunity.stage_changed_date) || toTime(opportunity.updated_date);
        if (!closing) return false;
        return Math.floor((now - closing) / DAY_MS) >= 30;
      })
      .map((opportunity) => ({
        id: opportunity.id,
        archived: true,
        archived_date: new Date(now).toISOString(),
      }));

    if (tasksToCreate.length) {
      await base44.entities.CommercialTask.bulkCreate(tasksToCreate);
    }
    if (interactionUpdates.length) {
      await base44.entities.Opportunity.bulkUpdate(interactionUpdates);
    }
    if (toArchive.length) {
      await base44.entities.Opportunity.bulkUpdate(toArchive);
    }

    return Response.json({
      checked: opportunities.length,
      tasksCreated: tasksToCreate.length,
      closingSoon,
      stalled,
      archived: toArchive.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}