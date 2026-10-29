import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { INTERACTION_TYPES, toInputDate } from '@/lib/crm';
import { useToast } from '@/components/ui/use-toast';

export default function InteractionDialog({ open, onOpenChange, clients = [], defaultClientId, defaultDate, onSaved }) {
  const [form, setForm] = useState({ client_id: '', type: 'llamada', date: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm({
      client_id: defaultClientId || '',
      type: 'llamada',
      date: toInputDate(defaultDate || new Date().toISOString()),
      content: '',
    });
  }, [open, defaultClientId, defaultDate]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.client_id) {
      setError('Selecciona un cliente.');
      return;
    }
    if (!form.content.trim()) {
      setError('Escribe el contenido de la interacción.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await base44.entities.Interaction.create({
        client_id: form.client_id,
        type: form.type,
        date: new Date(form.date).toISOString(),
        content: form.content.trim(),
        source: 'manual',
      });
      toast({ title: 'Interacción registrada' });
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'No se pudo guardar la interacción.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva interacción</DialogTitle>
          <DialogDescription>Llamadas, emails, reuniones o visitas quedan en el histórico del cliente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Cliente</Label>
            <Select value={form.client_id} onValueChange={(v) => set('client_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un cliente" />
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERACTION_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="i-date">Fecha y hora</Label>
              <Input id="i-date" type="datetime-local" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="i-content">Contenido</Label>
            <Textarea id="i-content" rows={4} value={form.content} onChange={(e) => set('content', e.target.value)} placeholder="Resumen de la conversación, acuerdos…" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}