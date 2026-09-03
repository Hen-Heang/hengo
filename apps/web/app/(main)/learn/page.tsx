"use client"

import { motion, useReducedMotion } from "motion/react"

import { LearningModuleCard } from "@/components/learn/LearningModuleCard"
import { StudyRecommendation } from "@/components/learn/StudyRecommendation"
import { StudySkillSummary } from "@/components/learn/StudySkillSummary"
import { useDailyMission } from "@/hooks/useDailyMission"
import { useSkillMastery } from "@/hooks/useSkillMastery"
import { learningModules } from "@/lib/learning-modules"
import { summarizeStudyGroups } from "@/lib/learning/skill-groups"
import { containerVariants, itemVariants } from "@/lib/motion"

export default function LearnPage() {
  // Framer's stagger/slide-in entrance isn't covered by the sitewide
  // prefers-reduced-motion CSS rule (that only catches CSS transitions), so
  // it's opted out explicitly here — content just appears, no motion.
  const reduceMotion = useReducedMotion()
  const container = reduceMotion ? undefined : containerVariants
  const item = reduceMotion ? undefined : itemVariants

  const { mastery, loading: masteryLoading } = useSkillMastery()
  const { mission, loading: missionLoading } = useDailyMission()
  const groups = summarizeStudyGroups(mastery)

  return (
    <motion.div
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={container}
      className="space-y-7 pb-12 sm:space-y-8"
    >
      <motion.div variants={item}>
        <p className="app-kicker">Learning Hub</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Study
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          Build the Korean you need for work and daily life.
        </p>
      </motion.div>

      <motion.div variants={item}>
        <StudySkillSummary groups={groups} loading={masteryLoading} />
      </motion.div>

      <motion.div variants={item}>
        <StudyRecommendation mission={mission} loading={missionLoading} />
      </motion.div>

      <motion.section variants={item} aria-labelledby="study-modules" className="space-y-3.5">
        <h2
          id="study-modules"
          className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground"
        >
          Explore
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {learningModules.map((module) => (
            <LearningModuleCard key={module.id} module={module} />
          ))}
        </div>
      </motion.section>
    </motion.div>
  )
}
