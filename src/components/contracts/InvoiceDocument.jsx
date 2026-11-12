import React from 'react';
import { computeTotals, formatDate, formatMoney, ISSUER_DEFAULTS, lineAmount, statusMeta } from '@/lib/invoices';

const Row = ({ label, value, strong }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-slate-500">{label}</span>
    <span className={strong ? 'font-semibold tabular-nums text-slate-900' : 'tabular-nums text-slate-800'}>{value}</span>
  </div>
);

const Detail = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-3 py-1">
    <span className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</span>
    <span className="text-right text-[12.5px] font-medium text-slate-800">{value}</span>
  </div>
);

export default function InvoiceDocument({ invoice }) {
  if (!invoice) return null;

  const items = invoice.items?.length ? invoice.items : [];
  const totals = computeTotals(items, invoice.vat_rate ?? 21, invoice.irpf_rate ?? 0);
  const issuer = { ...ISSUER_DEFAULTS, ...(invoice.issuer || {}) };
  const meta = statusMeta(invoice.status);

  return (
    <article className="doc-print mx-auto w-full max-w-[820px] bg-white text-slate-900">
      <header className="flex flex-wrap items-start justify-between gap-6 bg-slate-900 px-9 py-8 text-white">
        <div className="min-w-0">
          <p className="font-heading text-xl font-extrabold tracking-tight">{issuer.name}</p>
          <p className="mt-1 text-[10.5px] uppercase tracking-[0.24em] text-slate-300">{issuer.tagline}</p>
          <div className="mt-4 space-y-0.5 text-[11.5px] leading-relaxed text-slate-300">
            {issuer.nif && <p>NIF {issuer.nif}</p>}
            {issuer.address && <p>{issuer.address}</p>}
            {issuer.email && <p>{issuer.email}</p>}
            {issuer.phone && <p>{issuer.phone}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Factura</p>
          <p className="font-heading text-2xl font-extrabold tracking-tight tabular-nums">{invoice.number || '—'}</p>
          <span className="mt-3 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
            {meta.label}
          </span>
        </div>
      </header>

      <div className="grid gap-4 px-9 pt-8 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Facturar a</p>
          <p className="mt-2 font-heading text-[15px] font-bold leading-snug">{invoice.client_name || '—'}</p>
          <div className="mt-2 space-y-0.5 text-[12px] leading-relaxed text-slate-600">
            {invoice.client_nif && <p>NIF {invoice.client_nif}</p>}
            {invoice.client_address && <p>{invoice.client_address}</p>}
            {invoice.client_email && <p>{invoice.client_email}</p>}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Detalles</p>
          <div className="mt-2 divide-y divide-slate-200/70">
            <Detail label="Emisión" value={formatDate(invoice.issue_date)} />
            <Detail label="Vencimiento" value={formatDate(invoice.due_date)} />
            {invoice.property_title && <Detail label="Inmueble" value={invoice.property_title} />}
            {invoice.payment_method && <Detail label="Pago" value={invoice.payment_method} />}
            {invoice.status === 'pagada' && <Detail label="Cobrada el" value={formatDate(invoice.paid_date)} />}
          </div>
        </div>
      </div>

      <div className="px-9 pt-7">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
              <th className="border-b border-slate-300 pb-2 text-left font-semibold">Concepto</th>
              <th className="w-14 border-b border-slate-300 pb-2 text-center font-semibold">Cant.</th>
              <th className="w-28 border-b border-slate-300 pb-2 text-right font-semibold">Precio</th>
              <th className="w-28 border-b border-slate-300 pb-2 text-right font-semibold">Importe</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td className="border-b border-slate-100 py-3 text-slate-400" colSpan={4}>
                  Sin líneas detalladas
                </td>
              </tr>
            )}
            {items.map((item, index) => (
              <tr key={index} className="align-top">
                <td className="border-b border-slate-100 py-3 pr-3 font-medium leading-snug">
                  {item.description || '—'}
                </td>
                <td className="border-b border-slate-100 py-3 text-center tabular-nums text-slate-600">
                  {Number(item.quantity) || 0}
                </td>
                <td className="border-b border-slate-100 py-3 text-right tabular-nums text-slate-600">
                  {formatMoney(item.unit_price)}
                </td>
                <td className="border-b border-slate-100 py-3 text-right font-semibold tabular-nums">
                  {formatMoney(lineAmount(item))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end px-9">
        <div className="w-full max-w-[330px] space-y-1.5 text-[12.5px]">
          <Row label="Base imponible" value={formatMoney(totals.subtotal)} />
          <Row label={`IVA ${Number(invoice.vat_rate ?? 21)} %`} value={formatMoney(totals.vat_amount)} />
          {totals.irpf_amount > 0 && (
            <Row label={`Retención IRPF ${Number(invoice.irpf_rate)} %`} value={`- ${formatMoney(totals.irpf_amount)}`} />
          )}
          <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-300">Total</span>
            <span className="font-heading text-lg font-extrabold tabular-nums">{formatMoney(totals.total)}</span>
          </div>
        </div>
      </div>

      {(invoice.notes || invoice.payment_method) && (
        <div className="mt-7 px-9">
          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Observaciones</p>
            {invoice.payment_method && (
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-700">
                Forma de pago: {invoice.payment_method}
              </p>
            )}
            {invoice.notes && <p className="mt-1 text-[12.5px] leading-relaxed text-slate-700">{invoice.notes}</p>}
          </div>
        </div>
      )}

      <footer className="mt-8 border-t border-slate-200 px-9 py-4 text-[10px] leading-relaxed text-slate-500">
        Documento emitido por {issuer.name}. Factura generada el {formatDate(new Date().toISOString())}. Conserve este
        documento como justificante del servicio prestado.
      </footer>
    </article>
  );
}