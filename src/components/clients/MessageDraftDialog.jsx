import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

const TONES = [
  { value: 'cercano', label: 'Cercano' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'breve', label: 'Breve' },
];

export default function MessageDraftDialog({ client, open, onOpenChange }) {
  const { toast } = useToast();
  const [channel, setChannel] = useState('email');
  const [tone, setTone] = useState('cercano');
  const [objective, setObjective] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSubject('');
    setBody('');
    setError('');
  }, [open]);

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await base44.functions.invoke('draftMessage', {
        clientId: client.id,
        channel,
        tone,
        objective,
      });
      setSubject(response.data?.subject || '');
      setBody(response.data?.body || '');
    } catch {
      setError('No se ha podido generar el borrador ahora mismo. Inténtalo de nuevo en unos minutos.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    const text = subject ? `${subject}\n\n${body}` : body;
    await navigator.clipboard.writeText(text);
    toast({ title: 'Borrador copiado' });
  };

  const phoneDigits = (client?.phone || '').replace(/\D/g, '');
  const mailto =
    channel === 'email' && client?.email
      ? `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      : '';
  const whatsappUrl = channel === 'whatsapp' && phoneDigits.length >= 9 ? `https://wa.me/${phoneDigits}` : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="font-heading">Borrador con IA</DialogTitle>
          <DialogDescription>
            Redactado con el historial y el pipeline de {client?.name}. Revísalo antes de enviarlo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {CHANNELS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setChannel(item.value)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  channel === item.value
                    ? 'border-primary/50 bg-primary/10 text-foreground'
                    : 'border-border/70 bg-background/40 text-muted-foreground hover:border-primary/30'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Tono</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="draft-objective" className="text-xs">
                Objetivo
              </Label>
              <Input
                id="draft-objective"
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
                placeholder="Ej. retomar contacto"
                maxLength={400}
              />
            </div>
          </div>

          <Button onClick={generate} disabled={busy} className="w-full">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {busy ? 'Redactando…' : 'Generar borrador'}
          </Button>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {(subject || body) && (
            <div className="space-y-2">
              {channel === 'email' && (
                <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Asunto" />
              )}
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={9}
                className="resize-none text-sm leading-relaxed"
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={copy}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar
                </Button>
                {mailto && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={mailto}>Abrir en el correo</a>
                  </Button>
                )}
                {whatsappUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={whatsappUrl} target="_blank" rel="noreferrer">
                      Abrir WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}