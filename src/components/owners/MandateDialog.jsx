import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { MANDATE_TYPES, mandateLabel } from '@/lib/mandates';

const EMPTY = {
  mandate_type: 'sin_mandato',
  mandate_start: '',
  mandate_end: '',
  commission_percent: '',
  owner_client_id: 'none',
  owner_name: '',
  owner_phone: '',
};

export default function MandateDialog({ open, onOpenChange, property, clients = [], onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !property) return;
    setError('');
    setForm({
      mandate_type: property.mandate_type || (property.exclusive ? 'exclusiva' : 'sin_mandato'),
      mandate_start: property.mandate_start ? String(property.mandate_start).slice(0, 10) : '',
      mandate_end: property.mandate_end ? String(property.mandate_end).slice(0, 10) : '',
      commission_percent: property.commission_percent ?? '',
      owner_client_id: property.owner_client_id || 'none',
      owner_name: property.owner_name || '',
      owner_phone: property.owner_phone || '',
    });
  }, [open, property]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickOwner = (clientId) => {
    const client = clients.find((item) => item.id === clientId);
    setForm((prev) => ({
      ...prev,
      owner_client_id: clientId,
      owner_name: client?.name || prev.owner_name,
      owner_phone: client?.phone || prev.owner_phone,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.mandate_type !== 'sin_mandato' && !form.mandate_end) {
      setError('Indica la fecha de vencimiento del mandato.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await base44.entities.Property.update(property.id, {
        mandate_type: form.mandate_type,
        mandate_start: form.mandate_start || undefined,
        mandate_end: form.mandate_end || undefined,
        exclusive: form.mandate_type === 'exclusiva',
        commission_percent: form.commission_percent === '' ? 0 : Number(form.commission_percent),
        owner_client_id: form.owner_client_id === 'none' ? '' : form.owner_client_id,
        owner_name: form.owner_name.trim(),
        owner_phone: form.owner_phone.trim(),
      });
      toast({ title: 'Mandato actualizado', description: mandateLabel(form.mandate_type) });
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'No se pudo guardar el mandato.');
    } finally {
      setSaving(false);
    }
  };

  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mandato del propietario</DialogTitle>
          <DialogDescription>
            {property.title}
            {property.reference ? ` · ${property.reference}` : ''}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Ficha de cliente del propietario</Label>
              <Select value={form.owner_client_id} onValueChange={pickOwner}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin vincular" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin vincular</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="m-owner">Nombre</Label>
              <Input id="m-owner" value={form.owner_name} onChange={(e) => set('owner_name', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="m-phone">Teléfono</Label>
              <Input id="m-phone" value={form.owner_phone} onChange={(e) => set('owner_phone', e.target.value)} />
            </div>
            <div>
              <Label>Tipo de mandato</Label>
              <Select value={form.mandate_type} onValueChange={(value) => set('mandate_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANDATE_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="m-commission">Honorarios (%)</Label>
              <Input
                id="m-commission"
                type="number"
                min="0"
                step="0.1"
                value={form.commission_percent}
                onChange={(e) => set('commission_percent', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="m-start">Firma</Label>
              <Input id="m-start" type="date" value={form.mandate_start} onChange={(e) => set('mandate_start', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="m-end">Vencimiento</Label>
              <Input id="m-end" type="date" value={form.mandate_end} onChange={(e) => set('mandate_end', e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar mandato
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}