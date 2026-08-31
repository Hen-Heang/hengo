"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Star } from "lucide-react"
import { TechIcon, getTechColor } from "@/components/notes/TechIcon"
import { NOTE_TYPES, type NoteType } from "@/lib/notes"

interface NoteCardProps {
  slug: string
  title: string
  description: string
  icon: string
  noteType?: NoteType
  pinned?: boolean
  index: number
}

export function NoteCard({
  slug,
  title,
  description,
  icon,
  noteType,
  pinned,
  index,
}: NoteCardProps) {
  const accentColor = getTechColor(icon || slug)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="h-full"
    >
      <Link
        href={`/notes/${slug}`}
        className="group block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-lg border border-border/70 bg-card/80 p-4 shadow-sm transition-[border-color,background-color,box-shadow] hover:border-blue-500/30 hover:bg-accent/20 hover:shadow-md sm:p-5">
          <div className="relative mb-3 flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-border/80 bg-background"
              style={{ color: accentColor }}
            >
              <TechIcon name={icon} size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-base font-semibold tracking-tight text-foreground transition-colors sm:text-lg">
                  {title}
                </h2>
                {pinned && <Star size={14} className="shrink-0 fill-current text-blue-500" />}
              </div>
              <div className="mt-1 flex min-w-0 items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {noteType
                    ? (NOTE_TYPES.find((t) => t.value === noteType)?.label ?? "Module")
                    : "Module"}
                </span>
                <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span className="truncate font-mono text-xs font-medium text-blue-500/80">
                  /{slug}
                </span>
              </div>
            </div>
          </div>

          <p className="relative line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}
