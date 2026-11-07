import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import ClientDragList from '@/components/clients/drag/ClientDragList';
import DraggableClientRow from '@/components/clients/drag/DraggableClientRow';
import LeadTableRow from '@/components/leads/LeadTableRow';

export default function LeadsTable({
  leads,
  selectedIds,
  allSelected,
  onToggleAll,
  onToggle,
  onOpen,
  onLog,
  onEdit,
  onDelete,
}) {
  return (
    <ClientDragList className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="hidden grid-cols-[20px_1.5fr_1.1fr_1fr_0.9fr_0.8fr_auto] gap-4 border-b border-border/70 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
        <Checkbox checked={allSelected} onCheckedChange={onToggleAll} aria-label="Seleccionar todos" />
        <span>Lead</span>
        <span>Contacto</span>
        <span>Zona / responsable</span>
        <span>Puntuación</span>
        <span>Actividad</span>
        <span />
      </div>

      {leads.map((lead, index) => (
        <DraggableClientRow key={lead.client.id} clientId={lead.client.id} index={index}>
          <LeadTableRow
            client={lead.client}
            lead={lead}
            selected={selectedIds.includes(lead.client.id)}
            onToggle={onToggle}
            onOpen={onOpen}
            onLog={onLog}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </DraggableClientRow>
      ))}
    </ClientDragList>
  );
}