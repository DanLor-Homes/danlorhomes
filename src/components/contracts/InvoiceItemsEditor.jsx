import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney, lineAmount } from '@/lib/invoices';

export default function InvoiceItemsEditor({ items, onChange }) {
  const update = (index, patch) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const add = () => onChange([...items, { description: '', quantity: 1, unit_price: '' }]);

  const remove = (index) => {
    const next = items.filter((_, i) => i !== index);
    onChange(next.length ? next : [{ description: '', quantity: 1, unit_price: '' }]);
  };

  return (
    <div className="space-y-2">
      <div className="hidden gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:grid sm:grid-cols-[1fr_70px_110px_88px_32px]">
        <span>Concepto</span>
        <span>Cant.</span>
        <span>Precio</span>
        <span className="text-right">Importe</span>
        <span />
      </div>

      {items.map((item, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[1fr_70px_110px_88px_32px] sm:items-center">
          <Input
            value={item.description}
            placeholder="Honorarios de intermediación"
            onChange={(event) => update(index, { description: event.target.value })}
          />
          <Input
            type="number"
            min="0"
            step="1"
            value={item.quantity}
            onChange={(event) => update(index, { quantity: event.target.value })}
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={item.unit_price}
            onChange={(event) => update(index, { unit_price: event.target.value })}
          />
          <span className="text-right text-sm font-medium tabular-nums text-muted-foreground">
            {formatMoney(lineAmount(item))}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Eliminar línea"
            onClick={() => remove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Añadir línea
      </Button>
    </div>
  );
}