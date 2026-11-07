import React, { useEffect, useState } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import WhatsAppHistory from '@/components/mail/WhatsAppHistory';
import { applyTemplate } from '@/lib/mail';
import { whatsappLink } from '@/lib/portals';

export default function WhatsAppPanel({ clients, templates, messages, loading, onChanged }) {
  const [clientId, setClientId] = useState('');
  const [phone, setPhone] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const client = clients.find((item) => item.id === clientId) || null;

  useEffect(() => {
    setPhone(client?.phone || '');
  }, [clientId, client?.phone]);

  const useTemplate = (templateId) => {
    const template = templates.find((item) => item.id === templateId);
    if (template) setText(applyTemplate(template.body, client));
  };

  const openChat = async () => {
    if (!client) {
      setError('Elige el cliente al que quieres escribir.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 9) {
      setError('Revisa el teléfono: faltan dígitos.');
      return;
    }
    if (!text.trim()) {
      setError('Escribe el mensaje que quieres enviar.');
      return;
    }

    setError('');
    setBusy(true);
    window.open(whatsappLink(phone, text.trim()), '_blank', 'noopener');

    try {
      await base44.entities.Interaction.create({
        client_id: client.id,
        type: 'whatsapp',
        date: new Date().toISOString(),
        content: text.trim(),
        source: 'whatsapp',
      });
      toast({ title: 'WhatsApp abierto', description: `Mensaje a ${client.name} registrado en el historial.` });
      setText('');
      onChanged?.();
    } catch (err) {
      setError(err?.message || 'Se abrió WhatsApp, pero no se pudo registrar en el historial.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="font-heading text-sm font-bold">Nuevo mensaje</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Se abre WhatsApp con el texto ya escrito; tú solo pulsas enviar. El mensaje queda registrado en la ficha del
          cliente.
        </p>

        <div className="mt-3 space-y-3">
          <div>
            <Label>Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Elige un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="wa-phone">Teléfono</Label>
            <Input
              id="wa-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+34 600 000 000"
            />
            {client && !client.phone && (
              <p className="mt-1 text-[11px] text-amber-600">Este cliente no tiene teléfono guardado: escríbelo aquí.</p>
            )}
          </div>

          <div>
            <Label>Plantilla</Label>
            <Select onValueChange={useTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Usar una plantilla (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="wa-text">Mensaje</Label>
            <Textarea
              id="wa-text"
              rows={7}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Hola {{nombre}}, te escribo sobre la visita del jueves…"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Variables: {'{{nombre}}'}, {'{{telefono}}'}, {'{{zona}}'}
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" onClick={openChat} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
            Abrir WhatsApp
          </Button>
        </div>
      </div>

      <WhatsAppHistory messages={messages} loading={loading} />
    </div>
  );
}