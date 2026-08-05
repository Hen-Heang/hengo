"use client"

import { motion, useReducedMotion } from "motion/react"

import { LearningModuleCard } from "@/components/learn/LearningModuleCard"
import {
  LEARNING_MODULE_CATEGORIES,
  LEARNING_MODULE_CATEGORY_LABELS,
  learningModulesByCategory,
} from "@/lib/learning-modules"
import { containerVariants, itemVariants } from "@/lib/motion"

export default function LearnPage() {
  // Framer's stagger/slide-in entrance isn't covered by the sitewide
  // prefers-reduced-motion CSS rule (that only catches CSS transitions), so
  // it's opted out explicitly here — content just appears, no motion.
  const reduceMotion = useReducedMotion()
  const container = reduceMotion ? undefined : containerVariants
  const item = reduceMotion ? undefined : itemVariants

  return (
    <motion.div
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={container}
      className="space-y-6 pb-12 sm:space-y-7"
    >
      <motion.div variants={item}>
        <p className="app-kicker">Learning Hub</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Learn</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          Choose what you want to learn or practice.
        </p>
      </motion.div>

      {LEARNING_MODULE_CATEGORIES.map((category) => {
        const modules = learningModulesByCategory(category)

        return (
          <motion.section
            key={category}
            variants={item}
            aria-labelledby={`learn-category-${category}`}
            className="space-y-3"
          >
            <h2
              id={`learn-category-${category}`}
              className="text-sm font-semibold text-muted-foreground"
            >
              {LEARNING_MODULE_CATEGORY_LABELS[category]}
            </h2>
            {modules.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card/40 p-5 text-center">
                <p className="text-sm font-semibold text-foreground">More {LEARNING_MODULE_CATEGORY_LABELS[category].toLowerCase()} modules are on the way</p>
                <p className="mt-1 text-sm text-muted-foreground">Check back soon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {modules.map((module) => (
                  <LearningModuleCard key={module.id} module={module} />
                ))}
              </div>
            )}
          </motion.section>
        )
      })}
    </motion.div>
  )
}
