// Public holidays for South Korea (KR) and Cambodia (KH), 2025-2027.
// Sourced from each country's official holiday calendars (Korea: Act on
// Public Holidays / officeholidays.com; Cambodia: MOI sub-decree /
// officeholidays.com). Lunar-based holidays (Seollal, Chuseok, Buddha's
// Birthday, Khmer New Year, Pchum Ben, Water Festival, ...) shift every year
// and are only listed once officially gazetted — Cambodia's Sep-Dec 2027
// lunar dates aren't published yet, so they're intentionally absent here
// rather than guessed. Extend this table as new years are announced.
import { formatYMD } from "@/lib/calendar"

export type HolidayCountry = "KR" | "KH"

export interface Holiday {
  date: string // yyyy-MM-dd
  name: string
  country: HolidayCountry
}

export const HOLIDAY_COUNTRY_META: Record<
  HolidayCountry,
  { label: string }
> = {
  KR: { label: "South Korea" },
  KH: { label: "Cambodia" },
}

const RAW_HOLIDAYS: Holiday[] = [
  // ── South Korea 2025 ──────────────────────────────────────────────────
  { date: "2025-01-01", name: "New Year's Day", country: "KR" },
  { date: "2025-01-27", name: "Seollal Holiday", country: "KR" },
  { date: "2025-01-28", name: "Seollal Holiday", country: "KR" },
  { date: "2025-01-29", name: "Seollal (Lunar New Year)", country: "KR" },
  { date: "2025-01-30", name: "Seollal Holiday", country: "KR" },
  { date: "2025-03-01", name: "Independence Movement Day", country: "KR" },
  { date: "2025-05-05", name: "Children's Day / Buddha's Birthday", country: "KR" },
  { date: "2025-06-03", name: "Election Day (temporary holiday)", country: "KR" },
  { date: "2025-06-06", name: "Memorial Day", country: "KR" },
  { date: "2025-08-15", name: "Liberation Day", country: "KR" },
  { date: "2025-10-03", name: "National Foundation Day", country: "KR" },
  { date: "2025-10-05", name: "Chuseok Holiday", country: "KR" },
  { date: "2025-10-06", name: "Chuseok (Harvest Festival)", country: "KR" },
  { date: "2025-10-07", name: "Chuseok Holiday", country: "KR" },
  { date: "2025-10-09", name: "Hangeul Day", country: "KR" },
  { date: "2025-12-25", name: "Christmas Day", country: "KR" },

  // ── South Korea 2026 ──────────────────────────────────────────────────
  { date: "2026-01-01", name: "New Year's Day", country: "KR" },
  { date: "2026-02-16", name: "Seollal Holiday", country: "KR" },
  { date: "2026-02-17", name: "Seollal (Lunar New Year)", country: "KR" },
  { date: "2026-02-18", name: "Seollal Holiday", country: "KR" },
  { date: "2026-03-01", name: "Independence Movement Day", country: "KR" },
  { date: "2026-03-02", name: "Independence Movement Day (in lieu)", country: "KR" },
  { date: "2026-05-01", name: "Labor Day", country: "KR" },
  { date: "2026-05-05", name: "Children's Day", country: "KR" },
  { date: "2026-05-24", name: "Buddha's Birthday", country: "KR" },
  { date: "2026-05-25", name: "Buddha's Birthday (in lieu)", country: "KR" },
  { date: "2026-06-06", name: "Memorial Day", country: "KR" },
  { date: "2026-07-17", name: "Constitution Day", country: "KR" },
  { date: "2026-08-15", name: "Liberation Day", country: "KR" },
  { date: "2026-08-17", name: "Liberation Day (in lieu)", country: "KR" },
  { date: "2026-09-24", name: "Chuseok Holiday", country: "KR" },
  { date: "2026-09-25", name: "Chuseok (Harvest Festival)", country: "KR" },
  { date: "2026-09-26", name: "Chuseok Holiday", country: "KR" },
  { date: "2026-10-03", name: "National Foundation Day", country: "KR" },
  { date: "2026-10-05", name: "National Foundation Day (in lieu)", country: "KR" },
  { date: "2026-10-09", name: "Hangeul Day", country: "KR" },
  { date: "2026-12-25", name: "Christmas Day", country: "KR" },

  // ── South Korea 2027 ──────────────────────────────────────────────────
  { date: "2027-01-01", name: "New Year's Day", country: "KR" },
  { date: "2027-02-06", name: "Seollal (Lunar New Year)", country: "KR" },
  { date: "2027-02-07", name: "Seollal Holiday", country: "KR" },
  { date: "2027-02-08", name: "Seollal Holiday", country: "KR" },
  { date: "2027-02-09", name: "Seollal Holiday (in lieu)", country: "KR" },
  { date: "2027-03-01", name: "Independence Movement Day", country: "KR" },
  { date: "2027-05-01", name: "Labor Day", country: "KR" },
  { date: "2027-05-03", name: "Labor Day (in lieu)", country: "KR" },
  { date: "2027-05-05", name: "Children's Day", country: "KR" },
  { date: "2027-05-13", name: "Buddha's Birthday", country: "KR" },
  { date: "2027-06-06", name: "Memorial Day", country: "KR" },
  { date: "2027-07-17", name: "Constitution Day", country: "KR" },
  { date: "2027-07-19", name: "Constitution Day (in lieu)", country: "KR" },
  { date: "2027-08-15", name: "Liberation Day", country: "KR" },
  { date: "2027-08-16", name: "Liberation Day (in lieu)", country: "KR" },
  { date: "2027-09-14", name: "Chuseok Holiday", country: "KR" },
  { date: "2027-09-15", name: "Chuseok (Harvest Festival)", country: "KR" },
  { date: "2027-09-16", name: "Chuseok Holiday", country: "KR" },
  { date: "2027-10-03", name: "National Foundation Day", country: "KR" },
  { date: "2027-10-04", name: "National Foundation Day (in lieu)", country: "KR" },
  { date: "2027-10-09", name: "Hangeul Day", country: "KR" },
  { date: "2027-10-11", name: "Hangeul Day (in lieu)", country: "KR" },
  { date: "2027-12-25", name: "Christmas Day", country: "KR" },

  // ── Cambodia 2025 ─────────────────────────────────────────────────────
  { date: "2025-01-01", name: "New Year's Day", country: "KH" },
  { date: "2025-01-07", name: "Victory over Genocide Day", country: "KH" },
  { date: "2025-03-08", name: "International Women's Day", country: "KH" },
  { date: "2025-04-14", name: "Khmer New Year", country: "KH" },
  { date: "2025-04-15", name: "Khmer New Year Holiday", country: "KH" },
  { date: "2025-04-16", name: "Khmer New Year Holiday", country: "KH" },
  { date: "2025-05-01", name: "International Labour Day", country: "KH" },
  { date: "2025-05-11", name: "Visak Bochea Day", country: "KH" },
  { date: "2025-05-14", name: "King's Birthday", country: "KH" },
  { date: "2025-05-15", name: "Royal Ploughing Ceremony", country: "KH" },
  { date: "2025-06-18", name: "King's Mother's Birthday", country: "KH" },
  { date: "2025-09-21", name: "Pchum Ben (Ancestors' Day)", country: "KH" },
  { date: "2025-09-22", name: "Pchum Ben Holiday", country: "KH" },
  { date: "2025-09-23", name: "Pchum Ben Holiday", country: "KH" },
  { date: "2025-09-24", name: "Constitution Day", country: "KH" },
  { date: "2025-10-15", name: "Commemoration Day of King's Father", country: "KH" },
  { date: "2025-10-29", name: "King's Coronation Day", country: "KH" },
  { date: "2025-11-04", name: "Water Festival", country: "KH" },
  { date: "2025-11-05", name: "Water Festival Holiday", country: "KH" },
  { date: "2025-11-06", name: "Water Festival Holiday", country: "KH" },
  { date: "2025-11-09", name: "Independence Day", country: "KH" },
  { date: "2025-12-29", name: "Peace Day", country: "KH" },

  // ── Cambodia 2026 ─────────────────────────────────────────────────────
  { date: "2026-01-01", name: "New Year's Day", country: "KH" },
  { date: "2026-01-07", name: "Victory over Genocide Day", country: "KH" },
  { date: "2026-03-08", name: "International Women's Day", country: "KH" },
  { date: "2026-04-14", name: "Khmer New Year", country: "KH" },
  { date: "2026-04-15", name: "Khmer New Year Holiday", country: "KH" },
  { date: "2026-04-16", name: "Khmer New Year Holiday", country: "KH" },
  { date: "2026-05-01", name: "International Labour Day", country: "KH" },
  { date: "2026-05-04", name: "Visak Bochea Day", country: "KH" },
  { date: "2026-05-05", name: "Royal Ploughing Ceremony", country: "KH" },
  { date: "2026-05-14", name: "King's Birthday", country: "KH" },
  { date: "2026-06-18", name: "King's Mother's Birthday", country: "KH" },
  { date: "2026-09-24", name: "Constitution Day", country: "KH" },
  { date: "2026-10-10", name: "Pchum Ben (Ancestors' Day)", country: "KH" },
  { date: "2026-10-11", name: "Pchum Ben Holiday", country: "KH" },
  { date: "2026-10-12", name: "Pchum Ben Holiday", country: "KH" },
  { date: "2026-10-15", name: "Commemoration Day of King's Father", country: "KH" },
  { date: "2026-10-29", name: "King's Coronation Day", country: "KH" },
  { date: "2026-11-09", name: "Independence Day", country: "KH" },
  { date: "2026-11-24", name: "Water Festival", country: "KH" },
  { date: "2026-11-25", name: "Water Festival Holiday", country: "KH" },
  { date: "2026-11-26", name: "Water Festival Holiday", country: "KH" },
  { date: "2026-12-29", name: "Peace Day", country: "KH" },

  // ── Cambodia 2027 (H2 lunar dates not yet gazetted — see file header) ──
  { date: "2027-01-01", name: "New Year's Day", country: "KH" },
  { date: "2027-01-07", name: "Victory over Genocide Day", country: "KH" },
  { date: "2027-03-08", name: "International Women's Day", country: "KH" },
  { date: "2027-04-14", name: "Khmer New Year", country: "KH" },
  { date: "2027-04-15", name: "Khmer New Year Holiday", country: "KH" },
  { date: "2027-04-16", name: "Khmer New Year Holiday", country: "KH" },
  { date: "2027-05-01", name: "International Labour Day", country: "KH" },
  { date: "2027-05-14", name: "King's Birthday", country: "KH" },
  { date: "2027-05-20", name: "Visak Bochea Day", country: "KH" },
  { date: "2027-05-24", name: "Royal Ploughing Ceremony", country: "KH" },
  { date: "2027-06-18", name: "King's Mother's Birthday", country: "KH" },
  { date: "2027-09-24", name: "Constitution Day", country: "KH" },
  { date: "2027-10-15", name: "Commemoration Day of King's Father", country: "KH" },
  { date: "2027-10-29", name: "King's Coronation Day", country: "KH" },
  { date: "2027-11-09", name: "Independence Day", country: "KH" },
  { date: "2027-12-29", name: "Peace Day", country: "KH" },
]

const HOLIDAYS_BY_DATE = new Map<string, Holiday[]>()
for (const holiday of RAW_HOLIDAYS) {
  const list = HOLIDAYS_BY_DATE.get(holiday.date)
  if (list) list.push(holiday)
  else HOLIDAYS_BY_DATE.set(holiday.date, [holiday])
}

/** Korea + Cambodia public holidays landing on this date, if any. */
export function getHolidaysForDate(date: Date): Holiday[] {
  return HOLIDAYS_BY_DATE.get(formatYMD(date)) ?? []
}

export const HOLIDAY_COUNTRY_LABEL: Record<HolidayCountry, string> = {
  KR: HOLIDAY_COUNTRY_META.KR.label,
  KH: HOLIDAY_COUNTRY_META.KH.label,
}
