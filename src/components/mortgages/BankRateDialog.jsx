import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RATE_TYPE_LABELS } from '@/lib/mortgage';

const EMPTY = {
  bank: '',
  product: '',
  rate_type: 'fija',
  tin: '',
  tae: '',
  term_years: 30,
  max_financing: 80,
  opening_fee: '',
  link: '',
  notes: '',
};

export default function BankRateDialog({ open, onOpenChange, offer, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(
      offer
        ? {
            bank: offer.bank || '',
            product: offer.product || '',
            rate_type: offer.rate_type || 'fija',
            tin: offer.tin ?? '',
            tae: offer.tae ?? '',
            term_years: offer.term_years ?? 30,
            max_financing: offer.max_financing ?? 80,
            opening_fee: offer.opening_fee ?? '',
            link: offer.link || '',
            notes: offer.notes || '',
          }
        : EMPTY
    );
    setError('');
  }, [open, offer]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!form.bank.trim() || !form.product.trim() || form.tin === '') {
      setError('Entidad, producto y TIN son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        bank: form.bank.trim(),
        product: form.product.trim(),
        rate_type: form.rate_type,
        tin: Number(form.tin),
        tae: form.tae === '' ? null : Number(form.tae),
        term_years: Number(form.term_years) || null,
        max_financing: Number(form.max_financing) || null,
        opening_fee: form.opening_fee === '' ? null : Number(form.opening_fee),
        link: form.link.trim(),
        notes: form.notes.trim(),
        source: offer?.source || 'manual',
        active: true,
      };
      if (offer) {
        await base44.entities.BankRate.update(offer.id, payload);
      } else {
        await base44.entities.BankRate.create(payload);
      }
      onSaved?.();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la oferta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{offer ? 'Editar oferta' : 'Nueva oferta bancaria'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Entidad</Label>
              <Input value={form.bank} onChange={(event) => set('bank', event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Producto</Label>
              <Input value={form.product} onChange={(event) => set('product', event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de interés</Label>
              <Select value={form.rate_type} onValueChange={(value) => set('rate_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RATE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>TIN (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.tin}
                onChange={(event) => set('tin', event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>TAE (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.tae}
                onChange={(event) => set('tae', event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Plazo máximo (años)</Label>
              <Input
                type="number"
                value={form.term_years}
                onChange={(event) => set('term_years', event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Financiación máxima (%)</Label>
              <Input
                type="number"
                value={form.max_financing}
                onChange={(event) => set('max_financing', event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Comisión de apertura (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.opening_fee}
                onChange={(event) => set('opening_fee', event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Enlace oficial</Label>
            <Input value={form.link} onChange={(event) => set('link', event.target.value)} placeholder="https://" />
          </div>

          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea rows={3} value={form.notes} onChange={(event) => set('notes', event.target.value)} />
          </div>

          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}