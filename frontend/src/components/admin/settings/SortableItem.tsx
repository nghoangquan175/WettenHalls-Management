import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Edit2, Plus } from "lucide-react";
import { clsx } from "clsx";
import type { ReactNode } from "react";
import { DynamicIcon } from "./DynamicIcon";

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
}: SortableItemProps) {
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
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <div
        className={clsx(
          "flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm group hover:border-blue-400 transition-all",
          isDragging && "opacity-50 ring-2 ring-blue-500",
          depth > 0 && "ml-8 bg-gray-50/50"
        )}
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
        >
          <GripVertical size={18} />
        </button>

        <div className="flex-1 flex items-center gap-3 overflow-hidden">
          {icon && (
            <span className="text-gray-500 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg group-hover:bg-blue-50 transition-colors">
              <DynamicIcon name={icon} size={18} />
            </span>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-gray-900 truncate">{label}</span>
            <span className="text-xs text-gray-500 truncate">{url}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
