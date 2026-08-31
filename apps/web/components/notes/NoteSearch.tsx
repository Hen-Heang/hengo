"use client"

import { useMemo, useState } from "react"
import { Search, Star, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { NoteCard } from "@/components/notes/NoteCard"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useNoteSearch } from "@/hooks/useNotes"
import {
  filterNotesMeta,
  NOTE_TYPES,
  sortNotesMeta,
  type NoteMeta,
  type NoteType,
} from "@/lib/notes"
import { cn } from "@/lib/utils"

export function NoteSearch({ notes }: { notes: NoteMeta[] }) {
  const [query, setQuery] = useState("")
  const [noteType, setNoteType] = useState<NoteType | "all">("all")
  const [pinnedOnly, setPinnedOnly] = useState(false)

  const hasQuery = query.trim().length > 0
  const { results: searchResults, searching, error: searchError } = useNoteSearch(query)

  // A typed query searches note CONTENT server-side (bounded, RLS-safe) —
  // never an unlimited client-side scan. With no query, filter the already-
  // fetched metadata list locally (title/description/category/tags only).
  const filtered = useMemo(() => {
    const base = hasQuery ? searchResults : notes
    const withTypeAndPin = filterNotesMeta(base, {
      noteType,
      pinnedOnly,
      query: hasQuery ? "" : query,
    })
    return sortNotesMeta(withTypeAndPin)
  }, [hasQuery, searchResults, notes, noteType, pinnedOnly, query])

  return (
    <div>
      {/* Search input */}
      <div className="group relative mb-4">
        <div className="relative flex min-h-11 items-center rounded-lg border border-border bg-card/80 px-3 shadow-sm transition-colors group-focus-within:border-blue-500/40">
          <Search
            size={18}
            className="mr-3 text-muted-foreground transition-colors group-focus-within:text-blue-500"
          />
          <input
            type="text"
            aria-label="Search notes"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className="h-11 min-w-0 flex-1 bg-transparent text-base text-foreground placeholder-muted-foreground/60 focus:outline-none sm:text-sm"
          />

          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear note search"
                className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Select value={noteType} onValueChange={(value) => setNoteType(value as NoteType | "all")}>
          <SelectTrigger className="w-36" aria-label="Filter by note type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {NOTE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={() => setPinnedOnly((v) => !v)}
          aria-pressed={pinnedOnly}
          className={cn(
            "flex h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors",
            pinnedOnly
              ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          <Star size={14} className={pinnedOnly ? "fill-current" : ""} />
          Pinned
        </button>
        {hasQuery && searching && <span className="text-xs text-muted-foreground">Searching…</span>}
        {searchError && <span className="text-xs text-destructive">{searchError}</span>}
      </div>

      {/* Results */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-12 text-muted-foreground"
          >
            <Search size={40} className="mb-4 opacity-20" />
            <p className="text-sm">
              {query ? `No notes match "${query}"` : "No notes yet — create your first one."}
            </p>
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-4 min-h-11 px-3 text-sm text-blue-500 hover:underline"
              >
                Clear search
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div key="results" layout className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((note, i) => (
              <NoteCard
                key={note.slug}
                slug={note.slug}
                title={note.title}
                description={note.description}
                icon={note.icon}
                noteType={note.noteType}
                pinned={note.pinned}
                index={i}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
