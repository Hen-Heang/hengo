"use client"

import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { INBOX_ITEM_TYPES, type InboxFilters as InboxFiltersValue } from "@/lib/inbox"

export function InboxFilters({
  value,
  onChange,
  availableTags,
}: {
  value: InboxFiltersValue
  onChange: (next: InboxFiltersValue) => void
  availableTags: string[]
}) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value.query ?? ""}
          onChange={(event) => onChange({ ...value, query: event.target.value })}
          placeholder="Search your inbox…"
          aria-label="Search inbox"
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Select value={value.status ?? "inbox"} onValueChange={(status) => onChange({ ...value, status: status as InboxFiltersValue["status"] })}>
          <SelectTrigger className="w-full sm:w-32" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inbox">Inbox</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>

        <Select value={value.type ?? "all"} onValueChange={(type) => onChange({ ...value, type: type as InboxFiltersValue["type"] })}>
          <SelectTrigger className="w-full sm:w-36" aria-label="Filter by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {INBOX_ITEM_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {availableTags.length > 0 && (
          <Select value={value.tag ?? "all"} onValueChange={(tag) => onChange({ ...value, tag })}>
            <SelectTrigger className="w-full sm:w-32" aria-label="Filter by tag">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {availableTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  #{tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}
