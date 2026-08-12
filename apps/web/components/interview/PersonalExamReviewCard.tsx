"use client"

import { useState } from "react"
import { BookOpenText, ChevronDown, ChevronUp, Headphones, MessageCircleQuestion } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SpeakButton } from "@/components/ui/SpeakButton"
import { PERSONAL_EXAM_QA, PERSONAL_EXAM_SCRIPT } from "@/lib/personal-exam-prep"

export function PersonalExamReviewCard() {
  const [mode, setMode] = useState<"script" | "qa">("qa")
  const [openQuestion, setOpenQuestion] = useState<string | null>(PERSONAL_EXAM_QA[0]?.id ?? null)

  return (
    <Card className="rounded-2xl border-emerald-500/25 bg-card shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-none bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                Personal Exam Story
              </Badge>
              <Badge variant="outline">Formal 합니다/습니다</Badge>
            </div>
            <h2 className="mt-3 text-xl font-bold text-foreground">Your real-story script + question catcher</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Do not memorize every word. Hear the question, catch 1–2 keywords, choose the story branch, then answer in 2–3 short sentences.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:w-auto">
            <Button
              type="button"
              variant={mode === "qa" ? "default" : "outline"}
              onClick={() => setMode("qa")}
              className="rounded-xl"
            >
              <MessageCircleQuestion className="mr-2 size-4" /> Q&A
            </Button>
            <Button
              type="button"
              variant={mode === "script" ? "default" : "outline"}
              onClick={() => setMode("script")}
              className="rounded-xl"
            >
              <BookOpenText className="mr-2 size-4" /> Script
            </Button>
          </div>
        </div>

        {mode === "qa" ? (
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Headphones className="size-4 text-amber-600" /> Listening rule
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Catch the yellow words first. Example: “차이점 / 어떻게 달라요” → 한국=습도·비, 캄보디아=햇빛·기온.
              </p>
            </div>

            {PERSONAL_EXAM_QA.map((item, index) => {
              const isOpen = openQuestion === item.id
              return (
                <div key={item.id} className="rounded-xl border border-border bg-background/60 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-bold text-blue-700 dark:text-blue-300">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p lang="ko" className="font-semibold leading-relaxed text-foreground">{item.question}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.catchKeywords.map((keyword) => (
                              <Badge key={keyword} className="border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <SpeakButton text={item.question} className="shrink-0" title="질문 듣기" />
                      </div>

                      <button
                        type="button"
                        onClick={() => setOpenQuestion(isOpen ? null : item.id)}
                        className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {isOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                        {isOpen ? "답변 숨기기" : "질문 표현 + 답변 보기"}
                      </button>

                      {isOpen ? (
                        <div className="mt-3 space-y-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">You may hear</p>
                            <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                              {item.questionVariants.map((variant) => (
                                <li key={variant} lang="ko">• {variant}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-xl bg-muted/40 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p lang="ko" className="text-sm font-medium leading-relaxed text-foreground">{item.answer}</p>
                              <SpeakButton text={item.answer} className="shrink-0" title="답변 듣기" />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {item.answerKeywords.map((keyword) => (
                                <Badge key={keyword} variant="outline" className="text-[10px]">{keyword}</Badge>
                              ))}
                            </div>
                          </div>
                          {item.note ? <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{item.note}</p> : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              This is the short personal version. Seonyudo and Han River cycling stay outside the main script as backup stories for follow-up questions.
            </p>
            {PERSONAL_EXAM_SCRIPT.map((section) => (
              <div key={section.id} className="rounded-xl border border-border bg-background/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{section.title}</p>
                    <p lang="ko" className="mt-2 whitespace-pre-line text-sm font-medium leading-7 text-foreground">{section.text}</p>
                  </div>
                  <SpeakButton text={section.text} className="shrink-0" title="이 부분 듣기" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
