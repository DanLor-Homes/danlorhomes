import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { OPERATIONS, PORTALS, PROPERTY_TYPES } from '@/lib/portals';

const EMPTY = {
  label: '',
  portal: 'idealista',
  zone: '',
  operation: 'venta',
  property_type: 'cualquiera',
  portal_url: '',
  budget_max: '',
};

export default function SourceDialog({ open, onOpenChange, source, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      source
        ? {
            label: source.label || '',
            portal: source.portal || 'idealista',
            zone: source.zone || '',
            operation: source.operation || 'venta',
            property_type: source.property_type || 'cualquiera',
            portal_url: source.portal_url || '',
            budget_max: source.budget_max ? String(source.budget_max) : '',
          }
        : EMPTY
    );
  }, [open, source]);

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.label.trim() || !form.zone.trim()) {
      toast({
        title: 'Faltan datos',
        description: 'Indica un nombre para la búsqueda y la zona.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        label: form.label.trim(),
        portal: form.portal,
        zone: form.zone.trim(),
        operation: form.operation,
        property_type: form.property_type,
        portal_url: form.portal_url.trim(),
        budget_max: form.budget_max ? Number(form.budget_max) : undefined,
      };

      if (source) await base44.entities.PortalSource.update(source.id, payload);
      else await base44.entities.PortalSource.create({ ...payload, active: true, last_result_count: 0 });

      toast({
        title: source ? 'Búsqueda actualizada' : 'Búsqueda creada',
        description: 'Puedes revisarla cuando quieras con «Revisar ahora».',
      });
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      toast({ title: 'No se pudo guardar', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{source ? 'Editar búsqueda' : 'Nueva búsqueda de portal'}</DialogTitle>
          <DialogDescription>
            Define portal, zona y operación: cada revisión buscará los inmuebles publicados más recientes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="s-label">Nombre</Label>
            <Input
              id="s-label"
              value={form.label}
              onChange={(event) => set('label')(event.target.value)}
              placeholder="Idealista · Marbella venta"
            />
          </div>

          <div>
            <Label>Portal</Label>
            <Select value={form.portal} onValueChange={set('portal')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PORTALS.map((portal) => (
                  <SelectItem key={portal.id} value={portal.id}>
                    {portal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Operación</Label>
            <Select value={form.operation} onValueChange={set('operation')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATIONS.map((operation) => (
                  <SelectItem key={operation.id} value={operation.id}>
                    {operation.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="s-zone">Zona</Label>
            <Input
              id="s-zone"
              value={form.zone}
              onChange={(event) => set('zone')(event.target.value)}
              placeholder="Marbella, Estepona…"
            />
          </div>

          <div>
            <Label>Tipo de inmueble</Label>
            <Select value={form.property_type} onValueChange={set('property_type')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="s-budget">Presupuesto máximo (€)</Label>
            <Input
              id="s-budget"
              type="number"
              value={form.budget_max}
              onChange={(event) => set('budget_max')(event.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div>
            <Label htmlFor="s-url">URL de la búsqueda</Label>
            <Input
              id="s-url"
              value={form.portal_url}
              onChange={(event) => set('portal_url')(event.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}