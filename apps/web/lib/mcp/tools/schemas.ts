// Shared zod fragments for tool input/output schemas — kept in one place so
// every tool bounds ids/dates/limits the same way.
import { z } from "zod"

export const uuidSchema = z.string().uuid()

export const ymdSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be a YYYY-MM-DD date")

/** A bounded `limit` input, defaulting to `defaultValue` when omitted. */
export function limitSchema(min: number, max: number, defaultValue: number) {
  return z.number().int().min(min).max(max).default(defaultValue)
}

export const taskStatusSchema = z.enum([
  "backlog",
  "scheduled",
  "in_progress",
  "blocked",
  "completed",
])
