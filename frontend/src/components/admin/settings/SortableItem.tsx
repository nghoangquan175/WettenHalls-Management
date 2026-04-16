import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit2, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { DynamicIcon } from './DynamicIcon';
import { motion, AnimatePresence } from 'framer-motion';

interface SortableItemProps {
  id: string;
  label: string;
  url: string;
  icon?: string;
  hasChildren?: boolean;
  depth?: number;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild?: () => void;
  children?: ReactNode;
  isOverlay?: boolean;
}

export function SortableItem({
  id,
  label,
  url,
  icon,
  depth = 0,
  onEdit,
  onDelete,
  onAddChild,
  children,
  isOverlay = false,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isOverlay });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const itemContent = (
    <div
      className={clsx(
        'flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm group hover:border-blue-400',
        !isOverlay && !isDragging && 'transition-all',
        isOverlay &&
          'ring-2 ring-blue-500 shadow-xl border-blue-400 cursor-grabbing bg-white',
        depth > 0 && 'bg-gray-50/50'
      )}
      style={{
        flexShrink: 0,
      }}
    >
      <button
        {...attributes}
        {...listeners}
        className={clsx(
          'cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors p-1 shrink-0',
          isOverlay && 'cursor-grabbing'
        )}
      >
        <GripVertical size={18} />
      </button>

      <div className="flex-1 flex items-center gap-3 overflow-hidden">
        {icon && (
          <span className="text-gray-500 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg group-hover:bg-blue-50 transition-colors shrink-0">
            <DynamicIcon name={icon} size={18} />
          </span>
        )}
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-gray-900 truncate">{label}</span>
          <span className="text-xs text-gray-500 truncate">{url}</span>
        </div>
      </div>

      <div
        className={clsx(
          'flex items-center gap-1 transition-opacity shrink-0',
          isOverlay ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        {onAddChild && depth === 0 && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onAddChild();
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Add Sub-item"
          >
            <Plus size={16} />
          </button>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            onEdit();
          }}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          title="Edit"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  // When rendered as an overlay, we don't need sortable hooks/wrappers
  if (isOverlay) {
    return (
      <div className="mb-2 w-full origin-center pointer-events-none select-none">
        {itemContent}
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout="position"
      transition={{
        type: 'spring',
        damping: 25,
        stiffness: 350,
      }}
      className="mb-2 relative w-full origin-top"
    >
      {/* 
        Placeholder Strategy:
        When isDragging is true, we keep the content in the DOM but make it nearly invisible (opacity-0).
        This ensures the "hole" in the list has the EXACT same dimensions as the original item,
        preventing any layout shift or scaling issues in the container.
      */}
      <div
        className={clsx(
          isDragging && 'opacity-0 pointer-events-none select-none',
          'relative w-full'
        )}
      >
        {itemContent}
        {!isOverlay ? (
          <AnimatePresence initial={false}>
            {children && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 overflow-hidden"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          children && <div className="mt-2">{children}</div>
        )}
      </div>

      {/* The Visual Placeholder background (optional, but good for UX) */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-xl" />
      )}
    </motion.div>
  );
}
