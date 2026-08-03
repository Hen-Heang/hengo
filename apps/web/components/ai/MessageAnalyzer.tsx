"use client"

import { useState } from "react"
import {
  Activity,
  BadgeCheck,
  Building2,
  Check,
  Copy,
  Languages,
  Lightbulb,
  ListTree,
  MessageSquareReply,
  ScanText,
  Sparkles,
  Trash2,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Textarea } from "@/components/ui/textarea"
import { SpeakButton } from "@/components/ui/SpeakButton"
import { useCopy } from "@/hooks/useCopy"
import { useLogActivity } from "@/hooks/useLogActivity"
import { analyzerApi, getApiErrorMessage } from "@/lib/api"
import type { PartialAnalyzerResult } from "@/lib/api/learning"
import { containerVariants, itemVariants } from "@/lib/motion"
import type { MessageAnalysis } from "@/lib/types"
import { cn } from "@/lib/utils"

const sources = [
  "Slack",
  "KakaoTalk",
  "Meeting notes",
  "Team chat",
  "Other",
]

const howToTips = [
  { label: "Pick a source", text: "Tag where the message came from so context matches the platform's tone.", icon: ScanText, color: "text-blue-500" },
  { label: "Read the breakdown", text: "Each honorific and phrase is explained so you learn the nuance, not just the meaning.", icon: ListTree, color: "text-amber-500" },
  { label: "Reply with confidence", text: "Copy or listen to a suggested reply that matches the right formality.", icon: MessageSquareReply, color: "text-sky-500" },
]

const starterPrompts = [
  "담당자분께 전달드렸습니다. 확인 후 회신 부탁드립니다.",
  "이번 배포 건은 QA 끝나고 진행하는 게 좋을 것 같습니다.",
  "수고 많으셨습니다 ㅎㅎ 내일 스탠드업 때 공유 부탁드려요!",
  "해당 이슈는 제가 보고 있는데, 재현이 잘 안 되네요. 혹시 로그 공유 가능하실까요?",
]

export function MessageAnalyzer() {
  const [text, setText] = useState("")
  const [source, setSource] = useState<string | null>(null)
  const [result, setResult] = useState<MessageAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { copied, copy } = useCopy(2000)
  const { logActivity } = useLogActivity("chat")

  function mergePartial(partial: PartialAnalyzerResult) {
    setResult((prev) => ({
      id: prev?.id ?? "",
      source: source ?? null,
      createdAt: prev?.createdAt ?? "",
      originalText: partial.originalText ?? prev?.originalText ?? "",
      literalMeaning: partial.literalMeaning ?? prev?.literalMeaning ?? "",
      naturalMeaning: partial.naturalMeaning ?? prev?.naturalMeaning ?? "",
      businessContext: partial.businessContext ?? prev?.businessContext ?? "",
      politenessLevel: partial.politenessLevel ?? prev?.politenessLevel ?? "",
      tone: partial.tone ?? prev?.tone ?? "",
      breakdown:
        partial.breakdown?.map((item) => ({
          fragment: item?.fragment ?? "",
          meaning: item?.meaning ?? "",
          note: item?.note ?? "",
        })) ??
        prev?.breakdown ??
        [],
      suggestedReplies:
        partial.suggestedReplies?.map((reply) => ({
          korean: reply?.korean ?? "",
          english: reply?.english ?? "",
          formality: reply?.formality ?? "",
        })) ??
        prev?.suggestedReplies ??
        [],
      modelUsed: partial.modelUsed ?? prev?.modelUsed ?? "",
    }))
  }

  async function handleAnalyze() {
    if (!text.trim()) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const data = await analyzerApi.analyze(text, source ?? undefined, mergePartial)
      setResult(data)
      void logActivity()
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to analyze the message. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setText("")
    setResult(null)
    setError("")
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 pb-12 sm:space-y-8 sm:pb-16"
    >
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Workplace Analyzer"
          title="Decode Real Korean Messages"
          description="Paste a Slack, KakaoTalk, or meeting message from a coworker. Get the literal and natural meaning, business context, politeness signals, and ready-to-send replies."
          stats={[
            { label: "Reads", value: "Honorifics & Tone" },
            { label: "Output", value: "Phrase Breakdown" },
            { label: "AI", value: "Workplace Analyst" },
          ]}
        />
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
        {/* Main Workspace */}
        <div className="min-w-0 space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden rounded-[1.8rem] border-border bg-card shadow-xl backdrop-blur-md dark:bg-slate-900/40 sm:rounded-[2.2rem] lg:rounded-3xl">
              <CardHeader className="border-b border-border/60 bg-accent/5 px-5 pb-4 pt-5 sm:px-6 sm:pb-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 shadow-sm ring-1 ring-blue-500/20">
                      <ScanText size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Message to Analyze</CardTitle>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        Paste what your coworker wrote
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="h-9 w-9 rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Clear text"
                  >
                    <Trash2 size={16} strokeWidth={2.5} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Source chips */}
                <div className="flex flex-wrap gap-2 border-b border-border/60 bg-accent/5 px-5 py-4 sm:px-6">
                  {sources.map((s) => {
                    const active = source === s
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSource(active ? null : s)}
                        className={cn(
                          "rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all active:scale-95",
                          active
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                            : "border border-border bg-background text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>

                <Textarea
                  className="min-h-[200px] w-full resize-none rounded-none border-0 bg-transparent p-5 text-[15px] font-medium leading-7 text-foreground placeholder:text-muted-foreground/60 shadow-none focus-visible:ring-0 sm:min-h-[260px] sm:p-6 sm:text-lg"
                  placeholder="예: 담당자분께 전달드렸습니다. 확인 후 회신 부탁드립니다."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />

                <div className="flex flex-col items-start gap-3 border-t border-border/60 bg-accent/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {text.trim().length} characters
                  </span>
                  <Button
                    onClick={handleAnalyze}
                    disabled={loading || !text.trim()}
                    className="h-11 w-full rounded-[1.15rem] bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-95 sm:h-12 sm:w-auto sm:rounded-[1.25rem] sm:px-8"
                  >
                    {loading ? (
                      <><Activity size={18} className="mr-2 animate-pulse" /> Analyzing...</>
                    ) : (
                      <><Sparkles size={18} strokeWidth={2.5} className="mr-2" /> Analyze Message</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {error && <ErrorBanner>{error}</ErrorBanner>}

          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                {/* Meaning card */}
                <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-2xl dark:bg-slate-900/60">
                  <div className="flex items-center justify-between border-b border-border/60 bg-blue-500/5 px-6 py-4">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <BadgeCheck size={16} strokeWidth={3} />
                      <p className="text-[11px] font-bold uppercase tracking-wide">Analysis Complete</p>
                    </div>
                    <SpeakButton
                      text={result.originalText}
                      className="h-9 w-9 rounded-xl bg-background shadow-sm ring-1 ring-border transition-transform active:scale-90"
                    />
                  </div>

                  <div className="p-6 sm:p-8">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Original</p>
                    <p className="mt-2 text-base font-bold leading-relaxed text-foreground sm:text-lg">
                      {result.originalText}
                    </p>
                  </div>

                  <div className="grid divide-y divide-border/60 border-t border-border/60 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                    <div className="p-6 sm:p-8">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Literal Meaning</p>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground/80">
                        {result.literalMeaning}
                      </p>
                    </div>
                    <div className="bg-blue-500/[0.02] p-6 sm:p-8">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-blue-600/40">Natural Meaning</p>
                      <p className="mt-2 text-sm font-bold leading-relaxed text-foreground">
                        {result.naturalMeaning}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Context + politeness + tone */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <Card className="rounded-3xl border border-border bg-card shadow-sm dark:bg-slate-900/40">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-sky-500" strokeWidth={2.5} />
                        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Business Context</p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[13px] font-medium leading-relaxed text-foreground/80">{result.businessContext}</p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border border-border bg-card shadow-sm dark:bg-slate-900/40">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Languages size={14} className="text-violet-500" strokeWidth={2.5} />
                        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Politeness & Tone</p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Politeness</p>
                        <p className="mt-1 text-[13px] font-bold text-foreground/80">{result.politenessLevel}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Tone</p>
                        <p className="mt-1 text-[13px] font-bold text-foreground/80">{result.tone}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Phrase breakdown */}
                {result.breakdown && result.breakdown.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      <ListTree size={14} className="text-muted-foreground/40" /> Phrase Breakdown
                    </h4>
                    <div className="grid gap-3">
                      {result.breakdown.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm transition-all hover:border-blue-500/20 hover:shadow-lg dark:bg-slate-900/40"
                        >
                          <div className="flex flex-wrap items-center gap-3 border-b border-border/60 bg-accent/5 px-5 py-4">
                            <span className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-[13px] font-bold text-blue-600 dark:text-blue-400">
                              {item.fragment}
                            </span>
                            <span className="text-[12px] font-bold text-sky-600/80 dark:text-sky-400/80">{item.meaning}</span>
                          </div>
                          {item.note && (
                            <p className="p-5 text-[13px] font-medium leading-relaxed text-muted-foreground">{item.note}</p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested replies */}
                {result.suggestedReplies && result.suggestedReplies.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      <MessageSquareReply size={14} className="text-muted-foreground/40" /> Suggested Replies
                    </h4>
                    <div className="grid gap-3">
                      {result.suggestedReplies.map((reply, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm dark:bg-slate-900/40"
                        >
                          <div className="flex items-start justify-between gap-3 p-5">
                            <div className="min-w-0">
                              <p className="text-[15px] font-bold leading-relaxed text-foreground">{reply.korean}</p>
                              <p className="mt-1 text-[13px] font-medium text-muted-foreground">{reply.english}</p>
                              {reply.formality && (
                                <span className="mt-3 inline-block rounded-full bg-accent/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                  {reply.formality}
                                </span>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <SpeakButton
                                text={reply.korean}
                                className="h-9 w-9 rounded-xl bg-background shadow-sm ring-1 ring-border transition-transform active:scale-90"
                              />
                              <Button
                                size="icon"
                                variant="secondary"
                                onClick={() => copy(reply.korean, i)}
                                className={cn(
                                  "h-9 w-9 rounded-xl font-bold transition-all active:scale-95",
                                  copied === i ? "bg-blue-500 text-white" : "bg-background shadow-sm ring-1 ring-border"
                                )}
                                title="Copy reply"
                              >
                                {copied === i ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={2.5} />}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Guidance */}
        <div className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="rounded-3xl border-border bg-card shadow-xl dark:bg-slate-900/40">
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 shadow-sm ring-1 ring-sky-500/20">
                    <Lightbulb size={18} strokeWidth={2.5} />
                  </div>
                  <CardTitle className="text-base font-bold uppercase tracking-tight">How to use</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                {howToTips.map((tip) => (
                  <div key={tip.label} className="flex gap-3">
                    <div className={cn("mt-0.5 shrink-0", tip.color)}>
                      <tip.icon size={16} strokeWidth={3} />
                    </div>
                    <div>
                      <h4 className="text-[12px] font-bold uppercase tracking-wider text-foreground">{tip.label}</h4>
                      <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">{tip.text}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="px-2">
              <div className="mb-4 flex items-center gap-2">
                <ScanText size={14} className="text-muted-foreground/40" />
                <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Try a sample</h4>
              </div>
              <div className="grid gap-2">
                {starterPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setText(prompt)}
                    className="group rounded-2xl border border-border bg-accent/5 p-4 text-left transition-all hover:bg-background hover:shadow-md active:scale-[0.98]"
                  >
                    <p className="line-clamp-2 text-xs font-bold leading-relaxed text-foreground/60 group-hover:text-foreground">
                      {prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
