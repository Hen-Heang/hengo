import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { LearningModule } from "@/lib/learning-modules"
import { cn } from "@/lib/utils"

export function LearningModuleCard({ module }: { module: LearningModule }) {
  const Icon = module.icon

  return (
    <Link
      href={module.href}
      className={cn(
        "group flex h-full min-h-11 items-start gap-3 rounded-xl border bg-card p-4 outline-none transition-[border-color,box-shadow,transform] duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] dark:bg-slate-900/40",
        module.featured
          ? "border-blue-500/35 p-5 shadow-md hover:border-blue-500/50 hover:shadow-lg sm:p-6"
          : "border-border shadow-sm hover:border-blue-500/30 hover:shadow-md",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "flex shrink-0 items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400",
          module.featured ? "h-12 w-12 rounded-xl" : "h-10 w-10 rounded-lg",
        )}
      >
        <Icon size={module.featured ? 24 : 20} strokeWidth={2.25} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <h3
            className={cn(
              "break-words font-semibold tracking-tight text-foreground",
              module.featured ? "text-lg sm:text-xl" : "text-base",
            )}
          >
            {module.title}
          </h3>
          {module.badge && (
            <Badge variant="outline" className="shrink-0 text-xs font-medium text-muted-foreground">
              {module.badge}
            </Badge>
          )}
        </div>
        <p
          className={cn(
            "mt-1.5 break-words text-muted-foreground",
            module.featured
              ? "max-w-2xl text-sm leading-6 sm:text-base sm:leading-7"
              : "line-clamp-2 text-sm leading-5",
          )}
        >
          {module.description}
        </p>
        {module.statusLabel && (
          <p className="mt-3 text-xs font-semibold text-blue-600 dark:text-blue-400 sm:text-sm">
            {module.statusLabel}
          </p>
        )}
      </div>

      <ArrowRight
        aria-hidden
        size={module.featured ? 20 : 18}
        className="mt-1.5 shrink-0 text-muted-foreground/40 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-blue-500"
      />
    </Link>
  )
}
