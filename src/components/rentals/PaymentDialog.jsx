import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate, todayISO } from '@/lib/crm';
import { PAYMENT_METHODS } from '@/lib/rents';

export default function PaymentDialog({ open, payment, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ paid_date: '', paid_amount: '', method: 'transferencia', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !payment) return;
    setForm({
      paid_date: payment.paid_date || todayISO(),
      paid_amount: payment.paid_amount || payment.amount || '',
      method: payment.method || 'transferencia',
      notes: payment.notes || '',
    });
  }, [open, payment]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const save = async (event) => {
    event.preventDefault();
    const amount = Number(form.paid_amount);
    if (!form.paid_date || !amount) {
      toast({ title: 'Indica fecha e importe del cobro', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.RentPayment.update(payment.id, {
        status: 'cobrado',
        paid_date: form.paid_date,
        paid_amount: amount,
        method: form.method,
        notes: form.notes.trim(),
      });
      toast({ title: 'Cobro registrado' });
      onOpenChange(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const revert = async () => {
    setSaving(true);
    try {
      await base44.entities.RentPayment.update(payment.id, {
        status: 'pendiente',
        paid_date: '',
        paid_amount: 0,
        method: '',
      });
      toast({ title: 'Recibo devuelto a pendiente' });
      onOpenChange(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Cobro de renta</DialogTitle>
        </DialogHeader>

        <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
          <p className="font-heading text-sm font-semibold">{payment.tenant_name || 'Inquilino'}</p>
          <p className="text-xs text-muted-foreground">
            {payment.property_title || 'Sin inmueble'} · vence {formatDate(payment.due_date)} ·{' '}
            {formatCurrency(payment.amount)}
          </p>
        </div>

        <form onSubmit={save} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="paid-amount">Importe cobrado (€)</Label>
              <Input id="paid-amount" type="number" min="0" step="0.01" value={form.paid_amount} onChange={set('paid_amount')} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paid-date">Fecha de cobro</Label>
              <Input id="paid-date" type="date" value={form.paid_date} onChange={set('paid_date')} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Forma de cobro</Label>
            <Select value={form.method} onValueChange={(value) => setForm((prev) => ({ ...prev, method: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paid-notes">Notas</Label>
            <Textarea id="paid-notes" rows={2} value={form.notes} onChange={set('notes')} />
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {payment.status === 'cobrado' ? (
              <Button type="button" variant="ghost" className="text-destructive" onClick={revert} disabled={saving}>
                Marcar como pendiente
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Registrar cobro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}