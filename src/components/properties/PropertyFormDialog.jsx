import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  CONDITIONS,
  ENERGY_RATINGS,
  FEATURES,
  LEGAL_STATUS,
  OPERATIONS,
  PORTALS,
  PROPERTY_STATUS,
  PROPERTY_TYPES,
  legalStatusLabel,
  operationLabel,
  portalLabel,
  propertyStatusLabel,
  propertyTypeLabel,
} from '@/lib/properties';
import { MANDATE_TYPES } from '@/lib/mandates';
import MediaUploader from './MediaUploader';
import CatastroLookup from './CatastroLookup';

const EMPTY = {
  title: '',
  reference: '',
  cadastral_reference: '',
  operation: 'venta',
  property_type: 'piso',
  status: 'disponible',
  zone: '',
  address: '',
  price: '',
  surface: '',
  useful_surface: '',
  rooms: '',
  bathrooms: '',
  floor: '',
  year_built: '',
  condition: 'buen_estado',
  energy_rating: '',
  features: [],
  description: '',
  legal_status: 'nota_simple',
  legal_notes: '',
  ibi_annual: '',
  community_fees: '',
  commission_percent: '',
  commission_notes: '',
  exclusive: false,
  mandate_type: 'sin_mandato',
  mandate_start: '',
  mandate_end: '',
  owner_client_id: '',
  owner_name: '',
  owner_phone: '',
  photos: [],
  videos: [],
  floorplans: [],
  documents: [],
  published_portals: [],
  capture_date: '',
  notes: '',
};

const NUMERIC = ['price', 'surface', 'useful_surface', 'rooms', 'bathrooms', 'year_built', 'ibi_annual', 'community_fees', 'commission_percent'];

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </section>
  );
}

function Chips({ options, value, onToggle }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
              active
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function PropertyFormDialog({ open, onOpenChange, property, clients = [], onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setError('');
    if (property) {
      const base = { ...EMPTY };
      Object.keys(EMPTY).forEach((key) => {
        base[key] = property[key] ?? EMPTY[key];
      });
      NUMERIC.forEach((key) => {
        base[key] = property[key] ?? '';
      });
      base.capture_date = property.capture_date ? String(property.capture_date).slice(0, 10) : '';
      base.mandate_start = property.mandate_start ? String(property.mandate_start).slice(0, 10) : '';
      base.mandate_end = property.mandate_end ? String(property.mandate_end).slice(0, 10) : '';
      if (!property.mandate_type && property.exclusive) base.mandate_type = 'exclusiva';
      setForm(base);
    } else {
      setForm(EMPTY);
    }
  }, [open, property]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleIn = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((item) => item !== value) : [...prev[key], value],
    }));

  const handleOwner = (clientId) => {
    const client = clients.find((item) => item.id === clientId);
    setForm((prev) => ({
      ...prev,
      owner_client_id: clientId === 'none' ? '' : clientId,
      owner_name: client ? client.name : prev.owner_name,
      owner_phone: client ? client.phone || prev.owner_phone : prev.owner_phone,
    }));
  };

  const applyCatastro = (data) => {
    setForm((prev) => ({
      ...prev,
      cadastral_reference: data.rc,
      address: data.address || prev.address,
      zone: prev.zone || data.municipality || '',
      surface: data.surface ?? prev.surface,
      year_built: data.yearBuilt ?? prev.year_built,
      floor: data.floor || prev.floor,
      property_type: data.propertyType || prev.property_type,
    }));
    toast({
      title: 'Datos del Catastro aplicados',
      description: [data.rc, data.use, data.surface ? `${data.surface} m²` : ''].filter(Boolean).join(' · '),
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('El título del inmueble es obligatorio.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      title: form.title.trim(),
      reference: form.reference?.trim() || '',
      zone: form.zone?.trim() || '',
      address: form.address?.trim() || '',
      floor: form.floor?.trim() || '',
      description: form.description?.trim() || '',
      legal_notes: form.legal_notes?.trim() || '',
      commission_notes: form.commission_notes?.trim() || '',
      owner_name: form.owner_name?.trim() || '',
      owner_phone: form.owner_phone?.trim() || '',
      notes: form.notes?.trim() || '',
      energy_rating: form.energy_rating || undefined,
      exclusive: form.mandate_type === 'exclusiva',
      mandate_start: form.mandate_start || undefined,
      mandate_end: form.mandate_end || undefined,
      capture_date: form.capture_date || undefined,
      published_portals: form.published_portals,
    };
    NUMERIC.forEach((key) => {
      payload[key] = form[key] === '' ? 0 : Number(form[key]);
    });
    try {
      if (property?.id) {
        await base44.entities.Property.update(property.id, payload);
      } else {
        await base44.entities.Property.create(payload);
      }
      toast({ title: property?.id ? 'Inmueble actualizado' : 'Inmueble creado' });
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'No se pudo guardar el inmueble.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{property?.id ? 'Editar inmueble' : 'Nuevo inmueble'}</DialogTitle>
          <DialogDescription>Ficha completa: características, situación legal, honorarios y documentación.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <CatastroLookup onApply={applyCatastro} />

          <Section title="Datos del inmueble">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="p-title">Título *</Label>
                <Input
                  id="p-title"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Piso reformado con terraza en Estepona"
                />
              </div>
              <div>
                <Label htmlFor="p-ref">Referencia</Label>
                <Input id="p-ref" value={form.reference} onChange={(e) => set('reference', e.target.value)} placeholder="DL-0142" />
              </div>
              <div>
                <Label htmlFor="p-cadastral">Referencia catastral</Label>
                <Input
                  id="p-cadastral"
                  value={form.cadastral_reference}
                  onChange={(e) => set('cadastral_reference', e.target.value)}
                  placeholder="Se rellena al consultar el Catastro"
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <Label>Operación</Label>
                <Select value={form.operation} onValueChange={(value) => set('operation', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {operationLabel(option.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.property_type} onValueChange={(value) => set('property_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(value) => set('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_STATUS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {propertyStatusLabel(option.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          <Section title="Ubicación y precio">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="p-zone">Zona</Label>
                <Input id="p-zone" value={form.zone} onChange={(e) => set('zone', e.target.value)} placeholder="Estepona centro" />
              </div>
              <div>
                <Label htmlFor="p-address">Dirección</Label>
                <Input id="p-address" value={form.address} onChange={(e) => set('address', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-price">Precio (€)</Label>
                <Input id="p-price" type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-capture">Fecha de captación</Label>
                <Input id="p-capture" type="date" value={form.capture_date} onChange={(e) => set('capture_date', e.target.value)} />
              </div>
            </div>
          </Section>

          <Section title="Características">
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <Label htmlFor="p-surface">Superficie (m²)</Label>
                <Input id="p-surface" type="number" min="0" value={form.surface} onChange={(e) => set('surface', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-useful">Útil (m²)</Label>
                <Input id="p-useful" type="number" min="0" value={form.useful_surface} onChange={(e) => set('useful_surface', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-rooms">Habitaciones</Label>
                <Input id="p-rooms" type="number" min="0" value={form.rooms} onChange={(e) => set('rooms', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-baths">Baños</Label>
                <Input id="p-baths" type="number" min="0" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-floor">Planta</Label>
                <Input id="p-floor" value={form.floor} onChange={(e) => set('floor', e.target.value)} placeholder="3ª" />
              </div>
              <div>
                <Label htmlFor="p-year">Año</Label>
                <Input id="p-year" type="number" min="1800" value={form.year_built} onChange={(e) => set('year_built', e.target.value)} />
              </div>
              <div>
                <Label>Conservación</Label>
                <Select value={form.condition || 'buen_estado'} onValueChange={(value) => set('condition', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Energía</Label>
                <Select value={form.energy_rating || 'sin'} onValueChange={(value) => set('energy_rating', value === 'sin' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin">Sin certificado</SelectItem>
                    {ENERGY_RATINGS.map((rating) => (
                      <SelectItem key={rating} value={rating}>
                        {rating === 'en_tramite' ? 'En trámite' : rating}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Extras</Label>
              <div className="mt-1.5">
                <Chips options={FEATURES} value={form.features || []} onToggle={(value) => toggleIn('features', value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="p-desc">Descripción</Label>
              <Textarea id="p-desc" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
          </Section>

          <Section title="Situación legal y honorarios">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Situación legal</Label>
                <Select value={form.legal_status || 'nota_simple'} onValueChange={(value) => set('legal_status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEGAL_STATUS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {legalStatusLabel(option.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="p-ibi">IBI anual (€)</Label>
                <Input id="p-ibi" type="number" min="0" value={form.ibi_annual} onChange={(e) => set('ibi_annual', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-community">Comunidad (€/mes)</Label>
                <Input id="p-community" type="number" min="0" value={form.community_fees} onChange={(e) => set('community_fees', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-commission">Honorarios (%)</Label>
                <Input id="p-commission" type="number" min="0" step="0.1" value={form.commission_percent} onChange={(e) => set('commission_percent', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="p-commission-notes">Condiciones de honorarios</Label>
                <Input id="p-commission-notes" value={form.commission_notes} onChange={(e) => set('commission_notes', e.target.value)} placeholder="3 % + IVA a cargo del vendedor" />
              </div>
              <div className="sm:col-span-3">
                <Label htmlFor="p-legal-notes">Notas legales</Label>
                <Textarea id="p-legal-notes" rows={2} value={form.legal_notes} onChange={(e) => set('legal_notes', e.target.value)} />
              </div>
              <div className="sm:col-span-3">
                <Label>Mandato del propietario</Label>
                <div className="mt-1.5 grid gap-3 sm:grid-cols-3">
                  <Select value={form.mandate_type} onValueChange={(value) => set('mandate_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MANDATE_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={form.mandate_start}
                    onChange={(e) => set('mandate_start', e.target.value)}
                    aria-label="Fecha de firma del mandato"
                  />
                  <Input
                    type="date"
                    value={form.mandate_end}
                    onChange={(e) => set('mandate_end', e.target.value)}
                    aria-label="Fecha de vencimiento del mandato"
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Firma y vencimiento del encargo. Avísate 30 días antes desde Propietarios.</p>
              </div>
            </div>
          </Section>

          <Section title="Propietario">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Ficha de cliente</Label>
                <Select value={form.owner_client_id || 'none'} onValueChange={handleOwner}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin vincular" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin vincular</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="p-owner">Nombre del propietario</Label>
                <Input id="p-owner" value={form.owner_name} onChange={(e) => set('owner_name', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-owner-phone">Teléfono</Label>
                <Input id="p-owner-phone" value={form.owner_phone} onChange={(e) => set('owner_phone', e.target.value)} />
              </div>
            </div>
          </Section>

          <Section title="Fotos, vídeos y planos">
            <div className="grid gap-3 sm:grid-cols-2">
              <MediaUploader
                label="Fotos"
                value={form.photos || []}
                onChange={(value) => set('photos', value)}
                accept="image/*"
                buttonLabel="Añadir fotos"
              />
              <MediaUploader
                label="Vídeos"
                value={form.videos || []}
                onChange={(value) => set('videos', value)}
                accept="video/*"
                buttonLabel="Añadir vídeos"
              />
              <MediaUploader
                label="Planos"
                value={form.floorplans || []}
                onChange={(value) => set('floorplans', value)}
                accept="image/*,application/pdf"
                buttonLabel="Añadir planos"
              />
              <MediaUploader
                label="Documentos (nota simple, escritura, RGPD)"
                value={form.documents || []}
                onChange={(value) => set('documents', value)}
                isPrivate
                accept="application/pdf,image/*"
                buttonLabel="Añadir documentos"
              />
            </div>
          </Section>

          <Section title="Difusión en portales">
            <Chips
              options={PORTALS.map((portal) => portal.id)}
              value={form.published_portals || []}
              onToggle={(value) => toggleIn('published_portals', value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Marca los portales donde ya está publicado el inmueble: {PORTALS.map((p) => portalLabel(p.id)).join(', ')}.
            </p>
          </Section>

          <div>
            <Label htmlFor="p-notes">Notas internas</Label>
            <Textarea id="p-notes" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {property?.id ? 'Guardar cambios' : 'Crear inmueble'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}