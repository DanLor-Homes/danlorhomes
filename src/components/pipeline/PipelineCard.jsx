import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { AlertTriangle, CalendarClock, Trash2, User } from 'lucide-react';
import { daysUntil, formatCurrency, formatDate } from '@/lib/crm';
import { cn } from '@/lib/utils';

export default function PipelineCard({ opportunity, index, clientName, channelName, onClick, onDelete }) {
  const remaining = daysUntil(opportunity.expected_closing_date);
  const atRisk = opportunity.status === 'open' && remaining !== null && remaining >= 0 && remaining < 3;

  return (
    <Draggable draggableId={opportunity.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick?.(opportunity)}
          className={cn(
            'group relative cursor-grab rounded-xl border border-border/70 bg-card p-3 transition-all duration-200 hover:border-primary/40 active:cursor-grabbing',
            snapshot.isDragging && 'rotate-[1deg] border-primary/60 shadow-xl shadow-primary/10'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-[13px] font-semibold leading-snug">{opportunity.name}</p>
            <div className="flex shrink-0 items-center gap-1">
              {atRisk && <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-rose-400" />}
              {onDelete && (
                <button
                  type="button"
                  aria-label={`Eliminar ${opportunity.name}`}
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(opportunity);
                  }}
                  className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
            <User className="h-3 w-3" /> {clientName || 'Sin cliente'}
          </p>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="font-heading text-[15px] font-bold tracking-tight">{formatCurrency(opportunity.amount)}</span>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {opportunity.probability ?? 0}%
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/50 pt-2 text-[10px] text-muted-foreground">
            <span className="truncate">{channelName || 'Sin canal'}</span>
            {opportunity.expected_closing_date && (
              <span className={cn('flex shrink-0 items-center gap-1', atRisk && 'text-rose-400')}>
                <CalendarClock className="h-3 w-3" />
                {formatDate(opportunity.expected_closing_date, { day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}