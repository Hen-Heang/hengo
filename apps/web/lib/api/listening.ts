import { supabase } from "@/lib/supabase"
import type { ListeningLesson } from "@/lib/types"

import { listeningApi as legacyListeningApi } from "./learning"

type ListeningRow = {
  id: string
  topic: string
  title: string
  level: string
  lines: ListeningLesson["lines"]
  quiz: ListeningLesson["quiz"]
  created_at: string
}

function toLesson(row: ListeningRow): ListeningLesson {
  return {
    id: row.id,
    topic: row.topic,
    title: row.title,
    level: row.level,
    lines: row.lines ?? [],
    quiz: row.quiz ?? [],
    createdAt: row.created_at,
  }
}

function uniqueTopics(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const topic = value.trim()
    if (!topic) continue
    const key = topic.toLocaleLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(topic)
  }

  return result
}

/**
 * Listening V2.1 keeps the existing AI generator as a fallback, but prefers
 * the curated Supabase lesson library first. This makes the prebuilt workplace
 * and daily-life lessons reusable instead of creating a new AI lesson every
 * time the learner taps Start.
 */
export const listeningApi = {
  ...legacyListeningApi,

  getTopics: async (): Promise<string[]> => {
    const [legacyTopics, storedTopics] = await Promise.all([
      legacyListeningApi.getTopics(),
      supabase.from("kori_listening_lessons").select("topic").order("topic", { ascending: true }),
    ])

    if (storedTopics.error) return legacyTopics

    return uniqueTopics([
      ...legacyTopics,
      ...(storedTopics.data ?? []).map((row) => row.topic as string),
    ])
  },

  generate: async (topic: string): Promise<ListeningLesson> => {
    const { data, error } = await supabase
      .from("kori_listening_lessons")
      .select("*")
      .eq("topic", topic)
      .order("created_at", { ascending: false })

    if (!error && data && data.length > 0) {
      // Randomize within the curated topic so repeated practice does not always
      // surface the same dialogue. The legacy AI flow remains the fallback for
      // topics that do not yet have authored content.
      const row = data[Math.floor(Math.random() * data.length)] as ListeningRow
      return toLesson(row)
    }

    return legacyListeningApi.generate(topic)
  },
}
