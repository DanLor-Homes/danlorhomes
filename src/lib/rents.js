import { todayISO } from '@/lib/crm';

export const LEASE_STATUSES = [
  { id: 'activo', label: 'Activo', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { id: 'finalizado', label: 'Finalizado', className: 'bg-muted text-muted-foreground' },
  { id: 'cancelado', label: 'Cancelado', className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
];

export const PAYMENT_STATUSES = [
  { id: 'pendiente', label: 'Pendiente', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { id: 'cobrado', label: 'Cobrado', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { id: 'vencido', label: 'Vencido', className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
];

export const PAYMENT_METHODS = [
  { id: 'transferencia', label: 'Transferencia' },
  { id: 'domiciliado', label: 'Domiciliado' },
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'bizum', label: 'Bizum' },
  { id: 'otro', label: 'Otro' },
];

export const statusMeta = (list, id) => list.find((item) => item.id === id) || list[0];

export const methodLabel = (id) => PAYMENT_METHODS.find((item) => item.id === id)?.label || '—';

const pad = (value) => String(value).padStart(2, '0');

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function monthLabel(key) {
  if (!key) return '—';
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, 1);
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date);
}

export function monthOptions(count = 15) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const id = monthKey(date);
    return { id, label: monthLabel(id) };
  });
}

export function dueDateFor(period, paymentDay = 1) {
  const [year, month] = period.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(Math.max(Number(paymentDay) || 1, 1), lastDay);
  return `${period}-${pad(day)}`;
}

export const isLeaseActiveIn = (lease, period) => {
  if (lease.status !== 'activo') return false;
  const start = (lease.start_date || '').slice(0, 7);
  const end = (lease.end_date || '').slice(0, 7);
  if (start && period < start) return false;
  if (end && period > end) return false;
  return true;
};

export function missingPayments(leases, payments, period) {
  const existing = new Set(payments.map((payment) => payment.lease_id));
  return leases
    .filter((lease) => isLeaseActiveIn(lease, period) && !existing.has(lease.id))
    .map((lease) => ({
      lease_id: lease.id,
      tenant_name: lease.tenant_name || '',
      property_title: lease.property_title || '',
      period,
      due_date: dueDateFor(period, lease.payment_day),
      amount: Number(lease.monthly_rent) || 0,
      status: 'pendiente',
    }));
}

export const effectiveStatus = (payment) => {
  if (payment.status === 'cobrado') return 'cobrado';
  return payment.due_date && payment.due_date < todayISO() ? 'vencido' : 'pendiente';
};

export function rentTotals(payments) {
  return payments.reduce(
    (acc, payment) => {
      const amount = Number(payment.amount) || 0;
      acc.esperado += amount;
      const status = effectiveStatus(payment);
      if (status === 'cobrado') acc.cobrado += Number(payment.paid_amount) || amount;
      else if (status === 'vencido') acc.vencido += amount;
      else acc.pendiente += amount;
      return acc;
    },
    { esperado: 0, cobrado: 0, pendiente: 0, vencido: 0 }
  );
}

export const contractedRent = (leases) =>
  leases
    .filter((lease) => lease.status === 'activo')
    .reduce((total, lease) => total + (Number(lease.monthly_rent) || 0), 0);