"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CalendarDays, Clock, Flag, AlignLeft, Layers, Trash2, Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Todo, TodoListWithCount, Priority } from "@/types/todos";

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'none',   label: 'None',   color: '#71717a' },
  { value: 'low',    label: 'Low',    color: '#6366f1' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high',   label: 'High',   color: '#ef4444' },
];

interface Props {
  todo: Todo | null;
  lists: TodoListWithCount[];
  onClose: () => void;
  onSave: (id: string, patch: Partial<Todo>) => void;
  onDelete: (id: string) => void;
}

export function TodoDetail({ todo, lists, onClose, onSave, onDelete }: Props) {
  const [title,    setTitle]    = useState('');
  const [notes,    setNotes]    = useState('');
  const [dueDate,  setDueDate]  = useState('');
  const [dueTime,  setDueTime]  = useState('');
  const [priority, setPriority] = useState<Priority>('none');
  const [listId,   setListId]   = useState('');
  const [notify,   setNotify]   = useState(false);

  // Sync local state whenever the selected todo changes
  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setNotes(todo.notes ?? '');
      setDueDate(todo.due_date ?? '');
      setDueTime(todo.due_time ?? '');
      setPriority(todo.priority);
      setListId(todo.list_id ?? '');
      setNotify(todo.notify ?? false);
    }
  }, [todo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pass overrides to avoid stale-closure issues when saving immediately
  // after setState (priority / list selectors).
  function flush(overrides?: { priority?: Priority; list_id?: string | null; due_date?: string | null; due_time?: string | null }) {
    if (!todo) return;
    onSave(todo.id, {
      title:    title.trim() || todo.title,
      notes:    notes.trim() || null,
      due_date: overrides !== undefined && 'due_date' in overrides ? overrides.due_date : (dueDate || null),
      due_time: overrides !== undefined && 'due_time' in overrides ? overrides.due_time : (dueTime || null),
      priority: overrides?.priority ?? priority,
      list_id:  overrides !== undefined && 'list_id' in overrides ? overrides.list_id : (listId || null),
    });
  }

  function handleClose() {
    flush();
    onClose();
  }

  function handleDelete() {
    if (!todo) return;
    onDelete(todo.id);
    onClose();
  }

  return (
    <AnimatePresence>
      {todo && (
        <>
          {/* Scrim */}
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={cn(
              "fixed z-50 bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-2xl border-t sm:border border-zinc-200 dark:border-zinc-800",
              // Mobile: full-width bottom sheet
              "bottom-0 inset-x-0 rounded-t-[2.5rem] pb-safe",
              // sm+: floating card on the right
              "sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:pb-0",
              "sm:right-6 sm:left-auto sm:inset-x-auto sm:w-[380px] sm:rounded-3xl"
            )}
          >
            {/* Drag pill (mobile) */}
            <div className="flex justify-center pt-4 pb-2 sm:hidden">
              <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200/50 dark:border-zinc-800/50">
              <button
                onClick={handleDelete}
                className="p-2.5 rounded-2xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-90"
              >
                <Trash2 size={18} />
              </button>
              <h3 className="text-[10px] font-black tracking-widest uppercase text-zinc-400 dark:text-zinc-500">Task Intelligence</h3>
              <button
                onClick={handleClose}
                className="text-sm font-black text-indigo-500 hover:text-indigo-400 transition-all bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-xl active:scale-95 shadow-sm"
              >
                Done
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-7 overflow-y-auto max-h-[80dvh] sm:max-h-[65vh]">

              {/* Title */}
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={() => flush()}
                placeholder="What needs to be done?"
                className="w-full text-xl font-black bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400/60 outline-none pb-2 border-b-2 border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 transition-colors"
              />

              {/* Notes */}
              <div className="flex gap-4">
                <AlignLeft size={20} className="text-indigo-500 mt-1 shrink-0" />
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  onBlur={() => flush()}
                  placeholder="Add details, links, or context..."
                  rows={3}
                  className="flex-1 text-[15px] font-medium bg-zinc-100/50 dark:bg-zinc-950/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-4 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none resize-none focus:ring-2 ring-indigo-500/20 transition-all"
                />
              </div>

              {/* Due date */}
              <div className="flex items-center gap-4">
                <CalendarDays size={18} className="text-emerald-500 shrink-0" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  onBlur={() => flush()}
                  className="flex-1 text-[15px] font-bold bg-zinc-100/50 dark:bg-zinc-950/50 rounded-xl px-4 py-2.5 text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 ring-emerald-500/30 transition-all"
                />
                {dueDate && (
                  <button
                    onClick={() => { setDueDate(''); setDueTime(''); flush({ due_date: null, due_time: null }); }}
                    className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Due time */}
              <AnimatePresence>
                {dueDate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="flex items-center gap-4 overflow-hidden"
                  >
                    <Clock size={18} className="text-amber-500 shrink-0" />
                    <input
                      type="time"
                      value={dueTime}
                      onChange={e => setDueTime(e.target.value)}
                      onBlur={() => flush()}
                      className="flex-1 text-[15px] font-bold bg-zinc-100/50 dark:bg-zinc-950/50 rounded-xl px-4 py-2.5 text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 ring-amber-500/30 transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notification toggle — only visible when a due date is set */}
              <AnimatePresence>
                {dueDate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        const next = !notify;
                        setNotify(next);
                        if (todo) onSave(todo.id, { notify: next });
                        if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') {
                          Notification.requestPermission();
                        }
                      }}
                      className={cn(
                        "flex items-center gap-4 w-full py-2 rounded-xl transition-colors",
                        notify
                          ? "text-violet-500"
                          : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      )}
                    >
                      {notify
                        ? <Bell size={18} className="shrink-0" />
                        : <BellOff size={18} className="shrink-0" />}
                      <span className="text-[15px] font-bold">
                        {notify ? "Reminder on" : "Remind me"}
                      </span>
                      {notify && (
                        <span className="ml-auto text-[11px] font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                          {dueTime || "start of day"}
                        </span>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Priority */}
              <div className="flex items-center gap-4 pt-2">
                <Flag size={18} className="text-rose-500 shrink-0" />
                <div className="flex gap-2 flex-wrap flex-1">
                  {PRIORITIES.map(p => (
                    <button
                      key={p.value}
                      onClick={() => { setPriority(p.value); flush({ priority: p.value }); }}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-sm font-bold transition-all shadow-sm",
                        priority === p.value
                          ? "text-white scale-105"
                          : "bg-zinc-200/50 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-300/50 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300"
                      )}
                      style={priority === p.value ? { backgroundColor: p.color } : undefined}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* List selector */}
              {lists.length > 0 && (
                <div className="flex items-center gap-4 pt-2">
                  <Layers size={18} className="text-sky-500 shrink-0" />
                  <select
                    value={listId}
                    onChange={e => { const v = e.target.value; setListId(v); flush({ list_id: v || null }); }}
                    className="flex-1 text-[15px] font-bold bg-zinc-100/50 dark:bg-zinc-950/50 rounded-xl px-4 py-3 text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 ring-sky-500/30 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">No Workspace</option>
                    {lists.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
