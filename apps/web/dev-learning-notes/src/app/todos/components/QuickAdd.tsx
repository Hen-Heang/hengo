"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, CalendarDays, Clock, Flag, AlignLeft, X, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Todo, Priority } from "@/types/todos";

interface Props {
  onAdd: (title: string, fields?: Partial<Todo>) => void | Promise<unknown>;
  color?: string;
}

export function QuickAdd({ onAdd, color = '#007AFF' }: Props) {
  const [active, setActive] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [value, setValue]   = useState('');
  const [notes, setNotes]   = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<Priority>('none');
  
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    const trimmed = value.trim();
    if (!trimmed) { reset(); return; }
    
    const fields: Partial<Todo> = {
      notes: notes.trim() || null,
      due_date: dueDate || null,
      due_time: dueTime || null,
      priority: priority,
    };

    reset();
    await onAdd(trimmed, fields);
  }

  function reset() {
    setActive(false);
    setExpanded(false);
    setValue('');
    setNotes('');
    setDueDate('');
    setDueTime('');
    setPriority('none');
  }

  const PRIORITIES: { value: Priority; label: string; color: string }[] = [
    { value: 'none',   label: 'None',   color: '#71717a' },
    { value: 'low',    label: 'Low',    color: '#6366f1' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high',   label: 'High',   color: '#ef4444' },
  ];

  return (
    <div className="border-t border-zinc-100 dark:border-zinc-800/60 px-4 py-3 shrink-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <AnimatePresence mode="wait">
        {active ? (
          <motion.div
            key="input-container"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-md border-2 shrink-0 opacity-50"
                style={{ borderColor: color }}
              />

              <input
                ref={inputRef}
                autoFocus
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !expanded)  submit();
                  if (e.key === 'Escape') reset();
                }}
                placeholder="What needs to be done?"
                className="flex-1 bg-transparent text-[15px] font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
              />

              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title={expanded ? "Show less" : "Add details (date, notes, priority)"}
              >
                {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={reset}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={submit}
                  disabled={!value.trim()}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-90 shadow-sm disabled:opacity-30 disabled:grayscale"
                  style={{ backgroundColor: color, color: 'white' }}
                >
                  Create
                </button>
              </div>
            </div>

            {/* Expanded Options */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-4 pt-2 pb-1"
                >
                  {/* Notes */}
                  <div className="flex gap-3">
                    <AlignLeft size={16} className="text-zinc-400 mt-1.5 shrink-0" />
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Add notes..."
                      rows={2}
                      className="flex-1 text-sm bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-500 outline-none resize-none focus:ring-1 ring-zinc-300 dark:ring-zinc-700 transition-all"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {/* Date */}
                    <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 min-w-[140px]">
                      <CalendarDays size={14} className="text-emerald-500 shrink-0" />
                      <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        className="bg-transparent text-[13px] font-bold text-zinc-700 dark:text-zinc-300 outline-none w-full"
                      />
                    </div>

                    {/* Time */}
                    {dueDate && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 min-w-[110px]"
                      >
                        <Clock size={14} className="text-amber-500 shrink-0" />
                        <input
                          type="time"
                          value={dueTime}
                          onChange={e => setDueTime(e.target.value)}
                          className="bg-transparent text-[13px] font-bold text-zinc-700 dark:text-zinc-300 outline-none w-full"
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Priority */}
                  <div className="flex items-center gap-3">
                    <Flag size={14} className="text-rose-500 shrink-0" />
                    <div className="flex gap-1.5">
                      {PRIORITIES.map(p => (
                        <button
                          key={p.value}
                          onClick={() => setPriority(p.value)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all",
                            priority === p.value
                              ? "text-white shadow-sm"
                              : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                          )}
                          style={priority === p.value ? { backgroundColor: p.color } : undefined}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.button
            key="trigger"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setActive(true)}
            className="flex items-center gap-3 text-[15px] font-bold w-full group transition-all"
            style={{ color }}
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-sm"
              style={{ backgroundColor: color }}
            >
              <Plus size={14} color="white" strokeWidth={3} />
            </div>
            New Task
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

