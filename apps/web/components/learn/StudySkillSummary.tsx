import Link from "next/link"

import { Skeleton } from "@/components/ui/skeleton"
import type { StudyGroupSummary } from "@/lib/learning/skill-groups"

// "Your Korean" — five deterministic skill-group averages from
// kori_skill_mastery (see lib/learning/skill-groups.ts), never a percentage
// invented in this component. A group with no practiced skills yet shows
// "Not started" instead of a fabricated 0%.
//
// These are NOT /vocab's "Avg. mastery", and the two will not match. This is
// a running average of how you *scored* on graded practice attempts
// (lib/learning/mastery.ts weights each new attempt against the previous
// average), so grading cards "Good" holds it near 80 from the first session.
// /vocab's number is per-card SRS strength: a 0-100 counter that moves +10 per
// good review, so a barely-started collection sits near 0 no matter how well
// each individual review goes. Both are correct; the subtitle below says which
// one this is, because "mastery" alone made them look like a contradiction.
export function StudySkillSummary({
  groups,
  loading,
}: {
  groups: StudyGroupSummary[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm dark:bg-slate-900/40 sm:p-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm dark:bg-slate-900/40 sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
          Your Korean
        </p>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
          Your average score across graded practice — not your flashcard mastery, which{" "}
          <Link href="/vocab" className="underline underline-offset-2 hover:text-foreground">
            Vocabulary
          </Link>{" "}
          tracks separately.
        </p>
      </div>
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.id}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">{group.label}</span>
              <span className="font-mono text-xs font-semibold text-muted-foreground">
                {group.hasEvidence ? `${group.masteryPercent}%` : "Not started"}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-accent/40">
              {group.hasEvidence && (
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${group.masteryPercent}%` }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
