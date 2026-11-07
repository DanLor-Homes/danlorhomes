import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { MoveRight } from 'lucide-react';
import { DROP_STATUS_PREFIX } from '@/hooks/useStatusDragDrop';
import { cn } from '@/lib/utils';

export default function DragStatusDock({ statuses, dragging, hint }) {
  return (
    <div
      className={cn(
        'mb-3 flex flex-wrap items-center gap-1.5 rounded-2xl border px-3 py-2 transition-colors',
        dragging ? 'border-primary bg-primary/5' : 'border-dashed border-border/70 bg-card/60'
      )}
    >
      <span className="mr-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
        <MoveRight className="h-3.5 w-3.5" />
        {dragging ? 'Suelta sobre un estado' : hint || 'Arrastra una ficha para moverla de estado'}
      </span>

      {statuses.map((status) => (
        <Droppable droppableId={`${DROP_STATUS_PREFIX}${status.id}`} key={status.id} direction="horizontal">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                'rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors',
                snapshot.isDraggingOver && 'border-primary bg-primary/15 text-primary ring-2 ring-primary/40'
              )}
            >
              {status.label}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      ))}
    </div>
  );
}