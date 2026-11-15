import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

const emptyPartner = {
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  zone: '',
  commission_notes: '',
  notes: '',
  active: true,
  feed_url: '',
};

export default function MlsPartnerDialog({ open, partner, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(() => ({ ...emptyPartner, ...(partner || {}) }));
  const [saving, setSaving] = useState(false);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Indica el nombre de la agencia', variant: 'destructive' });
      return;
    }
    const payload = {
      name: form.name.trim(),
      contact_person: form.contact_person.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      zone: form.zone.trim(),
      commission_notes: form.commission_notes.trim(),
      notes: form.notes.trim(),
      active: form.active !== false,
      feed_url: form.feed_url.trim(),
    };
    setSaving(true);
    try {
      if (partner?.id) {
        await base44.entities.MlsPartner.update(partner.id, payload);
        toast({ title: 'Agencia actualizada' });
      } else {
        await base44.entities.MlsPartner.create(payload);
        toast({ title: 'Agencia añadida a la red' });
      }
      onOpenChange(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {partner?.id ? 'Editar agencia' : 'Añadir agencia a la red'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="partner-name">Agencia</Label>
              <Input id="partner-name" value={form.name} onChange={set('name')} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="partner-contact">Persona de contacto</Label>
              <Input id="partner-contact" value={form.contact_person} onChange={set('contact_person')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="partner-email">Email</Label>
              <Input id="partner-email" type="email" value={form.email} onChange={set('email')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="partner-phone">Teléfono</Label>
              <Input id="partner-phone" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="partner-zone">Zona de trabajo</Label>
              <Input id="partner-zone" value={form.zone} onChange={set('zone')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="partner-feed">Enlace de feed de la agencia</Label>
            <Input
              id="partner-feed"
              value={form.feed_url}
              onChange={set('feed_url')}
              placeholder="https://…/functions/mlsFeed?token=…"
            />
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              Pégalo para traer su cartera a tu bolsa con el botón de sincronizar.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="partner-commission">Acuerdo de colaboración</Label>
            <Textarea
              id="partner-commission"
              rows={2}
              value={form.commission_notes}
              onChange={set('commission_notes')}
              placeholder="Ej.: 50 % de la comisión, visitas compartidas, exclusivas cruzadas."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="partner-notes">Notas</Label>
            <Textarea id="partner-notes" rows={2} value={form.notes} onChange={set('notes')} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
            <span className="text-sm font-medium">Agencia activa en la red</span>
            <Switch
              checked={form.active !== false}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, active: checked }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}