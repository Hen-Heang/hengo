"use client"

import { format } from "date-fns"
import { CalendarDays, Clock3, MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getHolidaysForDate,
  HOLIDAY_COUNTRY_META,
  type HolidayCountry,
} from "@/lib/holidays"
import { cn } from "@/lib/utils"
import { HolidayCountryFlag } from "./HolidayCountryFlag"

const COUNTRY_CARD_CLASS: Record<HolidayCountry, string> = {
  KR: "border-rose-200/80 bg-rose-500/5 dark:border-rose-500/25",
  KH: "border-blue-200/80 bg-blue-500/5 dark:border-blue-500/25",
}

interface HolidayDetailsDialogProps {
  date: Date | null
  isOpen: boolean
  onClose: () => void
}

export function HolidayDetailsDialog({
  date,
  isOpen,
  onClose,
}: HolidayDetailsDialogProps) {
  const holidays = date ? getHolidaysForDate(date) : []

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex w-[calc(100vw-2rem)] max-w-[460px] flex-col gap-0 overflow-hidden rounded-2xl p-0">
        <div className="border-b border-border/60 px-5 py-4 pr-12">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </div>
          <DialogTitle className="text-lg font-semibold">Holiday details</DialogTitle>
          <DialogDescription className="mt-1">
            {date ? format(date, "EEEE, MMMM d, yyyy") : "Selected calendar date"}
          </DialogDescription>
        </div>

        <div className="space-y-3 px-5 py-5">
          {holidays.map((holiday) => {
            const country = HOLIDAY_COUNTRY_META[holiday.country]
            const isSubstituteDay = holiday.name.toLowerCase().includes("in lieu")

            return (
              <article
                key={`${holiday.country}-${holiday.name}`}
                className={cn(
                  "flex gap-3 rounded-2xl border p-4",
                  COUNTRY_CARD_CLASS[holiday.country],
                )}
              >
                <HolidayCountryFlag
                  country={holiday.country}
                  className="h-8 w-12"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="bg-background/80">
                      Day off
                    </Badge>
                    {isSubstituteDay && (
                      <Badge variant="outline" className="bg-background/80">
                        Substitute day
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold leading-snug text-foreground">
                    {holiday.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {country.label}
                  </p>
                </div>
              </article>
            )
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-border/60 bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
          <Clock3 className="h-4 w-4" aria-hidden="true" />
          <span>All-day country holiday</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
