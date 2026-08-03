"use client"

import { motion } from "motion/react"

import { itemVariants } from "@/lib/motion"

export function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      role="alert"
      variants={itemVariants}
      className="rounded-xl border border-destructive/20 bg-destructive/7 px-4 py-3 text-sm font-semibold leading-6 text-destructive"
    >
      {children}
    </motion.div>
  )
}
