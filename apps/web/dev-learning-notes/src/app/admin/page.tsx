"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Note } from "@/lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Pencil, Trash2, X, Save, ChevronLeft, LogOut, ListChecks } from "lucide-react";
import Link from "next/link";

const EMPTY_FORM = {
  slug: "",
  title: "",
  description: "",
  category: "",
  content: "",
  tags: "",
};

export default function AdminPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadNotes() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/notes", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setNotes([]);
        setError(data.error ?? "Failed to load notes.");
        return;
      }

      setNotes(Array.isArray(data) ? data : []);
    } catch {
      setNotes([]);
      setError("Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, []);

  async function handleLogout() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingSlug(null);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function openEdit(note: Note) {
    setForm({
      slug: note.slug,
      title: note.title,
      description: note.description ?? "",
      category: note.category ?? "",
      content: note.content ?? "",
      tags: (note.tags ?? []).join(", "),
    });
    setEditingSlug(note.slug);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.slug || !form.title || !form.content) {
      setError("Slug, title, and content are required.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      slug: form.slug,
      title: form.title,
      description: form.description,
      category: form.category,
      content: form.content,
      tags: form.tags
        ? form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
    };

    try {
      const res = editingSlug
        ? await fetch(`/api/notes/${editingSlug}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setShowForm(false);
      setNotice(editingSlug ? "Note updated." : "Note created.");
      await loadNotes();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slug: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    setError("");
    setNotice("");

    try {
      const res = await fetch(`/api/notes/${slug}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Delete failed.");
        return;
      }

      setNotice(`Deleted "${title}".`);
      await loadNotes();
    } catch {
      setError("Delete failed.");
    }
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <Link
            href="/"
            className="flex items-center gap-1 text-xs font-mono text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors mb-2"
          >
            <ChevronLeft size={13} /> home
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Owner Panel</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Full access to {notes.length} note{notes.length !== 1 ? "s" : ""} in Supabase
          </p>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <Link
            href="/admin/tracker"
            className="flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-sm rounded-lg transition-colors"
          >
            <ListChecks size={15} />
            Study Tracker
          </Link>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus size={15} /> New Note
          </button>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="flex items-center gap-2 px-3 py-2 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-sm rounded-lg transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {notice && (
        <p className="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-400/10 border border-emerald-200 dark:border-emerald-400/20 rounded-lg px-4 py-3 mb-5">
          {notice}
        </p>
      )}

      {error && !showForm && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/20 rounded-lg px-4 py-3 mb-5">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-zinc-500 text-sm font-mono animate-pulse">Loading...</p>
      ) : notes.length === 0 && !error ? (
        <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          <p className="text-zinc-500 dark:text-zinc-600 text-sm font-mono mb-2">No notes in Supabase yet.</p>
          <p className="text-zinc-400 dark:text-zinc-700 text-xs">Click &quot;New Note&quot; to add one.</p>
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          {notes.map((note, i) => (
            <div
              key={note.id}
              className={`flex items-center gap-4 px-5 py-4 ${
                i < notes.length - 1 ? "border-b border-zinc-100 dark:border-zinc-800" : ""
              } hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{note.slug}</span>
                  {note.category && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      {note.category}
                    </span>
                  )}
                </div>
                <p className="text-zinc-800 dark:text-zinc-200 text-sm font-medium mt-0.5 truncate">{note.title}</p>
                {note.description && (
                  <p className="text-zinc-500 text-xs mt-0.5 truncate">{note.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(note)}
                  aria-label={`Edit ${note.title}`}
                  className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(note.slug, note.title)}
                  aria-label={`Delete ${note.title}`}
                  className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 dark:bg-zinc-950/80 backdrop-blur-sm z-40"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {editingSlug ? "Edit Note" : "New Note"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  aria-label="Close editor"
                  className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/20 rounded-lg px-4 py-3">
                    {error}
                  </p>
                )}

                {[
                  { label: "Slug", key: "slug", placeholder: "springboot", mono: true, disabled: !!editingSlug },
                  { label: "Title", key: "title", placeholder: "Spring Boot" },
                  { label: "Description", key: "description", placeholder: "Short description..." },
                  { label: "Category", key: "category", placeholder: "backend" },
                  { label: "Tags (comma-separated)", key: "tags", placeholder: "spring, java, rest" },
                ].map(({ label, key, placeholder, mono, disabled }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">{label}</label>
                    <input
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
                      placeholder={placeholder}
                      disabled={disabled}
                      className={`w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        mono ? "font-mono" : ""
                      }`}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Content <span className="text-zinc-400 dark:text-zinc-600">(Markdown)</span>
                  </label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm((current) => ({ ...current, content: e.target.value }))}
                    placeholder={"# Title\n\nWrite markdown here..."}
                    rows={16}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 text-sm font-semibold rounded-lg transition-colors"
                >
                  <Save size={15} />
                  {saving ? "Saving..." : editingSlug ? "Save Changes" : "Create Note"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
