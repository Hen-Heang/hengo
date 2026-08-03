"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, ChevronRight, ChevronLeft, Pencil, X, Check, Loader2, NotebookPen } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  type StudyTask,
  type TaskStatus,
} from "@/app/actions/tasks";

// ─── Constants ───────────────────────────────────────────────────────────────

const COLUMNS: { status: TaskStatus; label: string; color: string; dimColor: string }[] = [
  { status: "todo",  label: "Todo",  color: "text-zinc-500 dark:text-zinc-400",   dimColor: "border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-100/30 dark:bg-zinc-900/30" },
  { status: "doing", label: "Doing", color: "text-amber-600 dark:text-amber-400",  dimColor: "border-amber-500/20 bg-amber-500/5" },
  { status: "done",  label: "Done",  color: "text-emerald-600 dark:text-emerald-400", dimColor: "border-emerald-500/20 bg-emerald-500/5" },
];

const PREV: Record<TaskStatus, TaskStatus | null> = { todo: null,    doing: "todo",  done: "doing" };
const NEXT: Record<TaskStatus, TaskStatus | null> = { todo: "doing", doing: "done",  done: null    };

// ─── Empty add-form state ────────────────────────────────────────────────────

const EMPTY_FORM = { title: "", phase: "", category: "", notes: "" };

interface CardProps {
  task: StudyTask;
  onOptimisticUpdate: (id: string, patch: Partial<StudyTask>) => void;
  onOptimisticDelete: (id: string) => void;
}

function TaskCard({ task, onOptimisticUpdate, onOptimisticDelete }: CardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: task.title, phase: task.phase, category: task.category, notes: task.notes });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const prevStatus = PREV[task.status];
  const nextStatus = NEXT[task.status];

  function handleMoveStatus(to: TaskStatus) {
    onOptimisticUpdate(task.id, { status: to });
    startTransition(() => updateTaskAction(task.id, { status: to }));
  }

  function handleSave() {
    onOptimisticUpdate(task.id, draft);
    startTransition(async () => {
      await updateTaskAction(task.id, draft);
      setEditing(false);
    });
  }

  function handleDelete() {
    onOptimisticDelete(task.id);
    startTransition(() => deleteTaskAction(task.id));
  }

  if (editing) {
    return (
      <motion.div
        layout
        className="rounded-2xl border border-emerald-500/30 bg-zinc-100/80 dark:bg-zinc-900/80 p-4 space-y-3"
      >
        <input
          autoFocus
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="Task title"
          className="w-full bg-transparent text-sm font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none"
        />
        <div className="flex gap-2">
          <input
            value={draft.phase}
            onChange={(e) => setDraft((d) => ({ ...d, phase: e.target.value }))}
            placeholder="Phase (e.g. Phase 01)"
            className="flex-1 bg-zinc-200/60 dark:bg-zinc-950/60 text-xs text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 rounded-lg px-3 py-1.5 focus:outline-none border border-zinc-300 dark:border-zinc-800 focus:border-emerald-500/40"
          />
          <input
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            placeholder="Category"
            className="flex-1 bg-zinc-200/60 dark:bg-zinc-950/60 text-xs text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 rounded-lg px-3 py-1.5 focus:outline-none border border-zinc-300 dark:border-zinc-800 focus:border-emerald-500/40"
          />
        </div>
        <textarea
          value={draft.notes}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          placeholder="Notes..."
          rows={3}
          className="w-full bg-zinc-200/60 dark:bg-zinc-950/60 text-xs text-zinc-600 dark:text-zinc-400 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 rounded-lg px-3 py-2 focus:outline-none border border-zinc-300 dark:border-zinc-800 focus:border-emerald-500/40 resize-none leading-relaxed"
        />
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-emerald-950 text-xs font-bold transition-colors"
          >
            {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Save
          </button>
          <button
            onClick={() => { setEditing(false); setDraft({ title: task.title, phase: task.phase, category: task.category, notes: task.notes }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-medium transition-colors"
          >
            <X size={12} /> Cancel
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 hover:border-zinc-300/60 dark:hover:border-zinc-700/60 hover:bg-white/80 dark:hover:bg-zinc-900/80 transition-all duration-200 p-4 space-y-2.5"
    >
      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        {task.phase && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-zinc-500 bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-zinc-700/50">
            {task.phase}
          </span>
        )}
        {task.category && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200/40 dark:border-zinc-700/40">
            {task.category}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-snug">{task.title}</p>

      {/* Notes preview */}
      {task.notes && (
        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{task.notes}</p>
      )}

      {/* Action row */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1">
          {prevStatus && (
            <button
              onClick={() => handleMoveStatus(prevStatus)}
              disabled={isPending}
              title={`Move to ${prevStatus}`}
              className="p-1 rounded-lg text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => handleMoveStatus(nextStatus)}
              disabled={isPending}
              title={`Move to ${nextStatus}`}
              className="p-1 rounded-lg text-zinc-400 dark:text-zinc-600 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded-lg text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Pencil size={13} />
          </button>

          {showDeleteConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-500 text-[10px] font-bold text-white transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 size={10} className="animate-spin" /> : "Yes"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2 py-0.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1 rounded-lg text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface AddFormProps {
  status: TaskStatus;
  onClose: () => void;
  onAdd: (task: StudyTask) => void;
}

function AddForm({ status, onClose, onAdd }: AddFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!form.title.trim()) return;
    const optimistic: StudyTask = {
      id: crypto.randomUUID(),
      ...form,
      status,
      sort_order: 999,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onAdd(optimistic);
    onClose();
    startTransition(() =>
      createTaskAction({ ...form, status, sort_order: 999 })
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl border border-emerald-500/30 bg-zinc-100/80 dark:bg-zinc-900/80 p-4 space-y-3"
    >
      <input
        autoFocus
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Task title"
        className="w-full bg-transparent text-sm font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none"
      />
      <div className="flex gap-2">
        <input
          value={form.phase}
          onChange={(e) => setForm((f) => ({ ...f, phase: e.target.value }))}
          placeholder="Phase (e.g. Phase 01)"
          className="flex-1 bg-zinc-200/60 dark:bg-zinc-950/60 text-xs text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 rounded-lg px-3 py-1.5 focus:outline-none border border-zinc-300 dark:border-zinc-800 focus:border-emerald-500/40"
        />
        <input
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          placeholder="Category"
          className="flex-1 bg-zinc-200/60 dark:bg-zinc-950/60 text-xs text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 rounded-lg px-3 py-2 focus:outline-none border border-zinc-300 dark:border-zinc-800 focus:border-emerald-500/40"
        />
      </div>
      <textarea
        value={form.notes}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        placeholder="Notes (optional)..."
        rows={2}
        className="w-full bg-zinc-200/60 dark:bg-zinc-950/60 text-xs text-zinc-600 dark:text-zinc-400 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 rounded-lg px-3 py-2 focus:outline-none border border-zinc-300 dark:border-zinc-800 focus:border-emerald-500/40 resize-none leading-relaxed"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={!form.title.trim() || isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-emerald-950 text-xs font-bold transition-colors"
        >
          {isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Add
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs font-medium transition-colors"
        >
          <X size={12} /> Cancel
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StudyTasks({ initialTasks }: { initialTasks: StudyTask[] }) {
  const [tasks, setTasks] = useState<StudyTask[]>(initialTasks);
  const [addingTo, setAddingTo] = useState<TaskStatus | null>(null);

  function handleOptimisticUpdate(id: string, patch: Partial<StudyTask>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function handleOptimisticDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleAdd(task: StudyTask) {
    setTasks((prev) => [...prev, task]);
  }

  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-900/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.06),transparent_40%)]" />

      {/* Header */}
      <div className="relative border-b border-zinc-200/60 dark:border-zinc-800/60 px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
              <NotebookPen size={12} />
              <span>Study Tasks</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">Tech Note Board</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Track what you&apos;re learning. Add, edit, move, and delete tasks like Notion.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {total > 0 && (
              <div className="text-xs font-mono text-zinc-500">
                <span className="text-emerald-500 dark:text-emerald-400 font-bold">{doneCount}</span>/{total} done
              </div>
            )}
            <button
              onClick={() => setAddingTo("todo")}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-600 dark:text-emerald-300 transition-colors hover:bg-emerald-500/15"
            >
              <Plus size={15} />
              Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="relative grid grid-cols-1 gap-6 p-6 sm:p-8 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          const isAdding = addingTo === col.status;

          return (
            <div key={col.status} className="flex flex-col gap-3">
              {/* Column Header */}
              <div className={cn("flex items-center justify-between px-3 py-2 rounded-xl border", col.dimColor)}>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-bold uppercase tracking-wider", col.color)}>
                    {col.label}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100/60 dark:bg-zinc-900/60 px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-800/50">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => setAddingTo(isAdding ? null : col.status)}
                  className="p-1 rounded-lg text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-colors"
                >
                  <Plus size={13} />
                </button>
              </div>

              {/* Add form */}
              <AnimatePresence>
                {isAdding && (
                  <AddForm
                    key="add-form"
                    status={col.status}
                    onClose={() => setAddingTo(null)}
                    onAdd={handleAdd}
                  />
                )}
              </AnimatePresence>

              {/* Cards */}
              <AnimatePresence mode="popLayout">
                {colTasks.length === 0 && !isAdding ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8 rounded-2xl border border-dashed border-zinc-200/60 dark:border-zinc-800/60 text-zinc-400 dark:text-zinc-700 text-xs text-center gap-2"
                  >
                    <span>No tasks yet</span>
                    <button
                      onClick={() => setAddingTo(col.status)}
                      className="text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 underline underline-offset-2 transition-colors"
                    >
                      + Add one
                    </button>
                  </motion.div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onOptimisticUpdate={handleOptimisticUpdate}
                      onOptimisticDelete={handleOptimisticDelete}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
