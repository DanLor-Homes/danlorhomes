import React, { useState } from 'react';
import { Mail, MailOpen, Inbox } from 'lucide-react';
import EmptyState from '@/components/crm/EmptyState';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/crm';

export default function MailInbox({ emails, loading, onReply }) {
  const [selectedId, setSelectedId] = useState('');
  const selected = emails.find((item) => item.id === selectedId) || emails[0] || null;

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!emails.length) {
    return (
      <EmptyState
        icon={Inbox}
        title="Aún no hay correos"
        description="Los correos que envíes desde el CRM se guardarán aquí y en la ficha de cada cliente."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <ul className="max-h-[560px] space-y-1.5 overflow-y-auto pr-1">
        {emails.map((email) => {
          const active = selected?.id === email.id;
          return (
            <li key={email.id}>
              <button
                type="button"
                onClick={() => setSelectedId(email.id)}
                className={`w-full rounded-xl border px-3.5 py-3 text-left transition-colors ${
                  active
                    ? 'border-primary/40 bg-primary/8'
                    : 'border-border/70 bg-card hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">
                    {email.clientName || email.parsed.to || email.parsed.from || 'Sin cliente'}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatDateTime(email.date)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{email.parsed.subject}</p>
              </button>
            </li>
          );
        })}
      </ul>

      {selected && (
        <article className="rounded-2xl border border-border/70 bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-heading text-base font-bold leading-tight">{selected.parsed.subject}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {selected.parsed.to ? `Para: ${selected.parsed.to}` : ''}
                {selected.parsed.from ? `De: ${selected.parsed.from}` : ''}
                {selected.clientName ? ` · ${selected.clientName}` : ''}
              </p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              {selected.parsed.to ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
            </span>
          </div>

          <div className="mt-4 whitespace-pre-wrap border-t border-border/70 pt-4 text-sm leading-relaxed">
            {selected.parsed.body}
          </div>

          {selected.clientId && (
            <div className="mt-5 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => onReply(selected)}>
                Responder
              </Button>
            </div>
          )}
        </article>
      )}
    </div>
  );
}