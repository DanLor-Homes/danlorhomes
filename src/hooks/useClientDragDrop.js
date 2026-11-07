import { useState } from 'react';

export const STATUS_DROP_PREFIX = 'client-status:';
export const TRASH_DROP_ID = 'client-trash';

export default function useClientDragDrop({ onMove, onTrash }) {
  const [dragging, setDragging] = useState(false);

  const handleDragEnd = (result) => {
    setDragging(false);
    const { destination, draggableId } = result;
    if (!destination) return;

    if (destination.droppableId === TRASH_DROP_ID) {
      onTrash(draggableId);
      return;
    }

    if (destination.droppableId.startsWith(STATUS_DROP_PREFIX)) {
      onMove(draggableId, destination.droppableId.slice(STATUS_DROP_PREFIX.length));
    }
  };

  return {
    dragging,
    handleDragStart: () => setDragging(true),
    handleDragEnd,
  };
}