import React, { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PROPERTY_TYPES } from '@/lib/properties';
import { cn } from '@/lib/utils';

const EMPTY = {
  name: '',
  phone: '',
  email: '',
  operation: 'venta',
  zone: '',
  budget: '',
  notes: '',
  property_types: [],
  consent: false,
};

const OPERATIONS = [
  { id: 'venta', label: 'Comprar' },
  { id: 'alquiler', label: 'Alquilar' },
  { id: 'ambas', label: 'Ambas' },
];

export default function LeadCaptureForm() {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleType = (id) => {
    const current = form.property_types;
    set('property_types', current.includes(id) ? current.filter((i) => i !== id) : [...current, id]);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.phone.trim() && !form.email.trim()) {
      setError('Añade un teléfono o un email para que podamos contactarte.');
      return;
    }
    setSending(true);
    try {
      const response = await base44.functions.invoke('publicLeadIntake', {
        ...form,
        budget: form.budget === '' ? undefined : Number(form.budget),
        website: '',
      });
      if (response.data?.error) throw new Error(response.data.error);
      setDone(true);
      setForm(EMPTY);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'No se pudo enviar. Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-border/70 bg-card px-6 py-14 text-center shadow-2xl shadow-primary/5">
        <CheckCircle2 className="h-12 w-12 text-primary" />
        <h2 className="mt-4 font-heading text-xl font-bold">Solicitud recibida</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Gracias por escribirnos. Un asesor de DAN&LOR revisará tu búsqueda y te contactará en menos de 24 horas laborables.
        </p>
        <Button variant="outline" className="mt-6 rounded-full" onClick={() => setDone(false)}>
          Enviar otra solicitud
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-border/70 bg-card p-5 shadow-2xl shadow-primary/5 sm:p-7"
    >
      <h2 className="font-heading text-lg font-bold">Cuéntanos qué buscas</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Sin compromiso. Te respondemos con inmuebles que encajen con tu perfil.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <Label htmlFor="capta-name">Nombre y apellidos *</Label>
          <Input
            id="capta-name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Nombre"
            required
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="capta-phone">Teléfono *</Label>
            <Input
              id="capta-phone"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="600 000 000"
            />
          </div>
          <div>
            <Label htmlFor="capta-email">Email</Label>
            <Input
              id="capta-email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="nombre@email.com"
            />
          </div>
        </div>

        <div>
          <Label>¿Qué quieres hacer?</Label>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {OPERATIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => set('operation', option.id)}
                className={cn(
                  'rounded-xl border px-2 py-2 text-xs font-semibold transition-colors',
                  form.operation === option.id
                    ? 'border-primary/60 bg-primary/15 text-primary'
                    : 'border-border/70 text-muted-foreground hover:bg-accent/60'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="capta-zone">Zona de interés</Label>
            <Input
              id="capta-zone"
              value={form.zone}
              onChange={(e) => set('zone', e.target.value)}
              placeholder="Centro, Ensanche…"
            />
          </div>
          <div>
            <Label htmlFor="capta-budget">Presupuesto máximo (€)</Label>
            <Input
              id="capta-budget"
              type="number"
              min="0"
              value={form.budget}
              onChange={(e) => set('budget', e.target.value)}
              placeholder="250000"
            />
          </div>
        </div>

        <div>
          <Label>Tipo de inmueble</Label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {PROPERTY_TYPES.map((type) => {
              const active = form.property_types.includes(type.id);
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => toggleType(type.id)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                    active
                      ? 'border-primary/60 bg-primary/15 text-primary'
                      : 'border-border/70 text-muted-foreground hover:bg-accent/60'
                  )}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label htmlFor="capta-notes">Comentarios</Label>
          <Textarea
            id="capta-notes"
            rows={3}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Habitaciones, urgencia, detalles que debamos saber…"
          />
        </div>

        <input
          type="text"
          name="website"
          value=""
          onChange={() => {}}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />

        <label className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => set('consent', e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-input accent-primary"
          />
          Acepto que DAN&LOR trate mis datos para gestionar mi consulta inmobiliaria y contactarme.
        </label>

        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full rounded-full" size="lg" disabled={sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Enviar solicitud
        </Button>
      </div>
    </form>
  );
}