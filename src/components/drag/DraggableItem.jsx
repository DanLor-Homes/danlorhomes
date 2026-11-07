import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

export default function DraggableItem({ id, index, children }) {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={snapshot.isDragging ? 'relative z-20 rounded-xl shadow-xl ring-1 ring-primary/40' : ''}
        >
          {children}
        </div>
      )}
    </Draggable>
  );
}