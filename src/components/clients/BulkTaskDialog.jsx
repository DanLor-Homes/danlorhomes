import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { todayISO } from '@/lib/crm';

export default function BulkTaskDialog({ open, onOpenChange, clients, onDone }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(todayISO());
  const [assignee, setAssignee] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setTitle('');
      setDueDate(todayISO());
      setAssignee('');
      setError('');
    }
  }, [open]);

  const submit = async () => {
    if (!title.trim() || !dueDate) {
      setError('Indica un título y una fecha límite.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const tasks = clients.map((client) => ({
        title: title.trim(),
        due_date: dueDate,
        assignee: assignee.trim() || client.assigned_to || '',
        client_id: client.id,
        status: 'pendiente',
      }));
      await base44.entities.CommercialTask.bulkCreate(tasks);
      toast({ title: 'Tareas creadas', description: `${tasks.length} tareas asignadas` });
      onOpenChange(false);
      onDone?.();
    } catch (err) {
      setError(err.message || 'No se han podido crear las tareas.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar tarea a {clients.length} clientes</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Título de la tarea</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Llamar para seguimiento" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Fecha límite</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Responsable</Label>
              <Input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Se creará una tarea por cliente. Si no indicas responsable, se usará el asignado de cada ficha.
          </p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Creando…' : 'Crear tareas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}