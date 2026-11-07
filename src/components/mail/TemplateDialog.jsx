import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TEMPLATE_CATEGORIES } from '@/lib/mail';

const EMPTY = { name: '', category: 'seguimiento', subject: '', body: '' };

export default function TemplateDialog({ open, onOpenChange, template, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(
      template
        ? {
            name: template.name || '',
            category: template.category || 'seguimiento',
            subject: template.subject || '',
            body: template.body || '',
          }
        : EMPTY
    );
    setError('');
  }, [open, template]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      setError('Nombre, asunto y mensaje son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        subject: form.subject.trim(),
        body: form.body.trim(),
      };
      if (template) {
        await base44.entities.EmailTemplate.update(template.id, payload);
      } else {
        await base44.entities.EmailTemplate.create({ ...payload, active: true });
      }
      onSaved?.();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la plantilla.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{template ? 'Editar plantilla' : 'Nueva plantilla'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(event) => set('name', event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select value={form.category} onValueChange={(value) => set('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPLATE_CATEGORIES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Asunto</Label>
            <Input value={form.subject} onChange={(event) => set('subject', event.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Mensaje</Label>
            <Textarea rows={9} value={form.body} onChange={(event) => set('body', event.target.value)} />
            <p className="text-[11px] text-muted-foreground">
              Usa {'{{nombre}}'}, {'{{telefono}}'} o {'{{zona}}'} y se rellenarán con los datos del cliente.
            </p>
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