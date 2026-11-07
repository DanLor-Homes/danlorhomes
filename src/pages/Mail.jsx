import React, { useCallback, useEffect, useState } from 'react';
import { PenSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/crm/PageHeader';
import { Button } from '@/components/ui/button';
import MailInbox from '@/components/mail/MailInbox';
import MailComposer from '@/components/mail/MailComposer';
import TemplatesPanel from '@/components/mail/TemplatesPanel';
import WhatsAppPanel from '@/components/mail/WhatsAppPanel';
import { parseEmail } from '@/lib/mail';

export default function Mail() {
  const [emails, setEmails] = useState([]);
  const [whatsapps, setWhatsapps] = useState([]);
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('bandeja');
  const [composer, setComposer] = useState({ open: false, clientId: '', draft: null });

  const load = useCallback(async () => {
    setLoading(true);
    const [interactions, whatsappRes, clientRes, templateRes] = await Promise.all([
      base44.entities.Interaction.filter({ type: 'email' }, { sort: '-date', limit: 100 }),
      base44.entities.Interaction.filter({ type: 'whatsapp' }, { sort: '-date', limit: 100 }),
      base44.entities.Client.filter({}, { sort: 'name', limit: 500 }),
      base44.entities.EmailTemplate.filter({}, { sort: '-created_date', limit: 200 }),
    ]);

    const clientItems = clientRes.items || [];
    const namesById = {};
    clientItems.forEach((client) => {
      namesById[client.id] = client.name;
    });

    setEmails(
      (interactions.items || []).map((interaction) => ({
        id: interaction.id,
        date: interaction.date || interaction.created_date,
        clientId: interaction.client_id,
        clientName: namesById[interaction.client_id] || '',
        parsed: parseEmail(interaction.content),
      }))
    );
    setWhatsapps(
      (whatsappRes.items || []).map((interaction) => ({
        id: interaction.id,
        date: interaction.date || interaction.created_date,
        clientId: interaction.client_id,
        clientName: namesById[interaction.client_id] || '',
        content: interaction.content || '',
      }))
    );
    setClients(clientItems);
    setTemplates(templateRes.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reply = (email) => {
    const subject = email.parsed.subject || '';
    setComposer({
      open: true,
      clientId: email.clientId || '',
      draft: { subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`, body: '' },
    });
  };

  const tabs = [
    { id: 'bandeja', label: `Bandeja (${emails.length})` },
    { id: 'whatsapp', label: `WhatsApp (${whatsapps.length})` },
    { id: 'plantillas', label: `Plantillas (${templates.length})` },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Comunicación"
        title="Correo"
        description="Redacta con plantillas, envía a tus clientes y consulta el historial de cada conversación."
      >
        <Button onClick={() => setComposer({ open: true, clientId: '', draft: null })}>
          <PenSquare className="h-4 w-4" /> Redactar
        </Button>
      </PageHeader>

      <div className="mb-4 inline-flex gap-1 rounded-full bg-muted p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === item.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'bandeja' ? (
        <MailInbox emails={emails} loading={loading} onReply={reply} />
      ) : tab === 'whatsapp' ? (
        <WhatsAppPanel
          clients={clients}
          templates={templates}
          messages={whatsapps}
          loading={loading}
          onChanged={load}
        />
      ) : (
        <TemplatesPanel templates={templates} loading={loading} onChanged={load} />
      )}

      <MailComposer
        open={composer.open}
        onOpenChange={(open) => setComposer((prev) => ({ ...prev, open }))}
        clients={clients}
        templates={templates}
        initialClientId={composer.clientId}
        initialDraft={composer.draft}
        onSent={load}
      />
    </div>
  );
}