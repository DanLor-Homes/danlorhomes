import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

export default function BulkEmailDialog({ open, onOpenChange, clientIds, clients, onDone }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const withEmail = clients.filter((client) => client.email).length;

  useEffect(() => {
    if (open) {
      setSubject('');
      setBody('');
      setError('');
    }
  }, [open]);

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Escribe un asunto y un mensaje.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const response = await base44.functions.invoke('bulkClientEmail', {
        client_ids: clientIds,
        subject: subject.trim(),
        body: body.trim(),
      });
      const data = response.data || {};
      if (data.error) {
        setError(data.error);
        return;
      }
      toast({
        title: 'Email enviado',
        description: `${data.sent} de ${data.total} enviados${data.errors?.length ? ` · ${data.errors.length} con error` : ''}`,
      });
      onOpenChange(false);
      onDone?.();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'No se han podido enviar los emails.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar email a {clients.length} clientes</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Asunto</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Nuevos inmuebles en tu zona" />
          </div>
          <div className="space-y-1.5">
            <Label>Mensaje</Label>
            <Textarea rows={7} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escribe el mensaje…" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Se enviará un email individual a cada cliente con dirección válida ({withEmail} de {clients.length}).
          </p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button onClick={send} disabled={sending}>
            {sending ? 'Enviando…' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}