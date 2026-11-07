import { useState } from 'react';

export const DROP_STATUS_PREFIX = 'move-status:';
export const DROP_TRASH_ID = 'move-trash';
export const DROP_LIST_ID = 'move-list';

/**
 * Arrastrar y soltar genérico para listados con estado:
 * soltar sobre un estado actualiza el registro y soltar en la papelera lo elimina.
 */
export default function useStatusDragDrop({ onMove, onTrash }) {
  const [dragging, setDragging] = useState(false);

  const handleDragEnd = (result) => {
    setDragging(false);
    const { destination, draggableId } = result;
    if (!destination) return;

    if (destination.droppableId === DROP_TRASH_ID) {
      onTrash(draggableId);
      return;
    }

    if (destination.droppableId.startsWith(DROP_STATUS_PREFIX)) {
      onMove(draggableId, destination.droppableId.slice(DROP_STATUS_PREFIX.length));
    }
  };

  return {
    dragging,
    handleDragStart: () => setDragging(true),
    handleDragEnd,
  };
}