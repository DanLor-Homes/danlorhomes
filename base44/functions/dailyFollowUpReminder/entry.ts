import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const FOLLOW_UP_STATUSES = ['nuevo', 'contactado', 'en_seguimiento', 'visita'];
const IDLE_DAYS = 7;
const DAY_MS = 86400000;
const REMINDER_PREFIX = 'Seguimiento diario';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);

    const [clientRes, taskRes, interactionAgg] = await Promise.all([
      base44.entities.Client.filter({}, { sort: 'name', limit: 500 }),
      base44.entities.CommercialTask.filter({ status: 'pendiente' }, { limit: 500 }),
      base44.entities.Interaction.aggregate({ groupBy: 'client_id', max: ['date'] }),
    ]);

    const clients = clientRes.items || [];
    const pendingTasks = taskRes.items || [];

    const reminderAlreadyCreated = pendingTasks.some(
      (task) =>
        task.auto_generated &&
        (task.title || '').startsWith(REMINDER_PREFIX) &&
        task.due_date === today
    );
    if (reminderAlreadyCreated) {
      return Response.json({ created: false, reason: 'reminder_exists', pendingClients: 0 });
    }

    const lastContact = {};
    (interactionAgg.rows || []).forEach((row) => {
      const value = row.max_date || row.date_max || null;
      const time = value ? new Date(value).getTime() : NaN;
      if (!Number.isNaN(time)) lastContact[row.client_id] = time;
    });

    const clientsWithPendingTask = new Set(pendingTasks.map((task) => task.client_id).filter(Boolean));

    const pendingClients = clients.filter((client) => {
      if (!FOLLOW_UP_STATUSES.includes(client.status || 'nuevo')) return false;
      if (clientsWithPendingTask.has(client.id)) return false;
      const last = lastContact[client.id];
      if (!last) return true;
      return Math.floor((now - last) / DAY_MS) >= IDLE_DAYS;
    });

    if (!pendingClients.length) {
      return Response.json({ created: false, reason: 'nothing_pending', pendingClients: 0 });
    }

    const shown = pendingClients.slice(0, 5).map((client) => client.name).join(', ');
    const extra = pendingClients.length > 5 ? ` y ${pendingClients.length - 5} más` : '';
    const title = `${REMINDER_PREFIX}: ${pendingClients.length} ${
      pendingClients.length === 1 ? 'cliente pendiente' : 'clientes pendientes'
    } · ${shown}${extra}`;

    await base44.entities.CommercialTask.create({
      title: title.slice(0, 240),
      due_date: today,
      status: 'pendiente',
      assignee: user.email || '',
      auto_generated: true,
    });

    return Response.json({ created: true, pendingClients: pendingClients.length, title });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}