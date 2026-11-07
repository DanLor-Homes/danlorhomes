import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { CONDITIONS, OPERATIONS, PROPERTY_TYPES, operationLabel } from '@/lib/properties';

const EMPTY = {
  title: '',
  municipality: '',
  province: '',
  property_type: 'piso',
  operation: 'venta',
  price: '',
  surface: '',
  condition: 'buen_estado',
  year_built: '',
  source_url: '',
  notes: '',
};

export default function ComparableDialog({ open, onOpenChange, defaults, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm({ ...EMPTY, ...(defaults || {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !Number(form.price) || !Number(form.surface)) {
      setError('Indica el título, el precio y la superficie del testigo.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await base44.entities.ValuationComparable.create({
        title: form.title.trim(),
        municipality: form.municipality.trim(),
        province: form.province.trim(),
        zone: form.municipality.trim(),
        property_type: form.property_type,
        operation: form.operation,
        price: Number(form.price),
        surface: Number(form.surface),
        condition: form.condition,
        year_built: Number(form.year_built) || undefined,
        source_url: form.source_url.trim(),
        notes: form.notes.trim(),
      });
      onSaved(created);
      toast({ title: 'Testigo añadido', description: created.title });
      onOpenChange(false);
    } catch (err) {
      setError(err?.message || 'No se pudo guardar el testigo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nuevo testigo de mercado</DialogTitle>
          <DialogDescription>
            Un anuncio comparable de la zona (portal, otra agencia o una operación conocida). Se usa para valorar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="c-title">Título o dirección *</Label>
            <Input
              id="c-title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Piso 3 dorm. en Av. España"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="c-town">Municipio</Label>
              <Input id="c-town" value={form.municipality} onChange={(e) => set('municipality', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="c-province">Provincia</Label>
              <Input id="c-province" value={form.province} onChange={(e) => set('province', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="c-price">Precio (€) *</Label>
              <Input
                id="c-price"
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="c-surface">Superficie (m²) *</Label>
              <Input
                id="c-surface"
                type="number"
                min="0"
                value={form.surface}
                onChange={(e) => set('surface', e.target.value)}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.property_type} onValueChange={(next) => set('property_type', next)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Operación</Label>
              <Select value={form.operation} onValueChange={(next) => set('operation', next)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {operationLabel(option.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.condition} onValueChange={(next) => set('condition', next)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="c-year">Año de construcción</Label>
              <Input
                id="c-year"
                type="number"
                min="1800"
                value={form.year_built}
                onChange={(e) => set('year_built', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="c-url">Enlace del anuncio</Label>
            <Input id="c-url" value={form.source_url} onChange={(e) => set('source_url', e.target.value)} placeholder="https://" />
          </div>
          <div>
            <Label htmlFor="c-notes">Notas</Label>
            <Textarea id="c-notes" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Añadir testigo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}