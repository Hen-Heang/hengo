"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

import { PageHero } from "@/components/app/page-hero"
import { Button } from "@/components/ui/button"

interface GoalsHubHeaderProps {
  description: string
  stats?: Array<{ label: string; value: string }>
}

/**
 * Shared header for the four Goals hub routes (Overview/Goals/Tasks/
 * Calendar — see GoalsHubNav). One main action ("New goal") so the hub never
 * competes with itself across tabs; per-tab stats are opt-in (Overview only)
 * to keep the other three lean.
 */
export function GoalsHubHeader({ description, stats }: GoalsHubHeaderProps) {
  return (
    <PageHero
      eyebrow="Planner"
      title="Goals"
      description={description}
      variant={stats?.length ? "default" : "compact"}
      stats={stats}
      actions={
        <Button asChild className="h-11 w-full rounded-lg bg-blue-600 font-semibold hover:bg-blue-500 sm:w-auto sm:px-5">
          <Link href="/goals/create">
            <Plus size={18} strokeWidth={2} className="mr-2" />
            New goal
          </Link>
        </Button>
      }
    />
  )
}
