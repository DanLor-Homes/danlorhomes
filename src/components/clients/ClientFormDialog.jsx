import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Upload, X, Loader2, Paperclip } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

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
};

export default function ClientFormDialog({ open, onOpenChange, client, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(client ? { ...EMPTY, ...client, employees_count: client.employees_count ?? '' } : EMPTY);
  }, [open, client]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

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
    };
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