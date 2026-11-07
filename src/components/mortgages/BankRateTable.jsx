import React from 'react';
import { ExternalLink, Landmark, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/crm/EmptyState';
import { formatCurrency, formatDateTime } from '@/lib/crm';
import { RATE_TYPE_LABELS, simulate } from '@/lib/mortgage';

export default function BankRateTable({ offers, form, loading, onEdit, onDelete, onRefresh }) {
  if (loading) {
    return <div className="h-56 animate-pulse rounded-2xl bg-muted" />;
  }

  if (!offers.length) {
    return (
      <EmptyState
        icon={Landmark}
        title="Sin ofertas de entidades"
        description="Pulsa «Actualizar tipos» para leer los tipos publicados en las webs de los bancos, o añade una oferta a mano."
      />
    );
  }

  const rows = offers
    .map((offer) => {
      const years = Math.min(Number(form.years) || 30, Number(offer.term_years) || Number(form.years) || 30);
      return { offer, years, calc: simulate({ ...form, years, tin: offer.tin }) };
    })
    .sort((a, b) => a.calc.quota - b.calc.quota);

  const bestQuota = rows[0]?.calc.quota;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-border/70 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-semibold">Entidad</th>
            <th className="px-4 py-3 font-semibold">Tipo</th>
            <th className="px-4 py-3 text-right font-semibold">TIN</th>
            <th className="px-4 py-3 text-right font-semibold">TAE</th>
            <th className="px-4 py-3 text-right font-semibold">Cuota</th>
            <th className="px-4 py-3 text-right font-semibold">Intereses</th>
            <th className="px-4 py-3 font-semibold">Lectura</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ offer, years, calc }) => (
            <tr key={offer.id} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-3">
                <p className="font-semibold">{offer.bank}</p>
                <p className="text-xs text-muted-foreground">{offer.product}</p>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {RATE_TYPE_LABELS[offer.rate_type] || '—'} · {years} años
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {offer.tin != null ? `${String(offer.tin).replace('.', ',')} %` : '—'}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {offer.tae != null ? `${String(offer.tae).replace('.', ',')} %` : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`font-heading text-sm font-bold tabular-nums ${
                    calc.quota === bestQuota ? 'text-primary' : ''
                  }`}
                >
                  {formatCurrency(calc.quota)}
                </span>
                {calc.quota === bestQuota && (
                  <span className="ml-2 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Mejor
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {formatCurrency(calc.interest)}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {offer.source === 'web' ? 'Web banco' : 'Manual'}
                {offer.checked_at ? <span className="block">{formatDateTime(offer.checked_at)}</span> : null}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  {offer.link && (
                    <Button size="icon" variant="ghost" asChild>
                      <a href={offer.link} target="_blank" rel="noreferrer" title="Ver en el banco">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => onEdit(offer)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(offer)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border/60 px-4 py-2.5 text-[11px] text-muted-foreground">
        Cuota calculada con el TIN de cada entidad y {form.years || 0} años de plazo. Las condiciones finales dependen
        de la vinculación y la tasación de cada banco.
      </p>
    </div>
  );
}