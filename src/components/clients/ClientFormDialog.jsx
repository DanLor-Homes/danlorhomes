import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Upload, X, Loader2, Paperclip } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { PROPERTY_TYPES } from '@/lib/properties';
import { ruleForZone } from '@/lib/assignment';
import { cn } from '@/lib/utils';

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  web: '',
  contact_person: '',
  second_contact: '',
  notes: '',
  attachments: [],
  geographic_zone: '',
  employees_count: '',
  daily_property_search: false,
  operation_interest: 'venta',
  property_types: [],
  budget_min: '',
  budget_max: '',
  min_rooms: '',
  search_zones: '',
  assigned_to: '',
};

export default function ClientFormDialog({ open, onOpenChange, client, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rules, setRules] = useState([]);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    base44.entities.AssignmentRule.list({ sort: 'zone', limit: 100 }).then((res) => setRules(res.items || []));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      client
        ? {
            ...EMPTY,
            ...client,
            employees_count: client.employees_count ?? '',
            budget_min: client.budget_min ?? '',
            budget_max: client.budget_max ?? '',
            min_rooms: client.min_rooms ?? '',
            property_types: client.property_types || [],
          }
        : EMPTY
    );
  }, [open, client]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleType = (id) =>
    setForm((prev) => {
      const current = prev.property_types || [];
      return {
        ...prev,
        property_types: current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
      };
    });

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        uploaded.push({ name: file.name, file_uri });
      }
      setForm((prev) => ({ ...prev, attachments: [...(prev.attachments || []), ...uploaded] }));
    } catch (err) {
      setError('No se pudieron subir los adjuntos.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre del cliente es obligatorio.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      email: form.email?.trim() || '',
      phone: form.phone?.trim() || '',
      web: form.web?.trim() || '',
      contact_person: form.contact_person?.trim() || '',
      second_contact: form.second_contact?.trim() || '',
      notes: form.notes?.trim() || '',
      attachments: form.attachments || [],
      geographic_zone: form.geographic_zone?.trim() || '',
      employees_count: Number(form.employees_count) || 0,
      daily_property_search: Boolean(form.daily_property_search),
      operation_interest: form.operation_interest || 'venta',
      property_types: form.property_types || [],
      budget_min: Number(form.budget_min) || 0,
      budget_max: Number(form.budget_max) || 0,
      min_rooms: Number(form.min_rooms) || 0,
      search_zones: form.search_zones?.trim() || '',
      assigned_to: form.assigned_to?.trim() || '',
    };

    if (!payload.assigned_to) {
      const rule = ruleForZone(payload.geographic_zone, rules);
      if (rule) payload.assigned_to = rule.assignee;
    }

    try {
      if (client?.id) {
        await base44.entities.Client.update(client.id, payload);
      } else {
        await base44.entities.Client.create(payload);
      }
      toast({ title: client?.id ? 'Cliente actualizado' : 'Cliente creado' });
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'No se pudo guardar el cliente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{client?.id ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
          <DialogDescription>Ficha completa de la empresa o particular.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="c-name">Nombre *</Label>
              <Input id="c-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Inmobiliaria Sol y Mar" />
            </div>
            <div>
              <Label htmlFor="c-email">Email</Label>
              <Input id="c-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="contacto@empresa.com" />
            </div>
            <div>
              <Label htmlFor="c-phone">Teléfono</Label>
              <Input id="c-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+34 600 000 000" />
            </div>
            <div>
              <Label htmlFor="c-web">Web</Label>
              <Input id="c-web" value={form.web} onChange={(e) => set('web', e.target.value)} placeholder="https://" />
            </div>
            <div>
              <Label htmlFor="c-zone">Zona geográfica</Label>
              <Input id="c-zone" value={form.geographic_zone} onChange={(e) => set('geographic_zone', e.target.value)} placeholder="Costa del Sol" />
            </div>
            <div>
              <Label htmlFor="c-contact">Persona de contacto</Label>
              <Input id="c-contact" value={form.contact_person} onChange={(e) => set('contact_person', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="c-contact2">Segundo contacto</Label>
              <Input id="c-contact2" value={form.second_contact} onChange={(e) => set('second_contact', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="c-employees">Número de empleados</Label>
              <Input id="c-employees" type="number" min="0" value={form.employees_count} onChange={(e) => set('employees_count', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="c-assignee">Responsable asignado</Label>
              <Input
                id="c-assignee"
                value={form.assigned_to}
                onChange={(e) => set('assigned_to', e.target.value)}
                placeholder={ruleForZone(form.geographic_zone, rules)?.assignee || 'Se asigna por zona'}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium leading-tight">Búsqueda diaria de inmuebles</p>
                <p className="text-[11px] text-muted-foreground">En venta o alquiler</p>
              </div>
              <Switch checked={Boolean(form.daily_property_search)} onCheckedChange={(v) => set('daily_property_search', v)} />
            </div>
          </div>

          <div>
            <Label htmlFor="c-notes">Notas</Label>
            <Textarea id="c-notes" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Contexto, preferencias, historial…" />
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Perfil de búsqueda</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Con estos datos el CRM cruza automáticamente los inmuebles que encajan.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Busca</Label>
                <Select value={form.operation_interest || 'venta'} onValueChange={(value) => set('operation_interest', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venta">Comprar</SelectItem>
                    <SelectItem value="alquiler">Alquilar</SelectItem>
                    <SelectItem value="ambas">Ambas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="c-zones">Zonas de interés</Label>
                <Input
                  id="c-zones"
                  value={form.search_zones}
                  onChange={(e) => set('search_zones', e.target.value)}
                  placeholder="Estepona, Marbella"
                />
              </div>
              <div>
                <Label htmlFor="c-budget-min">Presupuesto mínimo (€)</Label>
                <Input
                  id="c-budget-min"
                  type="number"
                  min="0"
                  value={form.budget_min}
                  onChange={(e) => set('budget_min', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="c-budget-max">Presupuesto máximo (€)</Label>
                <Input
                  id="c-budget-max"
                  type="number"
                  min="0"
                  value={form.budget_max}
                  onChange={(e) => set('budget_max', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="c-rooms">Habitaciones mínimas</Label>
                <Input
                  id="c-rooms"
                  type="number"
                  min="0"
                  value={form.min_rooms}
                  onChange={(e) => set('min_rooms', e.target.value)}
                />
              </div>
            </div>
            <div className="mt-3">
              <Label>Tipos de inmueble</Label>
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
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <Label>Adjuntos</Label>
            <div className="mt-1.5 space-y-2">
              {(form.attachments || []).map((file, index) => (
                <div key={`${file.file_uri}-${index}`} className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => set('attachments', form.attachments.filter((_, i) => i !== index))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? 'Subiendo…' : 'Añadir documento'}
                <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || uploading}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {client?.id ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}