"use client";

import { useState, useMemo } from "react";
import { Search, X, Command } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NoteCard } from "@/components/NoteCard";
import type { NoteMeta } from "@/lib/notes";

export function NoteSearch({ notes }: { notes: NoteMeta[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        (n.category ?? "").toLowerCase().includes(q) ||
        (n.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
    );
  }, [query, notes]);

  return (
    <div>
      {/* Search input - Command Palette Style */}
      <div className="relative mb-10 group">
        <div className="absolute -inset-1 bg-linear-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />

        <div className="relative flex items-center bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 transition-all duration-300 group-focus-within:border-zinc-300 dark:group-focus-within:border-zinc-700 group-focus-within:bg-zinc-100 dark:group-focus-within:bg-zinc-900 shadow-md dark:shadow-2xl">
          <Search
            size={18}
            className="text-zinc-400 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors mr-3"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for topics, concepts, or stacks..."
            className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
          />

          <div className="flex items-center gap-2">
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setQuery("")}
                  className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <X size={16} />
                </motion.button>
              )}
            </AnimatePresence>
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-200/50 dark:bg-zinc-800/50 border border-zinc-300/50 dark:border-zinc-700/50 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
              <Command size={10} />
              <span>K</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-600"
          >
            <Search size={40} className="mb-4 opacity-20" />
            <p className="text-sm">No topics match &quot;{query}&quot;</p>
            <button
              onClick={() => setQuery("")}
              className="mt-4 text-xs text-emerald-500 hover:underline"
            >
              Clear search query
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            layout
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filtered.map((note, i) => (
              <NoteCard key={note.slug} {...note} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
