import { OPEN_STAGES, daysSince, daysUntil, formatCurrency, formatDate, stageLabel } from '@/lib/crm';
import { portalLabel } from '@/lib/portals';
import { mandateLabel, mandateTypeOf } from '@/lib/mandates';

export const STALLED_DAYS = 14;
export const QUOTE_ALERT_DAYS = 5;
export const CLOSING_DAYS = 3;
export const HOT_LEAD_STALE_DAYS = 14;

const TYPE_WEIGHT = {
  closing: 0,
  task: 1,
  lead: 2,
  stalled: 3,
  quote: 4,
  portal: 5,
  mandate: 6,
};

/**
 * Construye la lista completa de avisos automáticos del panel.
 * Cada aviso lleva una clave estable para poder marcarlo como revisado.
 */
export function buildDashboardAlerts({
  opportunities = [],
  tasks = [],
  properties = [],
  hotLeads = [],
  listings = [],
}) {
  const alerts = [];
  const openStageIds = new Set(OPEN_STAGES.map((stage) => stage.id));

  opportunities.forEach((op) => {
    if (op.status !== 'open') return;

    const remaining = daysUntil(op.expected_closing_date);
    if (op.expected_closing_date && remaining !== null && remaining >= 0 && remaining < CLOSING_DAYS) {
      alerts.push({
        key: `closing:${op.id}`,
        type: 'closing',
        tag: 'Cierre',
        title: op.name,
        detail: `Cierre previsto ${formatDate(op.expected_closing_date)} · ${
          remaining === 0 ? 'es hoy' : `quedan ${remaining} ${remaining === 1 ? 'día' : 'días'}`
        }`,
        to: '/pipeline',
        urgency: remaining,
      });
    }

    const stalledDays = daysSince(op.stage_changed_date);
    if (openStageIds.has(op.stage) && stalledDays !== null && stalledDays >= STALLED_DAYS) {
      alerts.push({
        key: `stalled:${op.id}:${op.stage}`,
        type: 'stalled',
        tag: 'Estancada',
        title: op.name,
        detail: `${stageLabel(op.stage)} desde hace ${stalledDays} días`,
        to: '/pipeline',
        urgency: -stalledDays,
      });
    } else if (op.stage === 'presupuesto_enviado' && stalledDays !== null && stalledDays >= QUOTE_ALERT_DAYS) {
      alerts.push({
        key: `quote:${op.id}`,
        type: 'quote',
        tag: 'Presupuesto',
        title: op.name,
        detail: `Presupuesto enviado sin respuesta hace ${stalledDays} días`,
        to: '/pipeline',
        urgency: -stalledDays,
      });
    }
  });

  tasks.forEach((task) => {
    if (task.status !== 'pendiente' || !task.due_date) return;
    const lateDays = daysSince(task.due_date);
    if (lateDays === null || lateDays <= 0) return;
    alerts.push({
      key: `task:${task.id}`,
      type: 'task',
      tag: 'Tarea',
      title: task.title,
      detail: `Vencida el ${formatDate(task.due_date)} · hace ${lateDays} ${lateDays === 1 ? 'día' : 'días'}`,
      to: '/tareas',
      urgency: -lateDays,
    });
  });

  hotLeads.forEach((lead) => {
    if (lead.band?.id !== 'hot') return;
    if (lead.days !== null && lead.days <= HOT_LEAD_STALE_DAYS) return;
    alerts.push({
      key: `lead:${lead.client.id}`,
      type: 'lead',
      tag: 'Lead caliente',
      title: lead.client.name,
      detail:
        lead.days === null
          ? 'Lead caliente sin ningún contacto registrado'
          : `Lead caliente sin contacto hace ${lead.days} días`,
      to: '/leads',
      urgency: -(lead.days ?? 999),
    });
  });

  listings.forEach((listing) => {
    if (listing.status !== 'nuevo') return;
    const price = listing.price ? ` · ${formatCurrency(listing.price)}` : '';
    alerts.push({
      key: `portal:${listing.id}`,
      type: 'portal',
      tag: 'Portal',
      title: listing.title,
      detail: `Inmueble nuevo en ${portalLabel(listing.portal)}${listing.zone ? ` · ${listing.zone}` : ''}${price}`,
      to: '/portales',
      urgency: -(daysSince(listing.first_seen) ?? 0),
    });
  });

  properties.forEach((property) => {
    if (!property.mandate_end || mandateTypeOf(property) === 'sin_mandato') return;
    const days = daysUntil(property.mandate_end);
    if (days === null || days > 7) return;
    const expired = days < 0;
    const absDays = Math.abs(days);
    alerts.push({
      key: `mandate:${property.id}:${property.mandate_end}`,
      type: 'mandate',
      tag: expired ? 'Caducado' : 'Mandato',
      title: property.title,
      detail: `${mandateLabel(mandateTypeOf(property))} ${expired ? 'caducado el' : 'caduca el'} ${formatDate(
        property.mandate_end
      )}${
        expired
          ? ` · hace ${absDays} ${absDays === 1 ? 'día' : 'días'}`
          : days === 0
            ? ' · hoy'
            : ` · en ${days} ${days === 1 ? 'día' : 'días'}`
      }`,
      to: '/propietarios',
      urgency: days,
    });
  });

  return alerts.sort(
    (a, b) => TYPE_WEIGHT[a.type] - TYPE_WEIGHT[b.type] || a.urgency - b.urgency || a.title.localeCompare(b.title)
  );
}