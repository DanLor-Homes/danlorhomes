import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { MoveRight, Trash2 } from 'lucide-react';
import { CLIENT_STATUSES } from '@/lib/clientStatus';
import { STATUS_DROP_PREFIX, TRASH_DROP_ID } from '@/hooks/useClientDragDrop';
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
        {dragging ? 'Suelta sobre un estado o en la papelera' : 'Arrastra una ficha para moverla o eliminarla'}
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

      <Droppable droppableId={TRASH_DROP_ID} direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'ml-auto flex items-center gap-1 rounded-full border border-rose-500/40 px-2.5 py-1 text-[11px] font-medium text-rose-600 transition-colors dark:text-rose-300',
              snapshot.isDraggingOver && 'bg-rose-500/15'
            )}
          >
            <Trash2 className="h-3 w-3" /> Eliminar
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}