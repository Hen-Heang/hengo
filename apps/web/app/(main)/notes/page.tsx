"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { motion } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { NoteSearch } from "@/components/notes/NoteSearch"
import { Skeleton } from "@/components/ui/skeleton"
import { useNotes } from "@/hooks/useNotes"
import { useSessionTimer } from "@/hooks/useSessionTimer"
import { containerVariants, itemVariants } from "@/lib/motion"

export default function NotesPage() {
  useSessionTimer("notes")
  const { notes, loading, error } = useNotes()

  const noteCount = notes.length
  const categories = Array.from(new Set(notes.map((n) => n.category).filter(Boolean))).length

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-16"
    >
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Dev Notes"
          title="Knowledge Library"
          description="Your personal study notes — Java, Spring, SQL, Korean grammar, and anything worth saving."
          stats={[
            { label: "Notes", value: loading ? "..." : String(noteCount) },
            { label: "Topics", value: loading ? "..." : categories > 0 ? String(categories) : "—" },
            { label: "Format", value: "Markdown" },
          ]}
          actions={
            <Link
              href="/notes/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
              New note
            </Link>
          }
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-4/5" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <p className="text-sm font-bold text-muted-foreground/60">{error}</p>
            <p className="text-xs text-muted-foreground/40">
              The notes backend may not be wired yet — you can still create a note once
              <span className="font-mono"> /notes </span> is live.
            </p>
          </div>
        ) : (
          <NoteSearch notes={notes} />
        )}
      </motion.div>
    </motion.div>
  )
}
