import React from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import LeadScoreBadge from '@/components/clients/LeadScoreBadge';

export default function HotStaleLeads({ leads }) {
  return (
    <section className="card-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-sm font-bold">
            <Flame className="h-4 w-4 text-rose-400" />
            Leads calientes sin contacto
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Score 70 o más y sin interacción en los últimos 30 días</p>
        </div>
        <Link to="/leads" className="shrink-0 text-xs font-medium text-primary hover:underline">
          Ver leads
        </Link>
      </div>

      {leads.length === 0 ? (
        <p className="rounded-xl border border-border/60 bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
          Ningún lead caliente se ha enfriado: todos tienen contacto reciente.
        </p>
      ) : (
        <div className="space-y-2">
          {leads.map(({ client, score, days }) => (
            <Link
              key={client.id}
              to="/leads"
              className="flex items-center gap-3 rounded-xl border border-rose-500/25 bg-rose-500/5 px-3 py-2.5 transition-colors hover:border-rose-500/40"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{client.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {days === null ? 'Sin ninguna interacción registrada' : `Último contacto hace ${days} días`}
                  {client.assigned_to ? ` · ${client.assigned_to}` : ''}
                </p>
              </div>
              <LeadScoreBadge score={score} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}