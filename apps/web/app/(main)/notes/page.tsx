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
      className="space-y-6 pb-12 sm:space-y-7"
    >
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Dev Notes"
          title="Knowledge Library"
          description="Your personal study notes — Java, Spring, SQL, Korean grammar, and anything worth saving."
          stats={[
            { label: "Notes", value: loading ? "..." : String(noteCount) },
            { label: "Topics", value: loading ? "..." : categories > 0 ? String(categories) : "—" },
          ]}
          actions={
            <Link
              href="/notes/new"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
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
              <div key={i} className="rounded-lg border border-border bg-card p-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-4/5" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-5 py-10 text-center">
            <p className="text-sm font-semibold text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">
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
