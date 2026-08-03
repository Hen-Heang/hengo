"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ListChecks, Plus, Save, Trash2, X, Circle, Clock, CheckCircle2 } from "lucide-react";
import type { StudyTask, StudyTaskStatus } from "@/lib/study-tasks";

const COLUMNS: { id: StudyTaskStatus; label: string; icon: React.ElementType; color: string; bg: string; border: string }[] = [
  { id: "todo",  label: "To Do",       icon: Circle,       color: "text-zinc-500 dark:text-zinc-400",    bg: "bg-zinc-100/40 dark:bg-zinc-800/40",   border: "border-zinc-200/50 dark:border-zinc-700/50" },
  { id: "doing", label: "In Progress", icon: Clock,        color: "text-amber-500 dark:text-amber-400",  bg: "bg-amber-400/5",                        border: "border-amber-400/20" },
  { id: "done",  label: "Done",        icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-400/5",                   border: "border-emerald-400/20" },
];

const EMPTY_FORM = { title: "", phase: "Phase 1", category: "", notes: "", status: "todo" as StudyTaskStatus, sort_order: 999 };

export default function TrackerPage() {
  const [tasks,     setTasks]     = useState<StudyTask[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [notice,    setNotice]    = useState("");

  async function load() {
    setLoading(true);
    try {
      const res  = await fetch("/api/study-tasks", { cache: "no-store" });
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch { setTasks([]); }
    finally  { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const done  = tasks.filter(t => t.status === "done").length;
    const doing = tasks.filter(t => t.status === "doing").length;
    const todo  = tasks.filter(t => t.status === "todo").length;
    return { done, doing, todo, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
  }, [tasks]);

  async function moveTask(id: string, status: StudyTaskStatus) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    try {
      await fetch(`/api/study-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch { load(); }
  }

  async function deleteTask(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    await fetch(`/api/study-tasks/${id}`, { method: "DELETE" });
    setNotice(`Deleted "${title}".`);
    setTimeout(() => setNotice(""), 3000);
  }

  async function createTask() {
    if (!form.title || !form.phase || !form.category) { setError("Title, phase, and category are required."); return; }
    setSaving(true); setError("");
    try {
      const res  = await fetch("/api/study-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Create failed."); return; }
      setTasks(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
      setForm(EMPTY_FORM);
      setShowForm(false);
      setNotice("Task created.");
      setTimeout(() => setNotice(""), 3000);
    } catch { setError("Create failed."); }
    finally  { setSaving(false); }
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <Link href="/admin" className="flex items-center gap-1 text-xs font-mono text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors mb-2">
            <ChevronLeft size={13} /> owner panel
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <ListChecks size={22} className="text-amber-500 dark:text-amber-400" />
            Study Tracker
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Korea adaptation kanban — drag tasks through the pipeline</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-sm font-semibold rounded-lg transition-colors shrink-0"
        >
          <Plus size={15} /> New Task
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Progress", value: `${stats.pct}%`,    tone: "text-amber-500 dark:text-amber-300" },
          { label: "Done",     value: `${stats.done}`,    tone: "text-emerald-600 dark:text-emerald-300" },
          { label: "Doing",    value: `${stats.doing}`,   tone: "text-sky-500 dark:text-sky-300" },
          { label: "Todo",     value: `${stats.todo}`,    tone: "text-zinc-700 dark:text-zinc-300" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{c.label}</p>
            <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${c.tone}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 mb-8">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-amber-500 to-amber-400"
          initial={{ width: 0 }}
          animate={{ width: `${stats.pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Notices */}
      <AnimatePresence>
        {notice && (
          <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-400/10 border border-emerald-200 dark:border-emerald-400/20 rounded-lg px-4 py-3 mb-5">
            {notice}
          </motion.p>
        )}
        {error && (
          <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/20 rounded-lg px-4 py-3 mb-5">
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Kanban board */}
      {loading ? (
        <p className="text-zinc-500 text-sm font-mono animate-pulse">Loading tasks...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const Icon = col.icon;
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className={`rounded-2xl border ${col.border} ${col.bg} p-4 min-h-48`}>
                {/* Column header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon size={15} className={col.color} />
                    <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
                  </div>
                  <span className="text-xs font-mono text-zinc-500 tabular-nums">{colTasks.length}</span>
                </div>

                {/* Cards */}
                <div className="space-y-2.5">
                  <AnimatePresence mode="popLayout">
                    {colTasks.map(task => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 group"
                      >
                        {/* Card top row */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400/80 bg-amber-50 dark:bg-amber-400/8 border border-amber-200 dark:border-amber-400/15 px-1.5 py-0.5 rounded-full">
                              {task.phase}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded-full">
                              {task.category}
                            </span>
                          </div>
                          {!task.id.startsWith("local-") && (
                            <button
                              onClick={() => deleteTask(task.id, task.title)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-md transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>

                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 leading-snug mb-2">{task.title}</p>
                        {task.notes && (
                          <p className="text-xs text-zinc-500 leading-relaxed mb-3">{task.notes}</p>
                        )}

                        {/* Move buttons */}
                        <div className="flex gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                          {COLUMNS.filter(c => c.id !== col.id).map(target => (
                            <button
                              key={target.id}
                              onClick={() => moveTask(task.id, target.id)}
                              className={`text-[10px] font-mono px-2 py-1 rounded-md border transition-colors ${target.border} ${target.color} hover:opacity-80`}
                            >
                              → {target.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {colTasks.length === 0 && (
                    <p className="text-center text-xs text-zinc-400 dark:text-zinc-700 py-6 font-mono">empty</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New task slide-in panel */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 dark:bg-zinc-950/80 backdrop-blur-sm z-40" onClick={() => setShowForm(false)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">New Study Task</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/20 rounded-lg px-4 py-3">{error}</p>}

                {[
                  { label: "Title *", key: "title", placeholder: "Write 10 SQL joins" },
                  { label: "Phase *", key: "phase", placeholder: "Phase 3" },
                  { label: "Category *", key: "category", placeholder: "SQL / Spring / JSP..." },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">{label}</label>
                    <input
                      value={form[key as keyof typeof form] as string}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as StudyTaskStatus }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="todo">Todo</option>
                    <option value="doing">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={4}
                    placeholder="What exactly will you practice?"
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={createTask}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-950 text-sm font-semibold rounded-lg transition-colors"
                >
                  <Save size={15} />
                  {saving ? "Saving..." : "Create Task"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
