import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { LIST_DROP_ID } from '@/hooks/useClientDragDrop';
import { cn } from '@/lib/utils';

export default function ClientDragList({ children, className }) {
  return (
    <Droppable droppableId={LIST_DROP_ID}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} className={cn(className)}>
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}