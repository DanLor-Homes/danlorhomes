import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

export default function DraggableClientRow({ clientId, index, children }) {
  return (
    <Draggable draggableId={clientId} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={snapshot.isDragging ? 'relative z-20 rounded-lg bg-card shadow-xl ring-1 ring-primary/40' : ''}
        >
          {children}
        </div>
      )}
    </Draggable>
  );
}