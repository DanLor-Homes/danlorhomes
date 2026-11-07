import React from 'react';
import { Mail, MessageSquarePlus, Pencil, Phone, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import LeadScoreBadge from '@/components/clients/LeadScoreBadge';
import { statusMeta } from '@/lib/clientStatus';
import { formatCurrency, daysSince } from '@/lib/crm';
import { scoreBand } from '@/lib/leadScoring';
import { cn } from '@/lib/utils';

export default function LeadTableRow({ client, lead, selected, onToggle, onOpen, onLog, onEdit, onDelete }) {
  const band = scoreBand(lead.score);
  const days = daysSince(lead.last);
  const recency = !lead.last ? 'Sin contacto' : days === 0 ? 'Contacto hoy' : `Hace ${days} d`;
  const status = statusMeta(client.status);
  const signals = [...(lead.items || [])].sort((a, b) => b.points - a.points).slice(0, 2);

  return (
    <div
      onClick={() => onOpen(client)}
      className={cn(
        'group grid cursor-pointer grid-cols-1 gap-1.5 border-b border-border/50 px-4 py-3 transition-colors last:border-0 hover:bg-accent/40 md:grid-cols-[20px_1.5fr_1.1fr_1fr_0.9fr_0.8fr_auto] md:items-center md:gap-4',
        selected && 'bg-primary/5'
      )}
    >
      <div onClick={(event) => event.stopPropagation()} className="flex items-center">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle(client.id)}
          aria-label={`Seleccionar ${client.name}`}
        />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{client.name}</p>
          <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium', status.className)}>
            {status.label}
          </span>
        </div>
        <p className="truncate text-[11px] text-muted-foreground">{client.email || 'Sin email'}</p>
      </div>

      <div className="min-w-0 text-xs text-muted-foreground">
        <p className="truncate">{client.contact_person || '—'}</p>
        <p className="truncate">{client.phone || ''}</p>
      </div>

      <div className="min-w-0 text-xs text-muted-foreground">
        <p className="truncate">{client.geographic_zone || client.search_zones || 'Sin zona'}</p>
        <p className="truncate">{client.assigned_to || 'Sin asignar'}</p>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <LeadScoreBadge score={lead.score} />
          <span className="text-[11px] font-medium text-muted-foreground">{band.label}</span>
        </div>
        {signals.length > 0 && (
          <p className="mt-1 truncate text-[10px] text-muted-foreground">{signals.map((item) => item.label).join(' · ')}</p>
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
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(client)} aria-label={`Editar ${client.name}`}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(client)}
          aria-label={`Eliminar ${client.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}