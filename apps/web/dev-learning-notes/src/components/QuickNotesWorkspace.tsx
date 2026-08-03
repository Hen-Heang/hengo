"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  FileText,
  Lightbulb,
  NotebookPen,
  Pin,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface WorkspaceNote {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  updatedAt: string;
}

const STORAGE_KEY = "dev-notes-workspace";

const DEFAULT_NOTES: WorkspaceNote[] = [
  {
    id: "welcome-note",
    title: "Study sprint",
    body:
      "Write short notes while reading docs. Save decisions, mistakes, and next steps so updates stay easy later.",
    pinned: true,
    updatedAt: new Date().toISOString(),
  },
];

const TIPS = [
  "Capture one idea per note so deleting or updating stays simple.",
  "Keep action items at the top: fix, test, refactor, ship.",
  "Turn repeated solutions into short templates you can reuse.",
];

function sortNotes(notes: WorkspaceNote[]) {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function QuickNotesWorkspace() {
  const [notes, setNotes] = useState<WorkspaceNote[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const stored = raw ? (JSON.parse(raw) as WorkspaceNote[]) : DEFAULT_NOTES;
      const nextNotes = stored.length > 0 ? sortNotes(stored) : DEFAULT_NOTES;
      setNotes(nextNotes);
      setActiveId(nextNotes[0]?.id ?? "");
    } catch {
      setNotes(DEFAULT_NOTES);
      setActiveId(DEFAULT_NOTES[0].id);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes, ready]);

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeId) ?? null,
    [activeId, notes]
  );

  function createNote() {
    const note: WorkspaceNote = {
      id: crypto.randomUUID(),
      title: "Untitled note",
      body: "",
      pinned: false,
      updatedAt: new Date().toISOString(),
    };

    const nextNotes = sortNotes([note, ...notes]);
    setNotes(nextNotes);
    setActiveId(note.id);
  }

  function updateNote(id: string, patch: Partial<WorkspaceNote>) {
    setNotes((current) =>
      sortNotes(
        current.map((note) =>
          note.id === id
            ? { ...note, ...patch, updatedAt: new Date().toISOString() }
            : note
        )
      )
    );
  }

  function deleteNote(id: string) {
    const nextNotes = notes.filter((note) => note.id !== id);
    setNotes(nextNotes);

    if (activeId === id) {
      setActiveId(nextNotes[0]?.id ?? "");
    }
  }

  return (
    <section
      id="workspace"
      className="relative overflow-hidden rounded-[2rem] border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-900/40"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.06),transparent_35%)]" />

      <div className="relative border-b border-zinc-200/60 dark:border-zinc-800/60 px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
              <NotebookPen size={12} />
              <span>Quick Notes</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
              Personal workspace for fast note updates
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Add scratch notes, edit them in place, pin important ones, and
              remove anything you do not need. This stays local to your browser.
            </p>
          </div>

          <button
            type="button"
            onClick={createNote}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300 transition-colors hover:bg-emerald-500/15 hover:text-emerald-500 dark:hover:text-emerald-200"
          >
            <Plus size={16} />
            <span>Add note</span>
          </button>
        </div>
      </div>

      <div className="relative grid gap-6 p-6 sm:p-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-100/70 dark:bg-zinc-950/70 p-3">
            <div className="mb-3 flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
                <FileText size={14} />
                <span>Workspace Notes</span>
              </div>
              <span className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-zinc-500">
                {notes.length}
              </span>
            </div>

            <div className="space-y-2">
              {notes.map((note) => {
                const active = note.id === activeId;

                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setActiveId(note.id)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-left transition-all",
                      active
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-transparent bg-zinc-200/70 dark:bg-zinc-900/70 hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-900"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 rounded-xl border p-2",
                          active
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                            : "border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-zinc-500"
                        )}
                      >
                        {note.pinned ? <Pin size={14} /> : <FileText size={14} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                          {note.title || "Untitled note"}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
                          {note.body || "Start writing ideas, tasks, or doc summaries."}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-100/70 dark:bg-zinc-950/70 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              <Lightbulb size={16} className="text-amber-500 dark:text-amber-300" />
              <span>Writing tips</span>
            </div>
            <div className="space-y-3">
              {TIPS.map((tip) => (
                <div
                  key={tip}
                  className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-200/70 dark:bg-zinc-900/70 px-4 py-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400"
                >
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-100/80 dark:bg-zinc-950/80 p-5 sm:p-6">
          <AnimatePresence mode="wait">
            {activeNote ? (
              <motion.div
                key={activeNote.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-5 flex flex-col gap-4 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
                      Last edited {new Date(activeNote.updatedAt).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Local workspace note. Updates save automatically.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateNote(activeNote.id, { pinned: !activeNote.pinned })
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-200/50 dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 transition-colors hover:border-zinc-400 dark:hover:border-zinc-700 hover:text-zinc-800 dark:hover:text-white"
                    >
                      <Pin size={14} />
                      <span>{activeNote.pinned ? "Unpin" : "Pin"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteNote(activeNote.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500 dark:text-red-300 transition-colors hover:bg-red-500/15"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={(event) =>
                      updateNote(activeNote.id, { title: event.target.value })
                    }
                    placeholder="Note title"
                    className="w-full border-none bg-transparent px-0 text-2xl font-bold text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  />

                  <textarea
                    value={activeNote.body}
                    onChange={(event) =>
                      updateNote(activeNote.id, { body: event.target.value })
                    }
                    placeholder="Write decisions, TODOs, doc summaries, or code reminders..."
                    className="min-h-[360px] w-full resize-none rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/60 dark:bg-zinc-900/60 p-5 text-sm leading-7 text-zinc-700 dark:text-zinc-200 outline-none transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-emerald-500/30"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex min-h-[420px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-200/40 dark:bg-zinc-900/40 p-8 text-center"
              >
                <NotebookPen size={32} className="mb-4 text-zinc-400 dark:text-zinc-600" />
                <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">
                  Create your first quick note
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                  Use this area like a lightweight note app for ideas, doc
                  checklists, and follow-up tasks.
                </p>
                <button
                  type="button"
                  onClick={createNote}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300 transition-colors hover:bg-emerald-500/15"
                >
                  <Plus size={16} />
                  <span>Add note</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
