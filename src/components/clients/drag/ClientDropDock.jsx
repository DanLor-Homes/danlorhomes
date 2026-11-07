import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { MoveRight } from 'lucide-react';
import { CLIENT_STATUSES } from '@/lib/clientStatus';
import { STATUS_DROP_PREFIX } from '@/hooks/useClientDragDrop';
import { cn } from '@/lib/utils';

export default function ClientDropDock({ dragging }) {
  return (
    <div
      className={cn(
        'mb-3 flex flex-wrap items-center gap-1.5 rounded-2xl border px-3 py-2 transition-colors',
        dragging ? 'border-primary bg-primary/5' : 'border-dashed border-border/70 bg-card/60'
      )}
    >
      <span className="mr-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
        <MoveRight className="h-3.5 w-3.5" />
        {dragging ? 'Suelta sobre un estado' : 'Arrastra una ficha para moverla de estado'}
      </span>

      {CLIENT_STATUSES.map((status) => (
        <Droppable droppableId={`${STATUS_DROP_PREFIX}${status.id}`} key={status.id} direction="horizontal">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-medium transition-shadow',
                status.className,
                snapshot.isDraggingOver && 'ring-2 ring-primary ring-offset-1 ring-offset-background'
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