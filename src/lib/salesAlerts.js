import { daysSince, daysUntil } from '@/lib/crm';

export const STALL_DAYS = 7;
export const CLOSING_SOON_DAYS = 3;

export function buildSalesAlerts(opportunities = []) {
  const stalled = [];
  const closingSoon = [];

  for (const opportunity of opportunities) {
    if (opportunity.status !== 'open' || opportunity.archived) continue;

    const stageDays = daysSince(opportunity.stage_changed_date || opportunity.updated_date);
    if (stageDays !== null && stageDays >= STALL_DAYS) {
      stalled.push({ opportunity, days: stageDays });
    }

    const remaining = daysUntil(opportunity.expected_closing_date);
    if (remaining !== null && remaining < CLOSING_SOON_DAYS) {
      closingSoon.push({ opportunity, remaining });
    }
  }

  stalled.sort((a, b) => b.days - a.days);
  closingSoon.sort((a, b) => a.remaining - b.remaining);

  return { stalled, closingSoon, total: stalled.length + closingSoon.length };
}

export function closingLabel(remaining) {
  if (remaining === null || remaining === undefined) return '';
  if (remaining < 0) return `vencida hace ${Math.abs(remaining)} días`;
  if (remaining === 0) return 'cierra hoy';
  if (remaining === 1) return 'cierra mañana';
  return `quedan ${remaining} días`;
}