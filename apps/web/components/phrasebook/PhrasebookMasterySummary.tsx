import type { PhrasebookCounts } from "@/lib/korean-phrasebook/mastery"

const TILES: Array<{ key: keyof PhrasebookCounts; label: string; className: string }> = [
  { key: "due", label: "Due today", className: "text-blue-600 dark:text-blue-400" },
  { key: "overdue", label: "Overdue", className: "text-red-600 dark:text-red-400" },
  { key: "new", label: "New", className: "text-sky-600 dark:text-sky-400" },
  { key: "learning", label: "Learning", className: "text-amber-600 dark:text-amber-400" },
  { key: "mastered", label: "Mastered", className: "text-emerald-600 dark:text-emerald-400" },
]

export function PhrasebookMasterySummary({ counts }: { counts: PhrasebookCounts }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
      {TILES.map((tile) => (
        <div key={tile.key} className="rounded-2xl border border-border bg-card px-3 py-3 text-center shadow-sm dark:bg-slate-900/40">
          <p className={`font-mono text-xl font-bold leading-none ${tile.className}`}>{counts[tile.key]}</p>
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{tile.label}</p>
        </div>
      ))}
    </div>
  )
}
