import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DragOverlay, type DragStartEvent } from '@dnd-kit/core';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { Plus, Save, RotateCcw, Trash2, Copy } from 'lucide-react';
import { SortableItem } from './SortableItem';
import { Modal } from '../../ui/Modal/Modal';
import { ConfirmModal } from '../../ui/Modal/ConfirmModal';
import { Button } from '../../ui/Button/Button';
import { clsx } from 'clsx';

export interface NavItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
  targetBlank?: boolean;
  children?: NavItem[];
}

export interface NavigationVersion {
  id: string;
  versionName: string;
  active: boolean;
  items: NavItem[];
  updatedAt?: string;
}

interface NavigationBuilderProps {
  type: 'header' | 'footer';
  title: string;
  description: string;
  versions: Pick<
    NavigationVersion,
    'id' | 'versionName' | 'active' | 'updatedAt'
  >[];
  currentVersion: NavigationVersion | null;
  onVersionChange: (id: string) => void;
  onSave: (id: string, items: NavItem[]) => Promise<void>;
  onSaveAs: (name: string, items: NavItem[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onActivate: (id: string) => Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function NavigationBuilder({
  type,
  title,
  description,
  versions,
  currentVersion,
  onVersionChange,
  onSave,
  onSaveAs,
  onDelete,
  onActivate,
  onDirtyChange,
}: NavigationBuilderProps) {
  const [items, setItems] = useState<NavItem[]>([]);
  const [editingItem, setEditingItem] = useState<{
    parentId?: string;
    item?: NavItem;
  } | null>(null);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [pendingVersionId, setPendingVersionId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<NavItem | null>(null);

  const [confirmState, setConfirmState] = useState<{
    type: 'none' | 'save' | 'reset' | 'activate' | 'delete' | 'switch-version';
    isLoading: boolean;
  }>({ type: 'none', isLoading: false });

  // Check for unsaved changes
  const isDirty =
    JSON.stringify(items) !== JSON.stringify(currentVersion?.items || []);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Sync internal items when currentVersion changes
  useEffect(() => {
    if (currentVersion) {
      setItems(currentVersion.items || []);
    } else {
      setItems([]);
    }
  }, [currentVersion]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleConfirmAction = async () => {
    if (!currentVersion && confirmState.type !== 'switch-version') return;

    setConfirmState((prev) => ({ ...prev, isLoading: true }));

    try {
      if (confirmState.type === 'save') {
        if (currentVersion) await onSave(currentVersion.id, items);
      } else if (confirmState.type === 'reset') {
        setItems(currentVersion?.items || []);
      } else if (confirmState.type === 'activate') {
        if (currentVersion) await onActivate(currentVersion.id);
      } else if (confirmState.type === 'delete') {
        if (currentVersion) await onDelete(currentVersion.id);
      } else if (confirmState.type === 'switch-version') {
        if (pendingVersionId) {
          onVersionChange(pendingVersionId);
          setPendingVersionId(null);
        }
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setConfirmState({ type: 'none', isLoading: false });
    }
  };

  const handleVersionSelect = (id: string) => {
    if (isDirty) {
      setPendingVersionId(id);
      setConfirmState({ type: 'switch-version', isLoading: false });
    } else {
      onVersionChange(id);
    }
  };

  const handleSaveAs = async () => {
    if (!newVersionName.trim()) return;
    setConfirmState({ type: 'none', isLoading: true });
    try {
      await onSaveAs(newVersionName, items);
      setShowSaveAsModal(false);
      setNewVersionName('');
    } catch (error) {
      console.error('Save As failed:', error);
    } finally {
      setConfirmState({ type: 'none', isLoading: false });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Find the item being dragged to show in overlay
    const findItem = (items: NavItem[]): NavItem | null => {
      for (const item of items) {
        if (item.id === active.id) return item;
        if (item.children) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    setActiveItem(findItem(items));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveItem(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((prevItems) => {
        // Find if it's a root item
        const activeRootIndex = prevItems.findIndex(
          (item) => item.id === active.id
        );
        const overRootIndex = prevItems.findIndex(
          (item) => item.id === over.id
        );

        if (activeRootIndex !== -1 && overRootIndex !== -1) {
          return arrayMove(prevItems, activeRootIndex, overRootIndex);
        }

        // Find if it's a child item and identify its parent
        return prevItems.map((item) => {
          if (item.children) {
            const activeChildIndex = item.children.findIndex(
              (child) => child.id === active.id
            );
            const overChildIndex = item.children.findIndex(
              (child) => child.id === over.id
            );

            if (activeChildIndex !== -1 && overChildIndex !== -1) {
              return {
                ...item,
                children: arrayMove(
                  item.children,
                  activeChildIndex,
                  overChildIndex
                ),
              };
            }
          }
          return item;
        });
      });
    }
  };

  const addItem = (parentId?: string) => {
    const newItem: NavItem = {
      id: Math.random().toString(36).substr(2, 9),
      label: 'New Item',
      url: '',
    };

    if (!parentId) {
      setItems([...items, newItem]);
    } else {
      setItems(
        items.map((item) => {
          if (item.id === parentId) {
            return {
              ...item,
              children: [...(item.children || []), newItem],
            };
          }
          return item;
        })
      );
    }
  };

  const removeItem = (id: string, parentId?: string) => {
    if (!parentId) {
      setItems(items.filter((item) => item.id !== id));
    } else {
      setItems(
        items.map((item) => {
          if (item.id === parentId) {
            return {
              ...item,
              children: item.children?.filter((child) => child.id !== id),
            };
          }
          return item;
        })
      );
    }
  };

  const updateItem = (
    id: string,
    data: Partial<NavItem>,
    parentId?: string
  ) => {
    if (!parentId) {
      setItems(
        items.map((item) => (item.id === id ? { ...item, ...data } : item))
      );
    } else {
      setItems(
        items.map((item) => {
          if (item.id === parentId) {
            return {
              ...item,
              children: item.children?.map((child) =>
                child.id === id ? { ...child, ...data } : child
              ),
            };
          }
          return item;
        })
      );
    }
  };

  const handleSaveClick = () => {
    if (currentVersion) {
      setConfirmState({ type: 'save', isLoading: false });
    } else {
      setShowSaveAsModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col">
            <label className="ContentSBold text-gray-500 mb-1">
              Select Version
            </label>
            <select
              value={currentVersion?.id || ''}
              onChange={(e) => handleVersionSelect(e.target.value)}
              disabled={versions.length === 0}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ContentMBold text-gray-900 min-w-[200px] disabled:bg-gray-50 disabled:text-gray-400"
            >
              {versions.length === 0 && (
                <option value="">No versions created</option>
              )}
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.versionName} {v.active ? ' (Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={currentVersion?.active || false}
                disabled={
                  !currentVersion ||
                  currentVersion?.active ||
                  confirmState.isLoading
                }
                onChange={() =>
                  setConfirmState({ type: 'activate', isLoading: false })
                }
                className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary disabled:opacity-50"
              />
              <span
                className={clsx(
                  'ContentMBold transition-colors',
                  !currentVersion
                    ? 'text-gray-400'
                    : currentVersion?.active
                      ? 'text-green-600'
                      : 'text-gray-600 group-hover:text-gray-900'
                )}
              >
                {currentVersion?.active ? 'Active' : 'Set Active'}
              </span>
            </label>

            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
              disabled={
                !currentVersion ||
                currentVersion?.active ||
                confirmState.isLoading
              }
              onClick={() =>
                setConfirmState({ type: 'delete', isLoading: false })
              }
              title={
                !currentVersion
                  ? 'No version to delete'
                  : currentVersion?.active
                    ? 'Cannot delete the active version'
                    : 'Delete version'
              }
            >
              <Trash2 size={18} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <Button
            variant="outline"
            onClick={() => setConfirmState({ type: 'reset', isLoading: false })}
            disabled={!currentVersion || confirmState.isLoading}
            leftIcon={<RotateCcw size={16} />}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveClick}
            disabled={confirmState.isLoading}
            leftIcon={<Save size={16} />}
          >
            {currentVersion ? 'Save' : 'Save as'}
          </Button>
          {currentVersion && (
            <Button
              variant="secondary"
              onClick={() => setShowSaveAsModal(true)}
              disabled={confirmState.isLoading}
              leftIcon={<Copy size={16} />}
            >
              Save As
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="DisplaySBold text-gray-900">
            {title}{' '}
            {currentVersion && (
              <span className="text-primary">
                — {currentVersion.versionName}
              </span>
            )}
          </h3>
          <p className="ContentMRegular text-gray-500">
            {description}
            {currentVersion?.updatedAt && (
              <span className="ml-2 pl-2 border-l border-gray-200">
                Last updated:{' '}
                {new Date(currentVersion.updatedAt).toLocaleString()}
              </span>
            )}
            {!currentVersion && (
              <span className="ml-2 italic text-gray-400">
                (Drafting new layout)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={confirmState.type === 'reset'}
        onClose={() => setConfirmState({ type: 'none', isLoading: false })}
        onConfirm={handleConfirmAction}
        title="Reset Changes?"
        message="Are you sure you want to revert all changes to the last saved state for this version? This action cannot be undone."
        confirmText="Yes, Reset"
        variant="danger"
        isLoading={confirmState.isLoading}
      />

      <ConfirmModal
        isOpen={confirmState.type === 'save'}
        onClose={() => setConfirmState({ type: 'none', isLoading: false })}
        onConfirm={handleConfirmAction}
        title="Save Version?"
        message={`Do you want to overwrite the items in "${currentVersion?.versionName}"?`}
        confirmText="Save Now"
        variant="primary"
        isLoading={confirmState.isLoading}
      />

      <ConfirmModal
        isOpen={confirmState.type === 'activate'}
        onClose={() => setConfirmState({ type: 'none', isLoading: false })}
        onConfirm={handleConfirmAction}
        title="Activate Version?"
        message={`Do you want to set "${currentVersion?.versionName}" as the active navigation? This will deactivate all other versions.`}
        confirmText="Yes, Activate"
        variant="warning"
        isLoading={confirmState.isLoading}
      />

      <ConfirmModal
        isOpen={confirmState.type === 'delete'}
        onClose={() => setConfirmState({ type: 'none', isLoading: false })}
        onConfirm={handleConfirmAction}
        title="Delete Version?"
        message={`Are you sure you want to delete "${currentVersion?.versionName}"? This action is permanent.`}
        confirmText="Delete"
        variant="danger"
        isLoading={confirmState.isLoading}
      />

      <ConfirmModal
        isOpen={confirmState.type === 'switch-version'}
        onClose={() => setConfirmState({ type: 'none', isLoading: false })}
        onConfirm={handleConfirmAction}
        title="Unsaved Changes"
        message="You have unsaved changes in this version. Switching to another version will lose these changes. Continue?"
        confirmText="Switch Anyway"
        variant="warning"
        isLoading={confirmState.isLoading}
      />

      {/* Save As Modal */}
      <Modal
        isOpen={showSaveAsModal}
        onClose={() => setShowSaveAsModal(false)}
        title={
          versions.length === 0 ? 'Create New Version' : 'Save As New Version'
        }
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowSaveAsModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveAs}
              disabled={!newVersionName.trim() || confirmState.isLoading}
              isLoading={confirmState.isLoading}
            >
              {versions.length === 0 ? 'Create' : 'Save as New'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block ContentSBold text-gray-700 mb-1.5 focus-within:text-primary transition-colors">
              Version Name
            </label>
            <input
              type="text"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ContentMRegular"
              placeholder="Enter version name"
              autoFocus
            />
          </div>
        </div>
      </Modal>

      {/* Builder Area */}
      <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-6 min-h-[400px]">
        <LayoutGroup>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {items.map((item) => (
                  <SortableItem
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    url={item.url}
                    icon={item.icon}
                    onEdit={() => setEditingItem({ item })}
                    onDelete={() => removeItem(item.id)}
                    onAddChild={() => addItem(item.id)}
                  >
                    {item.children && item.children.length > 0 && (
                      <div className="ml-8 border-l-2 border-gray-100 pl-4 mt-2">
                        <SortableContext
                          items={item.children}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {item.children.map((child) => (
                              <SortableItem
                                key={child.id}
                                id={child.id}
                                label={child.label}
                                url={child.url}
                                icon={child.icon}
                                depth={1}
                                onEdit={() =>
                                  setEditingItem({
                                    parentId: item.id,
                                    item: child,
                                  })
                                }
                                onDelete={() => removeItem(child.id, item.id)}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </div>
                    )}
                  </SortableItem>
                ))}
              </div>
            </SortableContext>

            <DragOverlay adjustScale={false}>
              {activeId && activeItem ? (
                <div className="w-full pointer-events-none opacity-100">
                  <div className="w-full max-w-[calc(100vw-3rem)] md:max-w-none">
                    <SortableItem
                      id={activeId}
                      label={activeItem.label}
                      url={activeItem.url}
                      icon={activeItem.icon}
                      depth={items.find((i) => i.id === activeId) ? 0 : 1}
                      isOverlay
                      onEdit={() => {}}
                      onDelete={() => {}}
                    >
                      {activeItem.children &&
                        activeItem.children.length > 0 && (
                          <div className="ml-8 border-l-2 border-gray-100 pl-4 mt-2 space-y-2">
                            {activeItem.children.map((child) => (
                              <SortableItem
                                key={child.id}
                                id={child.id}
                                label={child.label}
                                url={child.url}
                                icon={child.icon}
                                depth={1}
                                isOverlay={true}
                                onEdit={() => {}}
                                onDelete={() => {}}
                              />
                            ))}
                          </div>
                        )}
                    </SortableItem>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </LayoutGroup>

        <button
          onClick={() => addItem()}
          className="w-full mt-4 flex items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all group"
        >
          <Plus
            size={20}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="ContentMBold">
            Add New {type === 'header' ? 'Menu Item' : 'Column'}
          </span>
        </button>
      </div>

      {/* Item Editor Modal */}
      {editingItem && (
        <ItemModal
          item={editingItem.item!}
          onClose={() => setEditingItem(null)}
          onSave={(data) => {
            updateItem(editingItem.item!.id, data, editingItem.parentId);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

// Internal Modal component using the standard UI Modal
function ItemModal({
  item,
  onClose,
  onSave,
}: {
  item: NavItem;
  onClose: () => void;
  onSave: (data: Partial<NavItem>) => void;
}) {
  const [formData, setFormData] = useState(item);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Menu Item"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave(formData)}>
            Save Item
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block ContentSBold text-gray-700 mb-1.5 focus-within:text-primary transition-colors">
            Label
          </label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) =>
              setFormData({ ...formData, label: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ContentMRegular"
            placeholder="e.g. Products"
          />
        </div>
        <div>
          <label className="block ContentSBold text-gray-700 mb-1.5 focus-within:text-primary transition-colors">
            URL
          </label>
          <input
            type="text"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ContentMRegular"
            placeholder="e.g. /products"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* <div>
            <label className="block ContentSBold text-gray-700 mb-1.5 focus-within:text-primary transition-colors">Icon Name</label>
            <input
              type="text"
              value={formData.icon || ""}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ContentMRegular"
              placeholder="e.g. Home"
            />
          </div> */}
          <div className="flex items-center mt-7">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.targetBlank}
                onChange={(e) =>
                  setFormData({ ...formData, targetBlank: e.target.checked })
                }
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="ContentSRegular text-gray-600 group-hover:text-gray-900 transition-colors">
                Target _blank
              </span>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
}
