import React from 'react';
import { Mail, MessageSquarePlus, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, daysSince } from '@/lib/crm';
import { scoreBand } from '@/lib/leadScoring';
import LeadScoreBadge from '@/components/clients/LeadScoreBadge';

export default function LeadRow({ client, lead, onOpen, onLog }) {
  const band = scoreBand(lead.score);
  const days = daysSince(lead.last);
  const recency = !lead.last ? 'Sin contacto' : days === 0 ? 'Contacto hoy' : `Hace ${days} d`;
  const reasons = [...(lead.items || [])].sort((a, b) => b.points - a.points).slice(0, 2);

  return (
    <div
      onClick={() => onOpen(client)}
      className="group grid cursor-pointer grid-cols-1 gap-2 border-b border-border/50 px-4 py-3 transition-colors last:border-0 hover:bg-accent/40 md:grid-cols-[1.5fr_0.9fr_1.5fr_0.7fr_auto] md:items-center md:gap-4"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{client.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {[client.geographic_zone || client.search_zones, client.assigned_to].filter(Boolean).join(' · ') || 'Sin zona'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <LeadScoreBadge score={lead.score} />
        <span className="text-[11px] font-medium text-muted-foreground">{band.label}</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {reasons.length === 0 ? (
          <span className="text-[11px] text-muted-foreground">Sin señales de cualificación</span>
        ) : (
          reasons.map((item) => (
            <span
              key={item.label}
              className="rounded-full border border-border/70 bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {item.label}
            </span>
          ))
        )}
      </div>

      <div className="min-w-0 text-[11px] text-muted-foreground">
        <p className="truncate">{recency}</p>
        {lead.openValue > 0 && <p className="truncate text-foreground">{formatCurrency(lead.openValue, true)}</p>}
      </div>

      <div
        className="flex items-center justify-end gap-0.5 md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
        onClick={(event) => event.stopPropagation()}
      >
        {client.phone && (
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <a href={`tel:${client.phone}`} aria-label={`Llamar a ${client.name}`}>
              <Phone className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
        {client.email && (
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <a href={`mailto:${client.email}`} aria-label={`Escribir a ${client.name}`}>
              <Mail className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onLog(client)} aria-label="Registrar interacción">
          <MessageSquarePlus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}