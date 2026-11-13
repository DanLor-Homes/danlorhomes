import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { todayISO } from '@/lib/crm';
import { LEASE_STATUSES } from '@/lib/rents';

const emptyLease = {
  tenant_name: '',
  tenant_phone: '',
  tenant_email: '',
  property_id: '',
  property_title: '',
  monthly_rent: '',
  deposit: '',
  start_date: todayISO(),
  end_date: '',
  payment_day: '1',
  next_review_date: '',
  status: 'activo',
  notes: '',
};

export default function LeaseDialog({ open, lease, properties = [], onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyLease);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ ...emptyLease, ...(lease || {}) });
  }, [open, lease]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const pickProperty = (propertyId) => {
    const property = properties.find((item) => item.id === propertyId);
    setForm((prev) => ({
      ...prev,
      property_id: propertyId,
      property_title: property?.title || prev.property_title,
      monthly_rent: prev.monthly_rent || (property?.price ? String(property.price) : ''),
    }));
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.tenant_name.trim() || !Number(form.monthly_rent)) {
      toast({ title: 'Indica inquilino e importe de la renta', variant: 'destructive' });
      return;
    }
    const payload = {
      tenant_name: form.tenant_name.trim(),
      tenant_phone: form.tenant_phone.trim(),
      tenant_email: form.tenant_email.trim(),
      property_id: form.property_id,
      property_title: form.property_title.trim(),
      monthly_rent: Number(form.monthly_rent) || 0,
      deposit: Number(form.deposit) || 0,
      start_date: form.start_date || '',
      end_date: form.end_date || '',
      payment_day: Number(form.payment_day) || 1,
      next_review_date: form.next_review_date || '',
      status: form.status,
      notes: form.notes.trim(),
    };
    setSaving(true);
    try {
      if (lease?.id) {
        await base44.entities.Lease.update(lease.id, payload);
        toast({ title: 'Contrato actualizado' });
      } else {
        await base44.entities.Lease.create(payload);
        toast({ title: 'Contrato de alquiler creado' });
      }
      onOpenChange(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await base44.entities.RentPayment.deleteMany({ lease_id: lease.id });
      await base44.entities.Lease.delete(lease.id);
      toast({ title: 'Contrato eliminado' });
      onOpenChange(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {lease?.id ? 'Editar contrato de alquiler' : 'Nuevo contrato de alquiler'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={save} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lease-tenant">Inquilino</Label>
              <Input id="lease-tenant" value={form.tenant_name} onChange={set('tenant_name')} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lease-phone">Teléfono</Label>
              <Input id="lease-phone" value={form.tenant_phone} onChange={set('tenant_phone')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lease-email">Email</Label>
              <Input id="lease-email" type="email" value={form.tenant_email} onChange={set('tenant_email')} />
            </div>
            <div className="space-y-1.5">
              <Label>Inmueble de la cartera</Label>
              <Select value={form.property_id || undefined} onValueChange={pickProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un inmueble" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title}
                      {property.zone ? ` · ${property.zone}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lease-property">Inmueble alquilado</Label>
              <Input
                id="lease-property"
                value={form.property_title}
                onChange={set('property_title')}
                placeholder="Dirección o referencia del inmueble"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lease-rent">Renta mensual (€)</Label>
              <Input id="lease-rent" type="number" min="0" step="0.01" value={form.monthly_rent} onChange={set('monthly_rent')} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lease-deposit">Fianza (€)</Label>
              <Input id="lease-deposit" type="number" min="0" step="0.01" value={form.deposit} onChange={set('deposit')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lease-start">Inicio del contrato</Label>
              <Input id="lease-start" type="date" value={form.start_date} onChange={set('start_date')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lease-end">Fin del contrato</Label>
              <Input id="lease-end" type="date" value={form.end_date} onChange={set('end_date')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lease-day">Día de cobro</Label>
              <Input id="lease-day" type="number" min="1" max="31" value={form.payment_day} onChange={set('payment_day')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lease-review">Próxima revisión (IPC)</Label>
              <Input id="lease-review" type="date" value={form.next_review_date} onChange={set('next_review_date')} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {LEASE_STATUSES.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lease-notes">Notas</Label>
              <Textarea id="lease-notes" rows={2} value={form.notes} onChange={set('notes')} />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {lease?.id ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" className="text-destructive" disabled={saving}>
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar el contrato?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se eliminarán también los recibos de renta generados para este contrato.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={remove}>Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : lease?.id ? 'Guardar cambios' : 'Crear contrato'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}