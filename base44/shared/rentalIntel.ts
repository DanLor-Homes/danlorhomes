// Contexto de la cartera de alquileres para las funciones de IA del CRM DAN&LOR.
import { euro, shortDate, daysSince, daysUntil } from './crmIntel.ts';

const todayISO = () => new Date().toISOString().slice(0, 10);

// Mismo criterio que la app: un recibo no cobrado con vencimiento pasado está vencido.
export function paymentState(payment) {
  if (payment.status === 'cobrado') return 'cobrado';
  return payment.due_date && payment.due_date < todayISO() ? 'vencido' : 'pendiente';
}

export async function loadRentalIntel(base44) {
  const [leaseRes, paymentRes] = await Promise.all([
    base44.entities.Lease.filter({}, { sort: 'end_date', limit: 300 }),
    base44.entities.RentPayment.filter({}, { sort: '-due_date', limit: 400 }),
  ]);

  const leases = leaseRes.items || [];
  const payments = paymentRes.items || [];
  const activeLeases = leases.filter((lease) => lease.status === 'activo');

  const overdue = payments
    .filter((payment) => paymentState(payment) === 'vencido')
    .map((payment) => ({ payment, days: daysSince(payment.due_date) ?? 0 }))
    .sort((a, b) => b.days - a.days);

  const pending = payments.filter((payment) => paymentState(payment) === 'pendiente');

  const reviews = activeLeases
    .filter((lease) => lease.next_review_date)
    .map((lease) => ({ lease, days: daysUntil(lease.next_review_date) }))
    .filter((item) => item.days !== null && item.days <= 60)
    .sort((a, b) => a.days - b.days);

  const endings = activeLeases
    .filter((lease) => lease.end_date)
    .map((lease) => ({ lease, days: daysUntil(lease.end_date) }))
    .filter((item) => item.days !== null && item.days <= 90)
    .sort((a, b) => a.days - b.days);

  const contracted = activeLeases.reduce((sum, lease) => sum + (Number(lease.monthly_rent) || 0), 0);
  const overdueAmount = overdue.reduce((sum, item) => sum + (Number(item.payment.amount) || 0), 0);
  const withoutReview = activeLeases.filter((lease) => !lease.next_review_date).length;

  return {
    activeLeases,
    payments,
    overdue,
    pending,
    reviews,
    endings,
    contracted,
    overdueAmount,
    withoutReview,
  };
}

export function rentalContextText(intel) {
  const {
    activeLeases,
    payments,
    overdue,
    pending,
    reviews,
    endings,
    contracted,
    overdueAmount,
    withoutReview,
  } = intel;
  const today = shortDate(todayISO());

  const leases = activeLeases
    .slice(0, 30)
    .map(
      (lease) =>
        `- ${lease.tenant_name || 'inquilino sin nombre'} · ${lease.property_title || 'inmueble sin título'} · renta ${euro(
          lease.monthly_rent
        )} · cobro día ${lease.payment_day || 1} · hasta ${shortDate(lease.end_date) || 'sin fecha'}${
          lease.next_review_date ? ` · revisión ${shortDate(lease.next_review_date)}` : ''
        }${lease.notes ? ` · notas: ${(lease.notes || '').replace(/\s+/g, ' ').slice(0, 120)}` : ''}`
    )
    .join('\n');

  const overdueText = overdue
    .slice(0, 20)
    .map(
      ({ payment, days }) =>
        `- ${payment.tenant_name || 'inquilino'} · ${payment.property_title || 'inmueble'} · ${euro(
          payment.amount
        )} · periodo ${payment.period} · venció ${shortDate(payment.due_date)} (hace ${days} días)${
          payment.method ? ` · ${payment.method}` : ''
        }`
    )
    .join('\n');

  const pendingText = pending
    .slice(0, 20)
    .map(
      (payment) =>
        `- ${payment.tenant_name || 'inquilino'} · ${payment.property_title || 'inmueble'} · ${euro(
          payment.amount
        )} · vence ${shortDate(payment.due_date)}`
    )
    .join('\n');

  const reviewText = reviews
    .map(
      ({ lease, days }) =>
        `- ${lease.tenant_name || 'inquilino'} · ${lease.property_title || 'inmueble'} · revisión ${
          days < 0 ? `vencida hace ${Math.abs(days)} días` : `en ${days} días`
        } (${shortDate(lease.next_review_date)}) · renta actual ${euro(lease.monthly_rent)}`
    )
    .join('\n');

  const endingText = endings
    .map(
      ({ lease, days }) =>
        `- ${lease.tenant_name || 'inquilino'} · ${lease.property_title || 'inmueble'} · contrato ${
          days < 0 ? `caducado hace ${Math.abs(days)} días` : `termina en ${days} días`
        } (${shortDate(lease.end_date)}) · renta ${euro(lease.monthly_rent)}`
    )
    .join('\n');

  return `CARTERA DE ALQUILERES (hoy ${today})
Contratos activos: ${activeLeases.length} · renta mensual contratada ${euro(contracted)}
Recibos registrados: ${payments.length} · pendientes de vencer: ${pending.length}
Deuda vencida: ${euro(overdueAmount)} en ${overdue.length} recibos
Contratos activos sin fecha de revisión: ${withoutReview}

CONTRATOS ACTIVOS
${leases || 'ninguno'}

RECIBOS VENCIDOS SIN COBRAR
${overdueText || 'ninguno'}

RECIBOS PENDIENTES AÚN NO VENCIDOS
${pendingText || 'ninguno'}

REVISIONES DE RENTA EN LOS PRÓXIMOS 60 DÍAS
${reviewText || 'ninguna'}

CONTRATOS QUE TERMINAN EN LOS PRÓXIMOS 90 DÍAS
${endingText || 'ninguno'}`;
}