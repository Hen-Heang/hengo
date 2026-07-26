"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowUpRight, Star } from "lucide-react"
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

export function NoteCard({ slug, title, description, icon, noteType, pinned, index }: NoteCardProps) {
  const accentColor = getTechColor(icon || slug)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: index * 0.05 }}
      whileHover={{ y: -6 }}
      className="h-full"
    >
      <Link href={`/notes/${slug}`} className="group block h-full">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/60 bg-card/50 p-7 shadow-sm backdrop-blur-xl transition-all duration-500 hover:border-blue-500/30 hover:bg-accent/30 sm:p-8">
          {/* Accent glow line at top */}
          <div
            className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            style={{ background: `linear-gradient(to right, transparent, ${accentColor}, transparent)` }}
          />

          {/* Background glow */}
          <div
            className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-0 blur-[50px] transition-opacity duration-700 group-hover:opacity-20"
            style={{ backgroundColor: accentColor }}
          />

          <div className="relative mb-6 flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-background shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:border-blue-500/40">
              <TechIcon name={icon} size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-lg font-black tracking-tight text-foreground transition-colors sm:text-xl">
                  {title}
                </h2>
                {pinned && <Star size={14} className="shrink-0 fill-current text-blue-500" />}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {noteType ? NOTE_TYPES.find((t) => t.value === noteType)?.label ?? "Module" : "Module"}
                </span>
                <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span className="font-mono text-[11px] font-bold text-blue-500/70">/{slug}</span>
              </div>
            </div>
          </div>

          <p className="relative mb-8 line-clamp-3 flex-1 text-[15px] font-medium leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>

          <div className="relative mt-auto flex items-center justify-between border-t border-border/60 pt-6">
            <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
              Study note
            </span>
            <div className="flex items-center gap-2 text-sm font-black text-muted-foreground transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              <span>OPEN</span>
              <div className="rounded-lg border border-border bg-background p-1.5 transition-all group-hover:border-blue-500/40 group-hover:bg-blue-500/10">
                <ArrowUpRight
                  size={16}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
