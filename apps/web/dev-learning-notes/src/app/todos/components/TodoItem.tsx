"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Flag, Trash2, CalendarDays, GripVertical, FileText } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/cn";
import type { Todo, Priority } from "@/types/todos";

const PRIORITY_COLOR: Record<Priority, string> = {
  none:   'transparent',
  low:    '#6366f1',
  medium: '#f59e0b',
  high:   '#ef4444',
};

const PRIORITY_LABEL: Record<Priority, string> = {
  none:   '',
  low:    'Low',
  medium: 'Medium',
  high:   'High',
};

function formatDueDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0)  return 'Today';
  if (diff === 1)  return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Props {
  todo: Todo;
  listColor: string;
  onToggle: (id: string) => void;
  onSelect: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, listColor, onToggle, onSelect, onDelete }: Props) {
  const [hovered, setHovered] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  const isOverdue =
    todo.due_date &&
    !todo.is_completed &&
    new Date(todo.due_date + 'T00:00:00') < new Date(new Date().toDateString());

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Mobile card (< sm) ─────────────────────────────────── */}
      <div
        className={cn(
          "sm:hidden mx-2 my-2 rounded-2xl border transition-all duration-300 overflow-hidden",
          "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 shadow-sm active:scale-[0.985]",
          isDragging && "shadow-xl scale-[1.02] border-zinc-300 dark:border-zinc-700",
          todo.is_completed && "opacity-55 grayscale-[0.4]"
        )}
      >
        {/* Coloured top accent bar */}
        <div
          className="h-1 w-full rounded-t-2xl"
          style={{ backgroundColor: listColor + 'cc' }}
        />

        <div className="px-4 py-3.5 flex items-start gap-3">
          {/* Checkbox */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => onToggle(todo.id)}
            className={cn(
              "mt-0.5 w-6 h-6 rounded-lg shrink-0 border-2 flex items-center justify-center transition-all duration-300",
              todo.is_completed ? "border-transparent" : "hover:scale-110"
            )}
            style={{
              borderColor: todo.is_completed ? 'transparent' : listColor,
              backgroundColor: todo.is_completed ? listColor : 'transparent',
              boxShadow: todo.is_completed ? `0 0 12px ${listColor}40` : 'none'
            }}
          >
            <AnimatePresence>
              {todo.is_completed && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 28 }}
                >
                  <Check size={13} color="white" strokeWidth={3.5} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Content */}
          <button className="flex-1 text-left min-w-0" onClick={() => onSelect(todo)}>
            <p
              className={cn(
                "text-[15px] leading-snug font-bold transition-all duration-300",
                todo.is_completed
                  ? "line-through text-zinc-400 dark:text-zinc-500"
                  : "text-zinc-800 dark:text-zinc-100"
              )}
            >
              {todo.title}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {todo.due_date && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border",
                    isOverdue
                      ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
                      : "text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                  )}
                >
                  <CalendarDays size={10} />
                  {formatDueDate(todo.due_date)}
                </span>
              )}

              {todo.priority !== 'none' && (
                <span
                  className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border"
                  style={{
                    color: PRIORITY_COLOR[todo.priority],
                    backgroundColor: PRIORITY_COLOR[todo.priority] + '18',
                    borderColor: PRIORITY_COLOR[todo.priority] + '40',
                  }}
                >
                  <Flag size={9} style={{ fill: PRIORITY_COLOR[todo.priority] }} />
                  {PRIORITY_LABEL[todo.priority]}
                </span>
              )}

              {todo.notes && (
                <span className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                  <FileText size={10} />
                  <span className="truncate max-w-[160px]">{todo.notes}</span>
                </span>
              )}
            </div>
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(todo.id)}
            className="mt-0.5 p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-white hover:bg-red-500 transition-colors shrink-0"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* ── Desktop row (≥ sm) ─────────────────────────────────── */}
      <div
        className={cn(
          "hidden sm:flex items-start gap-3 px-4 py-3.5 mx-2 my-1 rounded-2xl transition-all duration-300 border border-transparent",
          hovered && "bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm",
          isDragging && "bg-white dark:bg-zinc-800 shadow-xl border-zinc-300 dark:border-zinc-700 z-50 scale-[1.02]",
          todo.is_completed && "opacity-60 grayscale-[0.5]"
        )}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className={cn(
            "mt-0.5 text-zinc-300 dark:text-zinc-600 cursor-grab active:cursor-grabbing transition-opacity shrink-0",
            hovered ? "opacity-100" : "opacity-0"
          )}
          tabIndex={-1}
        >
          <GripVertical size={14} />
        </button>

        {/* Checkbox */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => onToggle(todo.id)}
          className={cn(
            "mt-0.5 w-5 h-5 rounded-md shrink-0 border-2 flex items-center justify-center transition-all duration-300",
            todo.is_completed ? "border-transparent" : "hover:scale-110"
          )}
          style={{
            borderColor: todo.is_completed ? 'transparent' : listColor,
            backgroundColor: todo.is_completed ? listColor : 'transparent',
            boxShadow: todo.is_completed ? `0 0 12px ${listColor}40` : 'none'
          }}
        >
          <AnimatePresence>
            {todo.is_completed && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 28 }}
              >
                <Check size={12} color="white" strokeWidth={3.5} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Content */}
        <button className="flex-1 text-left min-w-0 flex flex-col gap-1" onClick={() => onSelect(todo)}>
          <p
            className={cn(
              "text-[15px] leading-snug transition-all duration-300",
              todo.is_completed
                ? "line-through text-zinc-400 dark:text-zinc-500"
                : "text-zinc-800 dark:text-zinc-100 font-bold"
            )}
          >
            {todo.title}
          </p>

          {(todo.due_date || todo.notes) && (
            <div className="flex items-center gap-3 flex-wrap">
              {todo.due_date && (
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-md border",
                    isOverdue
                      ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
                      : "text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                  )}
                >
                  <CalendarDays size={10} />
                  {formatDueDate(todo.due_date)}
                </span>
              )}
              {todo.notes && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[200px] font-medium border-l border-zinc-300 dark:border-zinc-700 pl-3">
                  {todo.notes}
                </span>
              )}
            </div>
          )}
        </button>

        {/* Priority flag + delete */}
        <div className="flex items-center gap-2 mt-0.5 shrink-0">
          {todo.priority !== 'none' && (
            <div className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <Flag
                size={12}
                style={{
                  color: PRIORITY_COLOR[todo.priority],
                  fill: PRIORITY_COLOR[todo.priority],
                }}
              />
            </div>
          )}
          <AnimatePresence>
            {hovered && (
              <motion.button
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.1 }}
                onClick={() => onDelete(todo.id)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-red-500 transition-colors shadow-sm"
              >
                <Trash2 size={13} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
