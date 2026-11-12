import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, Send } from 'lucide-react';

export default function SharedListingForm({ listing }) {
  const [form, setForm] = useState({
    agency: '',
    agent_name: '',
    email: '',
    phone: '',
    message: `Me interesa el inmueble «${listing.title}» de ${listing.agency}. ¿Hablamos de las condiciones de colaboración?`,
    website: '',
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.agency.trim() || (!form.email.trim() && !form.phone.trim())) {
      setError('Indica tu agencia y un email o teléfono de contacto.');
      return;
    }
    setSending(true);
    try {
      const response = await base44.functions.invoke('mlsShare', {
        action: 'interest',
        id: listing.id,
        agency: form.agency,
        agent_name: form.agent_name,
        email: form.email,
        phone: form.phone,
        message: form.message,
        website: form.website,
      });
      if (response.data?.error) {
        setError(response.data.error);
        return;
      }
      setSent(true);
    } catch {
      setError('No hemos podido enviar la solicitud. Inténtalo de nuevo en unos minutos.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/[0.08] p-4 text-sm">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          Solicitud enviada a {listing.agency}. Te contactarán con los datos que has dejado para coordinar la
          visita.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={form.website}
        onChange={set('website')}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="shared-agency">Tu agencia</Label>
          <Input id="shared-agency" value={form.agency} onChange={set('agency')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shared-agent">Persona de contacto</Label>
          <Input id="shared-agent" value={form.agent_name} onChange={set('agent_name')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shared-email">Email</Label>
          <Input id="shared-email" type="email" value={form.email} onChange={set('email')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shared-phone">Teléfono</Label>
          <Input id="shared-phone" value={form.phone} onChange={set('phone')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shared-message">Mensaje</Label>
        <Textarea id="shared-message" rows={3} value={form.message} onChange={set('message')} />
      </div>

      {error && <p className="text-xs font-medium text-destructive">{error}</p>}

      <Button type="submit" className="w-full gap-1.5" disabled={sending}>
        <Send className="h-3.5 w-3.5" /> {sending ? 'Enviando…' : 'Solicitar colaboración'}
      </Button>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Tus datos se envían solo a la agencia que comparte este inmueble.
      </p>
    </form>
  );
}