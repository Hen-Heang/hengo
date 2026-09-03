import { Skeleton } from "@/components/ui/skeleton"
import type { StudyGroupSummary } from "@/lib/learning/skill-groups"

// "Your Korean" — five deterministic skill-group averages from
// kori_skill_mastery (see lib/learning/skill-groups.ts), never a percentage
// invented in this component. A group with no practiced skills yet shows
// "Not started" instead of a fabricated 0%.
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
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
        Your Korean
      </p>
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
