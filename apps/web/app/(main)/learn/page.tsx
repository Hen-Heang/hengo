"use client"

import { motion, useReducedMotion } from "motion/react"

import { LearningModuleCard } from "@/components/learn/LearningModuleCard"
import { learningModules } from "@/lib/learning-modules"
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
      className="space-y-7 pb-12 sm:space-y-8"
    >
      <motion.div variants={item}>
        <p className="app-kicker">Learning Hub</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Study</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          Build the Korean you need for work and daily life.
        </p>
      </motion.div>

      <motion.section variants={item} aria-labelledby="study-modules" className="space-y-3.5">
        <h2 id="study-modules" className="sr-only">
          Study modules
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
