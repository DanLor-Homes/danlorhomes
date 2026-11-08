import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const MAX_RECIPIENTS = 25;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const emailMessage = (campaign) =>
  (campaign?.messages || []).find((message) => /mail|correo/i.test(message?.channel || '')) || null;

const splitEmail = (campaign) => {
  const message = emailMessage(campaign);
  const content = (message?.content || '').trim();
  const match = content.match(/^asunto:\s*(.+)$/im);
  if (!match) {
    return { subject: campaign?.title || '', body: content };
  }
  const subject = match[1].trim();
  const body = content
    .replace(/^asunto:\s*.+$/im, '')
    .trim();
  return { subject, body };
};

const leadLabel = (lead) => lead.client.contact_person || lead.client.name || lead.client.email;

export default function SendCampaignDialog({ open, onOpenChange, leads = [], campaign, zone = '' }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [ids, setIds] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const recipients = useMemo(
    () =>
      leads.filter((lead) => typeof lead.client.email === 'string' && EMAIL_RE.test(lead.client.email.trim())),
    [leads]
  );

  useEffect(() => {
    if (!open) return;
    const parsed = splitEmail(campaign);
    setSubject(parsed.subject);
    setBody(parsed.body);
    setError('');
    const token = zone.trim().toLowerCase().split(',')[0];
    const matching = token
      ? recipients.filter((lead) =>
          [lead.client.geographic_zone, lead.client.search_zones]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(token))
        )
      : [];
    const preselected = matching.length ? matching : recipients;
    setIds(preselected.slice(0, MAX_RECIPIENTS).map((lead) => lead.client.id));
  }, [open, campaign, zone, recipients]);

  const toggle = (id) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= MAX_RECIPIENTS) return prev;
      return [...prev, id];
    });
  };

  const allSelected = recipients.length > 0 && ids.length === Math.min(recipients.length, MAX_RECIPIENTS);

  const toggleAll = () => {
    setIds(allSelected ? [] : recipients.slice(0, MAX_RECIPIENTS).map((lead) => lead.client.id));
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Escribe un asunto y un mensaje antes de enviar.');
      return;
    }
    if (ids.length === 0) {
      setError('Selecciona al menos un lead con email.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const response = await base44.functions.invoke('bulkClientEmail', {
        client_ids: ids,
        subject: subject.trim(),
        body: body.trim(),
      });
      const data = response.data || {};
      if (data.error) {
        setError(data.error);
        return;
      }
      toast({
        title: 'Campaña enviada',
        description: `${data.sent} de ${data.total} enviados${data.errors?.length ? ` · ${data.errors.length} con error` : ''}`,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'No se ha podido enviar la campaña.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Enviar campaña a leads
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Asunto</Label>
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mensaje</Label>
            <Textarea rows={6} value={body} onChange={(event) => setBody(event.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Destinatarios · {ids.length} seleccionados
              </Label>
              <button
                type="button"
                onClick={toggleAll}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                {allSelected ? 'Quitar todos' : 'Seleccionar todos'}
              </button>
            </div>
            <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-border/70 p-2">
              {recipients.length === 0 ? (
                <p className="p-2 text-[12px] text-muted-foreground">
                  Ningún lead tiene email válido. Añade el email en la ficha del cliente.
                </p>
              ) : (
                recipients.map((lead) => (
                  <label
                    key={lead.client.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-[13px] hover:bg-accent/60"
                  >
                    <Checkbox checked={ids.includes(lead.client.id)} onCheckedChange={() => toggle(lead.client.id)} />
                    <span className="min-w-0 flex-1 truncate">{leadLabel(lead)}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{lead.client.email}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Se envía un email individual con el nombre de DAN&amp;LOR. Máximo {MAX_RECIPIENTS} destinatarios por envío
              ({recipients.length} leads con email).
            </p>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button onClick={send} disabled={sending || ids.length === 0}>
            <Send className="mr-1.5 h-4 w-4" />
            {sending ? 'Enviando…' : `Enviar a ${ids.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}