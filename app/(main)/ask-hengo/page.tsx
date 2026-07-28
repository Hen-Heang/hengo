"use client"

import { motion } from "motion/react"
import { Settings2 } from "lucide-react"
import Link from "next/link"

import { AskHengoChat } from "@/components/memory/AskHengoChat"
import { BackLink } from "@/components/ui/back-link"
import { Button } from "@/components/ui/button"
import { useSessionTimer } from "@/hooks/useSessionTimer"
import { containerVariants, itemVariants } from "@/lib/motion"

export default function AskHengoPage() {
  useSessionTimer("ask_hengo")

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="mx-auto max-w-2xl space-y-4 pb-16">
      <motion.div variants={itemVariants}>
        <BackLink href="/home" label="Home" mobileOnly />
      </motion.div>

      <motion.div variants={itemVariants} className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Ask Hengo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Answers come only from your own notes, journal, goals, and activity — never invented. Every claim links
            back to where it came from.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/ask-hengo/memories">
            <Settings2 size={14} />
            Memories
          </Link>
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <AskHengoChat />
      </motion.div>
    </motion.div>
  )
}
