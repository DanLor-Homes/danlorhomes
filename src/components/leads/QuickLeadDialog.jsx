import React, { useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { PROPERTY_TYPES } from '@/lib/properties';
import { ruleForZone } from '@/lib/assignment';
import { todayISO } from '@/lib/crm';
import { cn } from '@/lib/utils';

const EMPTY = {
  name: '',
  phone: '',
  email: '',
  operation_interest: 'venta',
  search_zones: '',
  budget_max: '',
  notes: '',
  property_types: [],
};

export default function QuickLeadDialog({ open, onOpenChange, onCreated }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleType = (id) => {
    const current = form.property_types || [];
    set(
      'property_types',
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const close = (next) => {
    onOpenChange(next);
    if (!next) setForm(EMPTY);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Falta el nombre', description: 'Necesitamos al menos el nombre del lead.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const rules = await base44.entities.AssignmentRule.list();
      const rule = ruleForZone(form.search_zones, rules || []);
      const client = await base44.entities.Client.create({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        operation_interest: form.operation_interest,
        search_zones: form.search_zones.trim(),
        budget_max: form.budget_max === '' ? undefined : Number(form.budget_max),
        property_types: form.property_types,
        notes: form.notes.trim(),
        assigned_to: rule?.assignee || '',
      });
      await base44.entities.CommercialTask.create({
        title: `Primer contacto con ${client.name}`,
        due_date: todayISO(),
        assignee: rule?.assignee || '',
        auto_generated: true,
      });
      toast({
        title: 'Lead dado de alta',
        description: rule
          ? `Asignado a ${rule.assignee} con tarea de primer contacto para hoy.`
          : 'Sin regla de zona: añade una en Ajustes para asignarlo automáticamente.',
      });
      close(false);
      onCreated?.(client);
    } catch (error) {
      toast({ title: 'No se pudo crear el lead', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Alta rápida de lead
          </DialogTitle>
          <DialogDescription>
            Registra la consulta en segundos: se asigna por zona y genera la tarea de primer contacto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="lead-name">Nombre *</Label>
              <Input
                id="lead-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Nombre o empresa"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="lead-phone">Teléfono</Label>
              <Input
                id="lead-phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="600 000 000"
              />
            </div>
            <div>
              <Label htmlFor="lead-email">Email</Label>
              <Input
                id="lead-email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="nombre@email.com"
              />
            </div>
            <div>
              <Label htmlFor="lead-operation">Busca</Label>
              <select
                id="lead-operation"
                value={form.operation_interest}
                onChange={(e) => set('operation_interest', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="venta">Compra</option>
                <option value="alquiler">Alquiler</option>
                <option value="ambas">Ambas</option>
              </select>
            </div>
            <div>
              <Label htmlFor="lead-budget">Presupuesto máximo (€)</Label>
              <Input
                id="lead-budget"
                type="number"
                value={form.budget_max}
                onChange={(e) => set('budget_max', e.target.value)}
                placeholder="250000"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="lead-zone">Zona de interés</Label>
              <Input
                id="lead-zone"
                value={form.search_zones}
                onChange={(e) => set('search_zones', e.target.value)}
                placeholder="Centro, Ensanche…"
              />
            </div>
          </div>

          <div>
            <Label>Tipo de inmueble</Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {PROPERTY_TYPES.map((type) => {
                const active = (form.property_types || []).includes(type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => toggleType(type.id)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                      active
                        ? 'border-primary/50 bg-primary/15 text-primary'
                        : 'border-border/70 text-muted-foreground hover:bg-accent/60'
                    )}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="lead-notes">Notas</Label>
            <Textarea
              id="lead-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Qué busca, urgencia, cómo llegó…"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => close(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Crear lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}