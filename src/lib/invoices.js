export const INVOICE_STATUS = {
  borrador: { label: 'Borrador', badge: 'bg-slate-100 text-slate-600 ring-slate-200' },
  emitida: { label: 'Emitida', badge: 'bg-blue-50 text-blue-700 ring-blue-200' },
  pagada: { label: 'Cobrada', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  vencida: { label: 'Vencida', badge: 'bg-rose-50 text-rose-700 ring-rose-200' },
};

export const INVOICE_STATUS_LIST = Object.entries(INVOICE_STATUS).map(([id, meta]) => ({ id, ...meta }));

export const statusMeta = (id) => INVOICE_STATUS[id] || INVOICE_STATUS.borrador;

export const VAT_RATES = [0, 4, 10, 21];

export const ISSUER_DEFAULTS = {
  name: 'DAN&LOR HOMES',
  tagline: 'Servicios inmobiliarios',
  nif: '',
  address: '',
  email: '',
  phone: '',
};

export const today = () => new Date().toISOString().slice(0, 10);

export const addDays = (value, days) => {
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
};

export const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(String(value).length <= 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-ES');
};

const round = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const lineAmount = (item) => round((Number(item?.quantity) || 0) * (Number(item?.unit_price) || 0));

export function computeTotals(items = [], vatRate = 21, irpfRate = 0) {
  const subtotal = round(items.reduce((sum, item) => sum + lineAmount(item), 0));
  const vat = round(subtotal * (Number(vatRate) || 0) / 100);
  const irpf = round(subtotal * (Number(irpfRate) || 0) / 100);
  return { subtotal, vat_amount: vat, irpf_amount: irpf, total: round(subtotal + vat - irpf) };
}

export function nextInvoiceNumber(invoices = [], date) {
  const year = (date ? new Date(`${date}T00:00:00`) : new Date()).getFullYear();
  const used = invoices.filter((invoice) => String(invoice.number || '').includes(`-${year}-`)).length;
  return `FAC-${year}-${String(used + 1).padStart(4, '0')}`;
}