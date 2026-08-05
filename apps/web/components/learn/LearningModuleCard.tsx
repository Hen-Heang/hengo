import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { LearningModule } from "@/lib/learning-modules"

export function LearningModuleCard({ module }: { module: LearningModule }) {
  const Icon = module.icon

  return (
    <Link
      href={module.href}
      className="group flex h-full min-h-11 items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-sm outline-none transition-[border-color,box-shadow] duration-150 hover:border-blue-500/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] dark:bg-slate-900/40"
    >
      <div
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400"
      >
        <Icon size={20} strokeWidth={2.25} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="break-words text-base font-semibold text-foreground">{module.title}</h3>
          {module.badge && (
            <Badge variant="outline" className="shrink-0 text-xs font-medium text-muted-foreground">
              {module.badge}
            </Badge>
          )}
        </div>
        <p className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">{module.description}</p>
        {module.statusLabel && (
          <p className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400">{module.statusLabel}</p>
        )}
      </div>

      <ArrowRight
        aria-hidden
        size={18}
        className="mt-1.5 shrink-0 text-muted-foreground/40 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-blue-500"
      />
    </Link>
  )
}
