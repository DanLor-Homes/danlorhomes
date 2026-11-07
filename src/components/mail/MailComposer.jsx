import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { applyTemplate, TEMPLATE_CATEGORIES } from '@/lib/mail';

export default function MailComposer({ open, onOpenChange, clients, templates, initialClientId, initialDraft, onSent }) {
  const [clientId, setClientId] = useState('');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setClientId(initialClientId || '');
    setTo('');
    setSubject(initialDraft?.subject || '');
    setBody(initialDraft?.body || '');
    setError('');
  }, [open, initialClientId, initialDraft]);

  const client = clients.find((item) => item.id === clientId) || null;
  const recipient = client?.email || to;

  const useTemplate = (templateId) => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    setSubject(applyTemplate(template.subject, client));
    setBody(applyTemplate(template.body, client));
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Escribe un asunto y un mensaje.');
      return;
    }
    if (!recipient) {
      setError('Elige un cliente o escribe un email de destino.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await base44.functions.invoke('sendClientEmail', {
        client_id: client?.id || '',
        to: recipient,
        subject: subject.trim(),
        body: body.trim(),
      });
      toast({ title: 'Correo enviado', description: recipient });
      onOpenChange(false);
      onSent?.();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'No se pudo enviar el correo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo correo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin cliente (email libre)" />
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

            <div className="space-y-1.5">
              <Label>Plantilla</Label>
              <Select onValueChange={useTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige una plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} · {TEMPLATE_CATEGORIES[item.category] || 'Otro'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Destinatario</Label>
            <Input
              value={client?.email || to}
              onChange={(event) => setTo(event.target.value)}
              readOnly={Boolean(client?.email)}
              placeholder="cliente@email.com"
            />
            {client && !client.email && (
              <p className="text-xs text-amber-600">Este cliente no tiene email guardado: escríbelo aquí.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Asunto</Label>
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Mensaje</Label>
            <Textarea rows={10} value={body} onChange={(event) => setBody(event.target.value)} />
            <p className="text-[11px] text-muted-foreground">
              Variables disponibles: {'{{nombre}}'}, {'{{email}}'}, {'{{telefono}}'}, {'{{zona}}'}
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={send} disabled={sending}>
            {sending ? 'Enviando…' : 'Enviar correo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}