import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { OPERATIONS, PROPERTY_TYPES } from '@/lib/properties';
import { DEFAULT_AGENCY, MLS_STATUSES } from '@/lib/mls';

const NONE = 'none';

const emptyForm = (user) => ({
  property_id: '',
  agency: DEFAULT_AGENCY,
  agent_name: user?.full_name || '',
  agent_email: user?.email || '',
  agent_phone: '',
  title: '',
  reference: '',
  operation: 'venta',
  property_type: 'piso',
  zone: '',
  municipality: '',
  price: '',
  surface: '',
  rooms: '',
  bathrooms: '',
  description: '',
  commission_percent: '',
  commission_notes: '',
  status: 'disponible',
});

export default function MlsPublishDialog({ open, onOpenChange, onSaved, user }) {
  const { toast } = useToast();
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState(() => emptyForm(user));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm(user));
    base44.entities.Property
      .list({ sort: '-created_date', limit: 200 })
      .then((page) => setProperties(page.items || []));
  }, [open, user]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const pickProperty = (value) => {
    if (value === NONE) {
      setForm((prev) => ({ ...prev, property_id: '' }));
      return;
    }
    const property = properties.find((item) => item.id === value);
    if (!property) return;
    setForm((prev) => ({
      ...prev,
      property_id: property.id,
      title: property.title || '',
      reference: property.reference || '',
      operation: property.operation || 'venta',
      property_type: property.property_type || 'piso',
      zone: property.zone || '',
      municipality: property.municipality || '',
      price: property.price ?? '',
      surface: property.surface ?? '',
      rooms: property.rooms ?? '',
      bathrooms: property.bathrooms ?? '',
      description: property.description || '',
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.agency.trim()) {
      toast({ title: 'Indica el título del inmueble y la agencia', variant: 'destructive' });
      return;
    }
    const property = properties.find((item) => item.id === form.property_id);
    const photos = (property?.photos || [])
      .filter((photo) => photo?.file_url)
      .map((photo) => ({ name: photo.name || 'Foto', file_url: photo.file_url }));

    setSaving(true);
    try {
      await base44.entities.MlsListing.create({
        title: form.title.trim(),
        reference: form.reference.trim(),
        property_id: form.property_id,
        agency: form.agency.trim(),
        agent_name: form.agent_name.trim(),
        agent_email: form.agent_email.trim(),
        agent_phone: form.agent_phone.trim(),
        origin: form.property_id ? 'propia' : 'red',
        operation: form.operation,
        property_type: form.property_type,
        zone: form.zone.trim(),
        municipality: form.municipality.trim(),
        price: form.price === '' ? undefined : Number(form.price),
        surface: form.surface === '' ? undefined : Number(form.surface),
        rooms: form.rooms === '' ? undefined : Number(form.rooms),
        bathrooms: form.bathrooms === '' ? undefined : Number(form.bathrooms),
        description: form.description.trim(),
        photos,
        commission_percent:
          form.commission_percent === '' ? undefined : Number(form.commission_percent),
        commission_notes: form.commission_notes.trim(),
        status: form.status,
        published_date: new Date().toISOString(),
      });
      toast({ title: 'Inmueble compartido en la bolsa' });
      onOpenChange(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Compartir inmueble en la bolsa</DialogTitle>
          <DialogDescription>
            Publica un inmueble de tu cartera o da de alta uno que te haya pasado otra agencia. Solo lo verán
            los usuarios de tu red.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Inmueble de mi cartera</Label>
            <Select value={form.property_id || NONE} onValueChange={pickProperty}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un inmueble" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Alta manual (inmueble de otra agencia)</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title} {property.zone ? `· ${property.zone}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.property_id && (
              <p className="text-[11px] text-muted-foreground">
                Los datos y las fotos del inmueble se copian automáticamente a la bolsa.
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="mls-title">Título</Label>
              <Input id="mls-title" value={form.title} onChange={set('title')} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mls-agency-pub">Agencia que comparte</Label>
              <Input id="mls-agency-pub" value={form.agency} onChange={set('agency')} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mls-ref">Referencia</Label>
              <Input id="mls-ref" value={form.reference} onChange={set('reference')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mls-agent-pub">Persona de contacto</Label>
              <Input id="mls-agent-pub" value={form.agent_name} onChange={set('agent_name')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mls-phone-pub">Teléfono de contacto</Label>
              <Input id="mls-phone-pub" value={form.agent_phone} onChange={set('agent_phone')} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="mls-email-pub">Email de contacto</Label>
              <Input id="mls-email-pub" type="email" value={form.agent_email} onChange={set('agent_email')} />
            </div>
            <div className="space-y-1.5">
              <Label>Operación</Label>
              <Select value={form.operation} onValueChange={(value) => setForm({ ...form, operation: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATIONS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de inmueble</Label>
              <Select
                value={form.property_type}
                onValueChange={(value) => setForm({ ...form, property_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mls-zone">Zona</Label>
              <Input id="mls-zone" value={form.zone} onChange={set('zone')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mls-muni">Municipio</Label>
              <Input id="mls-muni" value={form.municipality} onChange={set('municipality')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mls-price">Precio (€)</Label>
              <Input id="mls-price" type="number" value={form.price} onChange={set('price')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mls-surface">Superficie (m²)</Label>
              <Input id="mls-surface" type="number" value={form.surface} onChange={set('surface')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mls-rooms">Habitaciones</Label>
              <Input id="mls-rooms" type="number" value={form.rooms} onChange={set('rooms')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mls-baths">Baños</Label>
              <Input id="mls-baths" type="number" value={form.bathrooms} onChange={set('bathrooms')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mls-commission">Honorarios compartidos (%)</Label>
              <Input
                id="mls-commission"
                type="number"
                step="0.1"
                value={form.commission_percent}
                onChange={set('commission_percent')}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estado en la bolsa</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MLS_STATUSES.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mls-commission-notes">Condiciones de colaboración</Label>
            <Textarea
              id="mls-commission-notes"
              rows={2}
              value={form.commission_notes}
              onChange={set('commission_notes')}
              placeholder="Ej.: 50/50 de la comisión total, visitas coordinadas por la agencia titular."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mls-desc">Descripción</Label>
            <Textarea id="mls-desc" rows={3} value={form.description} onChange={set('description')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Compartiendo…' : 'Compartir en la bolsa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}