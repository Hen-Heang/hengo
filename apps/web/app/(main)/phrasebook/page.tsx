"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Upload } from "lucide-react"
import { motion } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { Button } from "@/components/ui/button"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { PhraseCollectionCard } from "@/components/phrasebook/PhraseCollectionCard"
import { PhraseCardListItem } from "@/components/phrasebook/PhraseCardListItem"
import { PhraseFilters } from "@/components/phrasebook/PhraseFilters"
import { PhrasebookMasterySummary } from "@/components/phrasebook/PhrasebookMasterySummary"
import { ImportPhrasesDialog } from "@/components/phrasebook/ImportPhrasesDialog"
import { phrasebookApi, getApiErrorMessage } from "@/lib/api"
import { useRomanizationPreference } from "@/hooks/useRomanizationPreference"
import { useSessionTimer } from "@/hooks/useSessionTimer"
import { countPhraseStates, filterPhraseCards, type PhraseFilters as PhraseFiltersValue } from "@/lib/korean-phrasebook/mastery"
import { containerVariants, itemVariants } from "@/lib/motion"
import type { PhraseCardWithProgress, PhraseCollection } from "@/lib/types"

export default function PhrasebookPage() {
  useSessionTimer("phrasebook")
  const router = useRouter()
  const romanizationPreference = useRomanizationPreference()

  const [collections, setCollections] = useState<PhraseCollection[]>([])
  const [cards, setCards] = useState<PhraseCardWithProgress[]>([])
  const [recentlyPracticed, setRecentlyPracticed] = useState<PhraseCardWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filters, setFilters] = useState<PhraseFiltersValue>({})
  const [importOpen, setImportOpen] = useState(false)

  async function load() {
    setLoading(true)
    setError("")
    try {
      const [collectionsRes, cardsRes, recentRes] = await Promise.all([
        phrasebookApi.getCollections(),
        phrasebookApi.getAllCards(),
        phrasebookApi.getRecentlyPracticed(5),
      ])
      setCollections(collectionsRes)
      setCards(cardsRes)
      setRecentlyPracticed(recentRes)
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load the Phrasebook."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const counts = useMemo(() => countPhraseStates(cards), [cards])
  const categories = useMemo(() => [...new Set(cards.map((c) => c.category))].sort(), [cards])
  const situations = useMemo(() => [...new Set(cards.map((c) => c.situation))].sort(), [cards])
  const difficulties = useMemo(() => [...new Set(cards.map((c) => c.difficulty))].sort(), [cards])
  const isFiltering = Boolean(filters.query || filters.category || filters.situation || filters.difficulty)
  const filteredCards = useMemo(() => filterPhraseCards(cards, filters), [cards, filters])

  const myCollections = collections.filter((c) => !c.sourceKey)
  const seededCollections = collections.filter((c) => c.sourceKey)

  function statsFor(collectionId: string) {
    const collectionCards = cards.filter((c) => c.collectionId === collectionId)
    const cardCount = collectionCards.length
    const masteredCount = collectionCards.filter((c) => c.progress?.state === "mastered").length
    const dueCount = collectionCards.filter((c) => c.progress && c.progress.nextReviewAt <= new Date().toISOString()).length
    return { cardCount, masteredCount, dueCount }
  }

  async function togglePin(collection: PhraseCollection) {
    setCollections((prev) => prev.map((c) => (c.id === collection.id ? { ...c, pinned: !c.pinned } : c)))
    try {
      await phrasebookApi.setPinned(collection.id, !collection.pinned)
    } catch {
      setCollections((prev) => prev.map((c) => (c.id === collection.id ? { ...c, pinned: collection.pinned } : c)))
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8 pb-12">
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Learn"
          title="Phrasebook"
          description="Common Korean questions and answers for the workplace and daily life — listen, answer aloud, get feedback, and review with spaced repetition."
          stats={[
            { label: "Due today", value: String(counts.due) },
            { label: "Learned", value: String(counts.learning + counts.mastered) },
            { label: "Mastered", value: String(counts.mastered) },
          ]}
          actions={
            <>
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload size={14} className="mr-1.5" /> Import
              </Button>
              <Button onClick={() => router.push("/phrasebook/new")}>
                <Plus size={14} className="mr-1.5" /> New Q&A
              </Button>
            </>
          }
        />
      </motion.div>

      {error && (
        <motion.div variants={itemVariants}>
          <ErrorBanner>{error}</ErrorBanner>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <PhrasebookMasterySummary counts={counts} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <PhraseFilters value={filters} onChange={setFilters} categories={categories} situations={situations} difficulties={difficulties} />
      </motion.div>

      {isFiltering ? (
        <motion.div variants={itemVariants} className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
            {filteredCards.length} {filteredCards.length === 1 ? "result" : "results"}
          </h2>
          {filteredCards.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No cards match your search.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredCards.map((card) => (
                <PhraseCardListItem key={card.id} card={card} romanizationPreference={romanizationPreference} editHref={`/phrasebook/new?cardId=${card.id}`} />
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        <>
          <motion.div variants={itemVariants} className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">Practice packs</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {seededCollections.map((collection) => {
                const stats = statsFor(collection.id)
                return (
                  <PhraseCollectionCard
                    key={collection.id}
                    collection={collection}
                    {...stats}
                    onTogglePin={() => togglePin(collection)}
                  />
                )
              })}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">My Q&A</h2>
              <Link href="/phrasebook/new" className="text-xs font-bold text-primary hover:underline">
                + Add
              </Link>
            </div>
            {myCollections.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Create your own Q&A cards or collections to build a personal Phrasebook.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {myCollections.map((collection) => {
                  const stats = statsFor(collection.id)
                  return (
                    <PhraseCollectionCard
                      key={collection.id}
                      collection={collection}
                      {...stats}
                      onTogglePin={() => togglePin(collection)}
                    />
                  )
                })}
              </div>
            )}
          </motion.div>

          {recentlyPracticed.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">Recently practiced</h2>
              <div className="space-y-3">
                {recentlyPracticed.map((card) => (
                  <PhraseCardListItem key={card.id} card={card} romanizationPreference={romanizationPreference} editHref={`/phrasebook/new?cardId=${card.id}`} />
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}

      <ImportPhrasesDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        collections={collections}
        onImported={load}
      />
    </motion.div>
  )
}
