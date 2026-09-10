import { phrasebookApi } from "@/lib/api/phrasebook"
import { vocabApi } from "@/lib/api/vocab"
import {
  SOCIAL_AWARENESS_PACK,
  SOCIAL_AWARENESS_PHRASES,
  SOCIAL_AWARENESS_VOCAB,
  type StudyVocabLevel,
} from "@/lib/study-packs/social-awareness"

const LEVEL_META: Record<StudyVocabLevel, { category: string; order: number }> = {
  basic: { category: "Script · Social Awareness · Basic", order: 0 },
  intermediate: { category: "Script · Social Awareness · Intermediate", order: 1 },
  advanced: { category: "Script · Social Awareness · Advanced", order: 2 },
}

export interface SocialAwarenessInstallResult {
  addedVocab: number
  addedPhrases: number
  phrasebookCollectionId: string
}

function vocabImportText(level: StudyVocabLevel): string {
  return SOCIAL_AWARENESS_VOCAB.filter((entry) => entry.level === level)
    .map((entry) => `${entry.term} — ${entry.meaning}`)
    .join("\n")
}

/**
 * Installs the script study pack into Hengo's existing vocab SRS and Phrasebook.
 *
 * Both sides are idempotent:
 * - vocabApi.importList skips terms already present in the learner's dictionary;
 * - Phrasebook reuses the same collection title/category and skips cards whose
 *   Korean prompt is already present.
 *
 * This deliberately uses the public feature APIs rather than writing Supabase
 * rows directly, so future persistence/RLS changes stay centralized.
 */
export async function installSocialAwarenessStudyPack(): Promise<SocialAwarenessInstallResult> {
  const levels = (Object.keys(LEVEL_META) as StudyVocabLevel[]).sort(
    (a, b) => LEVEL_META[a].order - LEVEL_META[b].order,
  )

  const vocabResults = await Promise.all(
    levels.map((level) => vocabApi.importList(LEVEL_META[level].category, vocabImportText(level))),
  )
  const addedVocab = vocabResults.reduce((total, rows) => total + rows.length, 0)

  const collections = await phrasebookApi.getCollections()
  let collection = collections.find(
    (item) =>
      item.titleEn === SOCIAL_AWARENESS_PACK.titleEn &&
      item.category === SOCIAL_AWARENESS_PACK.category,
  )

  if (!collection) {
    collection = await phrasebookApi.createCollection({
      titleKo: SOCIAL_AWARENESS_PACK.titleKo,
      titleEn: SOCIAL_AWARENESS_PACK.titleEn,
      description: SOCIAL_AWARENESS_PACK.description,
      category: SOCIAL_AWARENESS_PACK.category,
    })
  }

  const existingCards = await phrasebookApi.getCardsForCollection(collection.id)
  const existingQuestions = new Set(existingCards.map((card) => card.question.korean.trim()))
  let addedPhrases = 0

  // Keep writes sequential so a partial failure is easy to understand and a
  // retry simply fills the remaining missing cards without creating duplicates.
  for (const card of SOCIAL_AWARENESS_PHRASES) {
    if (existingQuestions.has(card.question.korean.trim())) continue
    await phrasebookApi.createCard(collection.id, card)
    existingQuestions.add(card.question.korean.trim())
    addedPhrases += 1
  }

  return {
    addedVocab,
    addedPhrases,
    phrasebookCollectionId: collection.id,
  }
}
