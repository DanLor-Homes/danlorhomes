import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const OPEN_STAGES = ['nuevo_lead', 'reunion_agendada', 'visita', 'presupuesto', 'presupuesto_enviado'];
const CLOSED_STATUSES = ['won', 'lost'];
const DAY_MS = 86400000;

function toTime(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [oppRes, interactionRes, taskRes] = await Promise.all([
      base44.entities.Opportunity.filter({ archived: false }, { limit: 500 }),
      base44.entities.Interaction.filter({}, { sort: '-date', limit: 500 }),
      base44.entities.CommercialTask.filter({ status: 'pendiente' }, { limit: 500 }),
    ]);

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

    const autoTaskOpportunities = new Set(
      pendingTasks.filter((task) => task.auto_generated && task.opportunity_id).map((task) => task.opportunity_id)
    );

    const now = Date.now();
    const tasksToCreate = [];
    const interactionUpdates = [];

    for (const opportunity of opportunities) {
      const lastInteraction = lastInteractionByClient[opportunity.client_id] || null;
      if (lastInteraction && (!opportunity.last_interaction_date || toTime(opportunity.last_interaction_date) !== lastInteraction)) {
        interactionUpdates.push({ id: opportunity.id, last_interaction_date: new Date(lastInteraction).toISOString() });
      }

      if (!OPEN_STAGES.includes(opportunity.stage)) continue;

      const reference =
        lastInteraction || toTime(opportunity.stage_changed_date) || toTime(opportunity.created_date) || now;
      const idleDays = Math.floor((now - reference) / DAY_MS);

      if (idleDays >= 7 && !autoTaskOpportunities.has(opportunity.id)) {
        tasksToCreate.push({
          title: `Retomar contacto con ${opportunity.name}`,
          due_date: new Date(now + 2 * DAY_MS).toISOString().slice(0, 10),
          status: 'pendiente',
          opportunity_id: opportunity.id,
          assignee: user.email || '',
          auto_generated: true,
        });
        autoTaskOpportunities.add(opportunity.id);
      }
    }

    const toArchive = opportunities
      .filter((opportunity) => {
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
      archived: toArchive.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}