"use client";

import { useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CheckCircle2, Search, X } from "lucide-react";
import { TodoItem } from "./TodoItem";
import { QuickAdd } from "./QuickAdd";
import type { Todo, ActiveList } from "@/types/todos";

interface Props {
  todos: Todo[];
  activeList: ActiveList;
  activeListColor: string;
  activeListName: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggle: (id: string) => void;
  onSelect: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onAdd: (title: string, fields?: Partial<Todo>) => Promise<Todo>;
  onReorder: (todos: Todo[]) => void;
  onClearCompleted?: () => void;
}

export function TodoList({
  todos, activeList, activeListColor, activeListName,
  searchQuery, onSearchChange,
  onToggle, onSelect, onDelete, onAdd, onReorder, onClearCompleted,
}: Props) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIdx = todos.findIndex(t => t.id === active.id);
      const newIdx = todos.findIndex(t => t.id === over.id);
      onReorder(arrayMove(todos, oldIdx, newIdx));
    },
    [todos, onReorder]
  );

  const isCompletedView = activeList.type === 'smart' && activeList.id === 'completed';

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="px-5 pt-6 sm:px-6 sm:pt-8 pb-4 shrink-0 border-b border-zinc-200/50 dark:border-zinc-800/50 mb-2">
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight drop-shadow-sm truncate" style={{ color: activeListColor }}>
              {searchQuery ? 'Search Results' : activeListName}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 sm:mt-1.5 font-medium truncate">
              {todos.length === 0
                ? searchQuery ? 'No matches found' : 'No tasks pending'
                : `${todos.length} task${todos.length !== 1 ? 's' : ''} ${searchQuery ? 'found' : 'remaining'}`}
            </p>
          </div>

          {isCompletedView && todos.length > 0 && onClearCompleted && (
            <button
              onClick={onClearCompleted}
              className="text-[9px] sm:text-[10px] font-black text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-red-500/20 shrink-0 mb-1"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-indigo-500">
            <Search size={16} />
          </div>
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-2.5 pl-10 pr-10 text-[15px] sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500/50 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable list area */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2 sm:px-4 py-2">
        {todos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 gap-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
              <CheckCircle2 size={48} className="text-emerald-500 relative z-10 drop-shadow-md" />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-center px-10">
              {searchQuery ? 'We couldn\'t find any tasks matching your search' : (isCompletedView ? 'No tasks completed' : 'All caught up')}
            </p>
          </motion.div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <AnimatePresence initial={false}>
                {todos.map((todo, i) => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    transition={{ delay: Math.min(i * 0.025, 0.2), duration: 0.18 }}
                  >
                    <TodoItem
                      todo={todo}
                      listColor={activeListColor}
                      onToggle={onToggle}
                      onSelect={onSelect}
                      onDelete={onDelete}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Quick-add — hidden for the "completed" smart list and during search */}
      {!isCompletedView && !searchQuery && (
        <QuickAdd
          onAdd={async (title, fields) => { const todo = await onAdd(title, fields); onSelect(todo); }}
          color={activeListColor}
        />
      )}
    </div>
  );
}
