import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MessageDraftDialog from '@/components/clients/MessageDraftDialog';

export default function QuickRepliesCard({ leads }) {
  const [client, setClient] = useState(null);
  const [open, setOpen] = useState(false);

  const reply = (leadClient) => {
    setClient(leadClient);
    setOpen(true);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card to-card p-5">
      <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3 w-3" /> Respuesta inmediata
          </p>
          <h3 className="mt-1 font-heading text-sm font-bold">Contesta antes de que se enfríe</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            La IA redacta el mensaje con el historial y el pipeline del lead.
          </p>
        </div>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <Zap className="h-4 w-4" />
        </span>
      </div>

      {leads.length === 0 ? (
        <p className="rounded-xl border border-border/60 bg-background/40 px-3 py-4 text-center text-xs text-muted-foreground">
          Ningún lead espera respuesta ahora mismo.
        </p>
      ) : (
        <div className="space-y-2">
          {leads.slice(0, 3).map(({ client: lead, days }) => (
            <div
              key={lead.id}
              className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{lead.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {days === null ? 'Sin interacciones registradas' : `Sin contacto desde hace ${days} días`}
                </p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0" onClick={() => reply(lead)}>
                Redactar
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <Link to="/leads" className="text-xs font-medium text-primary hover:underline">
          Ver todos los leads
        </Link>
      </div>

      <MessageDraftDialog client={client} open={open} onOpenChange={setOpen} />
    </section>
  );
}