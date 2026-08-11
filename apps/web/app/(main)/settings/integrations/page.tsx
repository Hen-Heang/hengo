"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { motion } from "motion/react"
import { toast } from "sonner"

import { BackLink } from "@/components/ui/back-link"
import { GoogleCalendarIntegrationCard } from "@/components/settings/GoogleCalendarIntegrationCard"
import { containerVariants, itemVariants } from "@/lib/motion"

// Handles the redirect back from the Google Calendar OAuth callback
// (?google_calendar=success|error) — toasts once, refetches the connection
// status, then strips the param so a refresh doesn't re-toast.
function ConnectionResultHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const handled = useRef(false)

  useEffect(() => {
    const result = searchParams.get("google_calendar")
    if (!result || handled.current) return
    handled.current = true

    if (result === "success") {
      toast.success("Google Calendar connected")
      void queryClient.invalidateQueries({ queryKey: ["google-calendar-integration"] })
    } else if (result === "error") {
      toast.error("Could not connect Google Calendar", { description: "Please try again." })
    }
    router.replace("/settings/integrations")
  }, [searchParams, router, queryClient])

  return null
}

export default function IntegrationsSettingsPage() {
  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="mx-auto max-w-2xl space-y-6 pb-16">
      <Suspense>
        <ConnectionResultHandler />
      </Suspense>

      <motion.div variants={itemVariants}>
        <BackLink href="/settings" label="Settings" />
        <h1 className="mt-2 text-xl font-bold text-foreground">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect external calendars and services to Hengo.
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <GoogleCalendarIntegrationCard />
      </motion.div>
    </motion.div>
  )
}
