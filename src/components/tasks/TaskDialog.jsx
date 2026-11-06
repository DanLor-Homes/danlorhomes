import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { todayISO } from '@/lib/crm';
import { DEFAULT_CATEGORY, TASK_CATEGORIES } from '@/lib/taskCategory';
import { useToast } from '@/components/ui/use-toast';

export default function TaskDialog({ open, onOpenChange, task, opportunities = [], onSaved }) {
  const [form, setForm] = useState({
    title: '',
    due_date: todayISO(),
    status: 'pendiente',
    category: DEFAULT_CATEGORY,
    opportunity_id: '',
    assignee: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      task
        ? {
            title: task.title || '',
            due_date: task.due_date || todayISO(),
            status: task.status || 'pendiente',
            category: task.category || DEFAULT_CATEGORY,
            opportunity_id: task.opportunity_id || '',
            assignee: task.assignee || '',
          }
        : {
            title: '',
            due_date: todayISO(),
            status: 'pendiente',
            category: DEFAULT_CATEGORY,
            opportunity_id: '',
            assignee: '',
          }
    );
  }, [open, task]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('El título es obligatorio.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      due_date: form.due_date || todayISO(),
      status: form.status,
      category: form.category || DEFAULT_CATEGORY,
      opportunity_id: form.opportunity_id || '',
      assignee: form.assignee?.trim() || '',
    };
    try {
      if (task?.id) {
        await base44.entities.CommercialTask.update(task.id, payload);
      } else {
        await base44.entities.CommercialTask.create({ ...payload, auto_generated: false });
      }
      toast({ title: task?.id ? 'Tarea actualizada' : 'Tarea creada' });
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'No se pudo guardar la tarea.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task?.id ? 'Editar tarea' : 'Nueva tarea'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="t-title">Título *</Label>
            <Input id="t-title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Llamar para confirmar la visita" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="t-date">Fecha límite</Label>
              <Input id="t-date" type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoría</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Oportunidad</Label>
              <Select value={form.opportunity_id} onValueChange={(v) => set('opportunity_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin vincular" />
                </SelectTrigger>
                <SelectContent>
                  {opportunities.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      {op.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="t-assignee">Responsable</Label>
              <Input id="t-assignee" value={form.assignee} onChange={(e) => set('assignee', e.target.value)} placeholder="Nombre o email" />
            </div>
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