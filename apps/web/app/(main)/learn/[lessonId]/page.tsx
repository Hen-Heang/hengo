"use client"

import { useParams } from "next/navigation"

import { LessonRunner } from "@/components/learn/LessonRunner"

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>()
  const lessonId = params?.lessonId ?? ""

  return <LessonRunner lessonId={lessonId} />
}
