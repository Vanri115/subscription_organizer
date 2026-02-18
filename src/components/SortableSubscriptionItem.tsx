import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
    id: string;
    children: (dragHandleProps: React.HTMLAttributes<HTMLElement>) => React.ReactNode;
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
        // Do NOT set touchAction: 'none' here — that blocks page scroll
    };

    // Pass drag handle props (listeners + attributes) to children via render prop
    const dragHandleProps = { ...listeners, ...attributes };

    return (
        <div ref={setNodeRef} style={style}>
            {children(dragHandleProps)}
        </div>
    );
};
