import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
    id: string;
    children: React.ReactNode;

}

export const SortableSubscriptionItem: React.FC<Props> = ({ id, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none', // Prevent scrolling while dragging
    };

    // Handle long press logic manually since dnd-kit activation constraints cover the drag start,
    // but we might want visual feedback or specific trigger logic.
    // For now, we rely on dnd-kit's PointerSensor with activationConstraint.

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
};
