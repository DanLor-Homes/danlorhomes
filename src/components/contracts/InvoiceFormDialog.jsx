import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import InvoiceItemsEditor from './InvoiceItemsEditor';
import {
  INVOICE_STATUS_LIST,
  ISSUER_DEFAULTS,
  VAT_RATES,
  addDays,
  computeTotals,
  formatMoney,
  today,
} from '@/lib/invoices';

const emptyItem = () => ({ description: '', quantity: 1, unit_price: '' });

const blankForm = (nextNumber, defaultIssuer) => ({
  number: nextNumber || '',
  status: 'emitida',
  issue_date: today(),
  due_date: addDays(today(), 30),
  client_id: '',
  client_name: '',
  client_nif: '',
  client_email: '',
  client_address: '',
  property_id: '',
  property_title: '',
  items: [emptyItem()],
  vat_rate: 21,
  irpf_rate: 0,
  payment_method: 'Transferencia bancaria',
  notes: '',
  issuer: { ...ISSUER_DEFAULTS, ...(defaultIssuer || {}) },
});

const fromInvoice = (invoice) => ({
  number: invoice.number || '',
  status: invoice.status || 'emitida',
  issue_date: invoice.issue_date || today(),
  due_date: invoice.due_date || addDays(invoice.issue_date || today(), 30),
  client_id: invoice.client_id || '',
  client_name: invoice.client_name || '',
  client_nif: invoice.client_nif || '',
  client_email: invoice.client_email || '',
  client_address: invoice.client_address || '',
  property_id: invoice.property_id || '',
  property_title: invoice.property_title || '',
  items: invoice.items?.length ? invoice.items.map((item) => ({ ...emptyItem(), ...item })) : [emptyItem()],
  vat_rate: invoice.vat_rate ?? 21,
  irpf_rate: invoice.irpf_rate ?? 0,
  payment_method: invoice.payment_method || '',
  notes: invoice.notes || '',
  issuer: { ...ISSUER_DEFAULTS, ...(invoice.issuer || {}) },
});

export default function InvoiceFormDialog({
  open,
  onOpenChange,
  invoice,
  clients = [],
  properties = [],
  nextNumber,
  defaultIssuer,
  onSaved,
}) {
  const [form, setForm] = useState(() => blankForm(nextNumber, defaultIssuer));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(invoice ? fromInvoice(invoice) : blankForm(nextNumber, defaultIssuer));
    setError('');
  }, [open, invoice, nextNumber, defaultIssuer]);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const setIssuer = (patch) => setForm((prev) => ({ ...prev, issuer: { ...prev.issuer, ...patch } }));

  const totals = computeTotals(form.items, form.vat_rate, form.irpf_rate);

  const handleClient = (id) => {
    const client = clients.find((item) => item.id === id);
    set({
      client_id: id,
      client_name: client?.name || form.client_name,
      client_email: client?.email || form.client_email,
    });
  };

  const handleProperty = (id) => {
    const property = properties.find((item) => item.id === id);
    set({
      property_id: id,
      property_title: property
        ? [property.title, property.reference].filter(Boolean).join(' · ')
        : form.property_title,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.client_name.trim()) {
      setError('Indica el nombre del cliente al que se factura.');
      return;
    }
    const items = form.items.filter((item) => item.description.trim() || Number(item.unit_price) > 0);
    if (!items.length) {
      setError('Añade al menos una línea con concepto e importe.');
      return;
    }

    setSaving(true);
    setError('');
    const payload = {
      ...form,
      items: items.map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
      })),
      vat_rate: Number(form.vat_rate) || 0,
      irpf_rate: Number(form.irpf_rate) || 0,
      ...totals,
    };

    try {
      const saved = invoice
        ? await base44.entities.Invoice.update(invoice.id, payload)
        : await base44.entities.Invoice.create(payload);
      onOpenChange(false);
      onSaved?.(saved || payload);
    } catch (err) {
      setError(err?.message || 'No se ha podido guardar la factura.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? `Editar factura ${invoice.number}` : 'Nueva factura'}</DialogTitle>
          <DialogDescription>
            Introduce las líneas del servicio; el IVA y el total se calculan automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="invoice-number">Número</Label>
              <Input
                id="invoice-number"
                value={form.number}
                onChange={(event) => set({ number: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoice-issue">Emisión</Label>
              <Input
                id="invoice-issue"
                type="date"
                value={form.issue_date}
                onChange={(event) => set({ issue_date: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoice-due">Vencimiento</Label>
              <Input
                id="invoice-due"
                type="date"
                value={form.due_date}
                onChange={(event) => set({ due_date: event.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select value={form.client_id} onValueChange={handleClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoice-client">Nombre o razón social</Label>
              <Input
                id="invoice-client"
                value={form.client_name}
                onChange={(event) => set({ client_name: event.target.value })}
                placeholder="Nombre del cliente"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoice-nif">NIF / CIF</Label>
              <Input
                id="invoice-nif"
                value={form.client_nif}
                onChange={(event) => set({ client_nif: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoice-email">Email</Label>
              <Input
                id="invoice-email"
                type="email"
                value={form.client_email}
                onChange={(event) => set({ client_email: event.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="invoice-address">Dirección</Label>
              <Input
                id="invoice-address"
                value={form.client_address}
                onChange={(event) => set({ client_address: event.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Inmueble</Label>
              <Select value={form.property_id} onValueChange={handleProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Líneas de factura</Label>
            <InvoiceItemsEditor items={form.items} onChange={(items) => set({ items })} />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>IVA</Label>
              <Select value={String(form.vat_rate)} onValueChange={(value) => set({ vat_rate: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VAT_RATES.map((rate) => (
                    <SelectItem key={rate} value={String(rate)}>
                      {rate} %
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoice-irpf">Retención IRPF (%)</Label>
              <Input
                id="invoice-irpf"
                type="number"
                min="0"
                max="100"
                value={form.irpf_rate}
                onChange={(event) => set({ irpf_rate: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(value) => set({ status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUS_LIST.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoice-payment">Forma de pago</Label>
              <Input
                id="invoice-payment"
                value={form.payment_method}
                onChange={(event) => set({ payment_method: event.target.value })}
              />
            </div>
          </div>

          <div className="rounded-xl bg-muted/50 p-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Base imponible</span>
              <span className="tabular-nums">{formatMoney(totals.subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between text-muted-foreground">
              <span>IVA {Number(form.vat_rate) || 0} %</span>
              <span className="tabular-nums">{formatMoney(totals.vat_amount)}</span>
            </div>
            {totals.irpf_amount > 0 && (
              <div className="mt-1 flex justify-between text-muted-foreground">
                <span>Retención IRPF {Number(form.irpf_rate) || 0} %</span>
                <span className="tabular-nums">- {formatMoney(totals.irpf_amount)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-border/70 pt-2 font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(totals.total)}</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="invoice-nif-issuer">NIF / CIF del emisor</Label>
              <Input
                id="invoice-nif-issuer"
                value={form.issuer.nif}
                onChange={(event) => setIssuer({ nif: event.target.value })}
                placeholder="B-00000000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoice-address-issuer">Dirección fiscal del emisor</Label>
              <Input
                id="invoice-address-issuer"
                value={form.issuer.address}
                onChange={(event) => setIssuer({ address: event.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="invoice-notes">Notas para el cliente</Label>
              <Textarea
                id="invoice-notes"
                rows={2}
                value={form.notes}
                onChange={(event) => set({ notes: event.target.value })}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {invoice ? 'Guardar cambios' : 'Emitir factura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}