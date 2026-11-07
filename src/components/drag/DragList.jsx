import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { DROP_LIST_ID } from '@/hooks/useStatusDragDrop';
import { cn } from '@/lib/utils';

export default function DragList({ children, className }) {
  return (
    <Droppable droppableId={DROP_LIST_ID}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} className={cn(className)}>
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}