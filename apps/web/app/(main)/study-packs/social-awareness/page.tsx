"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Languages,
  Loader2,
  Sparkles,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { PageHero } from "@/components/app/page-hero"
import { Button } from "@/components/ui/button"
import { getUserId } from "@/lib/auth-store"
import { installSocialAwarenessStudyPack } from "@/lib/api/social-awareness-pack"
import {
  SOCIAL_AWARENESS_PACK,
  SOCIAL_AWARENESS_PHRASES,
  SOCIAL_AWARENESS_VOCAB,
  SOCIAL_AWARENESS_VOCAB_COUNTS,
} from "@/lib/study-packs/social-awareness"

type InstallState = {
  addedVocab: number
  addedPhrases: number
  phrasebookCollectionId: string
} | null

const levelCards = [
  {
    key: "basic" as const,
    title: "Basic",
    description: "High-frequency words to actively learn first.",
  },
  {
    key: "intermediate" as const,
    title: "Intermediate",
    description: "Workplace, phone, and social-awareness vocabulary.",
  },
  {
    key: "advanced" as const,
    title: "Advanced · Recognition",
    description: "Native spoken chunks to recognize before trying to use them.",
  },
]

export default function SocialAwarenessStudyPackPage() {
  const queryClient = useQueryClient()
  const [installing, setInstalling] = useState(false)
  const [installed, setInstalled] = useState<InstallState>(null)

  async function handleInstall() {
    setInstalling(true)
    try {
      const result = await installSocialAwarenessStudyPack()
      setInstalled(result)
      const userId = getUserId()
      await queryClient.invalidateQueries({ queryKey: ["vocab", userId] })
      toast.success("Study pack ready", {
        description:
          result.addedVocab + result.addedPhrases > 0
            ? `Added ${result.addedVocab} vocab cards and ${result.addedPhrases} phrase cards.`
            : "Everything in this pack was already in your Hengo library.",
      })
    } catch (error) {
      console.error("Failed to install social-awareness study pack", error)
      toast.error("Could not add the study pack", {
        description: "Nothing already saved was removed. You can safely try again.",
      })
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div className="space-y-6 pb-12 sm:space-y-8 sm:pb-16">
      <PageHero
        eyebrow="Learning · Script study pack"
        title={SOCIAL_AWARENESS_PACK.titleEn}
        description="Turn the full social-awareness script into reviewable Korean: vocabulary is split from basic to advanced, while the most useful clauses become speaking-ready Phrasebook cards."
        stats={[
          { label: "Vocabulary", value: `${SOCIAL_AWARENESS_VOCAB.length}` },
          { label: "Phrase cards", value: `${SOCIAL_AWARENESS_PHRASES.length}` },
          { label: "Levels", value: "3" },
        ]}
      />

      <section className="grid gap-4 md:grid-cols-3" aria-label="Vocabulary levels">
        {levelCards.map((level) => (
          <div
            key={level.key}
            className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm dark:bg-slate-900/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Languages size={20} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{level.title}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {SOCIAL_AWARENESS_VOCAB_COUNTS[level.key]} cards
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{level.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 dark:bg-slate-900/50">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <BookOpenText size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="app-kicker">Phrasebook collection</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
                {SOCIAL_AWARENESS_PACK.titleKo}
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                Includes practical phone etiquette, performance-bonus language, consideration, and
                spoken patterns such as -다 보면, -거잖아요, -거든요, and -더라고요. Advanced
                grammar is clearly marked for recognition first.
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-muted/45 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {SOCIAL_AWARENESS_PHRASES.length}
            </span>{" "}
            speaking and recognition cards
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              {installed ? (
                <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={20} />
              ) : (
                <Sparkles className="text-primary" size={20} />
              )}
              <h2 className="font-semibold text-foreground">
                {installed ? "Pack added to Hengo" : "Add this script to your review system"}
              </h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              The installer is safe to run more than once. Existing vocabulary is skipped, and
              existing Phrasebook questions are not duplicated.
            </p>
          </div>

          {!installed ? (
            <Button
              type="button"
              size="lg"
              onClick={handleInstall}
              disabled={installing}
              className="w-full shrink-0 sm:w-auto"
            >
              {installing ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {installing ? "Adding…" : "Add to Vocab + Phrasebook"}
            </Button>
          ) : (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/vocab">
                  Review vocabulary
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/phrasebook/${installed.phrasebookCollectionId}`}>
                  Open Phrasebook
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          )}
        </div>

        {installed ? (
          <div className="mt-4 grid gap-2 border-t border-primary/15 pt-4 text-sm sm:grid-cols-2">
            <p className="rounded-2xl bg-background/70 px-4 py-3 text-muted-foreground">
              New vocabulary added:{" "}
              <span className="font-mono font-semibold text-foreground">
                {installed.addedVocab}
              </span>
            </p>
            <p className="rounded-2xl bg-background/70 px-4 py-3 text-muted-foreground">
              New phrase cards added:{" "}
              <span className="font-mono font-semibold text-foreground">
                {installed.addedPhrases}
              </span>
            </p>
          </div>
        ) : null}
      </section>
    </div>
  )
}
