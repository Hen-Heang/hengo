"use client"

import {
  ArrowDown,
  ArrowDown01,
  ArrowDownAZ,
  ArrowUp,
  ArrowUp01,
  ArrowUpAZ,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { SortField, SortOption } from "@/lib/goals"

interface GoalSorterProps {
  sortOption: SortOption
  onSortChange: (sortOption: SortOption) => void
}

const SORT_LABELS: Record<string, string> = {
  title: "Title",
  target_date: "Due Date",
  status: "Status",
  created_at: "Creation Date",
}

export function GoalSorter({ sortOption, onSortChange }: GoalSorterProps) {
  const getSortIcon = () => {
    if (sortOption.field === "title") {
      return sortOption.direction === "asc" ? <ArrowDownAZ size={16} /> : <ArrowUpAZ size={16} />
    }
    if (sortOption.field === "target_date" || sortOption.field === "created_at") {
      return sortOption.direction === "asc" ? <ArrowDown01 size={16} /> : <ArrowUp01 size={16} />
    }
    return sortOption.direction === "asc" ? <ArrowDown size={16} /> : <ArrowUp size={16} />
  }

  const handleSortClick = (field: SortField) => {
    if (sortOption.field === field) {
      onSortChange({ field, direction: sortOption.direction === "asc" ? "desc" : "asc" })
    } else {
      onSortChange({ field, direction: "asc" })
    }
  }

  const activeIcon = (field: SortField, alpha = false) => {
    if (sortOption.field !== field) return <span className="mr-2 w-4" />
    const Asc = alpha ? ArrowDownAZ : ArrowDown01
    const Desc = alpha ? ArrowUpAZ : ArrowUp01
    return sortOption.direction === "asc" ? (
      <Asc className="mr-2 h-4 w-4" />
    ) : (
      <Desc className="mr-2 h-4 w-4" />
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 px-2 lg:px-3">
          {getSortIcon()}
          <span className="hidden sm:inline-block">Sort by: </span>
          {SORT_LABELS[sortOption.field] ?? "Sort By"}
          <span className="sr-only">Sort options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleSortClick("title")}>
          {activeIcon("title", true)}Title
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSortClick("target_date")}>
          {activeIcon("target_date")}Due Date
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSortClick("status")}>
          {sortOption.field === "status" ? (
            sortOption.direction === "asc" ? (
              <ArrowDown className="mr-2 h-4 w-4" />
            ) : (
              <ArrowUp className="mr-2 h-4 w-4" />
            )
          ) : (
            <span className="mr-2 w-4" />
          )}
          Status
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSortClick("created_at")}>
          {activeIcon("created_at")}Creation Date
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
