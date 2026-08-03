"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type PageHeroProps = {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  stats?: Array<{
    label: string
    value: string
    // Either makes the tile tappable — href navigates, onClick handles
    // in-page behavior (e.g. scrolling to a section).
    href?: string
    onClick?: () => void
  }>
  className?: string
}

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  stats,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/90 p-5 shadow-sm shadow-slate-950/5 ring-1 ring-white/50 dark:bg-slate-900/70 dark:ring-white/5 sm:p-8",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-24 -top-28 h-80 w-80 rounded-full bg-primary/8 blur-[90px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-foreground">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-[0.98rem] leading-7 text-muted-foreground">
              {description}
            </p>
          </div>

          {actions && (
            <div className="flex w-full flex-wrap gap-2.5 sm:w-auto lg:max-w-md lg:justify-end">
              {actions}
            </div>
          )}
        </div>

        {stats && stats.length > 0 && (
          <div className="mt-6 border-t border-border/60 pt-5">
            <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
              {stats.map((stat) => {
                const tappable = Boolean(stat.href || stat.onClick)
                const tileClass = cn(
                  "min-w-0 rounded-xl border border-border/60 bg-background/55 px-3.5 py-3 text-left dark:bg-white/[0.035] sm:min-w-28 sm:px-4",
                  tappable &&
                    "transition-[border-color,background-color,transform] hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98]"
                )
                const inner = (
                  <>
                    <p className="font-mono text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 truncate text-[0.68rem] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
                      {stat.label}
                    </p>
                  </>
                )
                if (stat.href) {
                  return (
                    <Link key={stat.label} href={stat.href} className={tileClass}>
                      {inner}
                    </Link>
                  )
                }
                if (stat.onClick) {
                  return (
                    <button key={stat.label} type="button" onClick={stat.onClick} className={tileClass}>
                      {inner}
                    </button>
                  )
                }
                return (
                  <div key={stat.label} className={tileClass}>
                    {inner}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
