"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, useSyncExternalStore } from "react"

import { AppShell } from "@/components/layout/AppShell"
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow"
import { userApi } from "@/lib/api"
import { isAuthenticated, getUserId } from "@/lib/auth-store"
import { hasCompletedOnboarding, markOnboardingComplete } from "@/lib/onboarding-store"
import { recordLastVisited, type WorkspaceId } from "@/lib/last-visited"
import { sectionRoutePrefixes } from "@/lib/navigation"

// The route layout owns only what has to live at the route boundary: the auth
// gate, the onboarding wizard, and last-visited tracking. Every piece of visual
// navigation chrome lives in <AppShell> (components/layout/*).

const TRACKED_WORKSPACES = Object.keys(sectionRoutePrefixes) as WorkspaceId[]

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname()
  const router = useRouter()
  const [showOnboarding, setShowOnboarding] = useState(false)

  const mounted = useSyncExternalStore(
    (callback) => {
      queueMicrotask(callback)
      return () => undefined
    },
    () => true,
    () => false
  )

  useEffect(() => {
    if (mounted && !isAuthenticated()) {
      router.replace("/login")
    }
  }, [mounted, router])

  // Record the current route against its section so Today's "Continue" cards
  // can deep-link back into whatever the user was actually doing.
  useEffect(() => {
    const workspace = TRACKED_WORKSPACES.find((id) =>
      sectionRoutePrefixes[id].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    )
    if (workspace) recordLastVisited(workspace, pathname)
  }, [pathname])

  useEffect(() => {
    if (!mounted || !isAuthenticated()) return
    const userId = getUserId()
    if (!userId || hasCompletedOnboarding(userId)) return
    let active = true
    // Cross-device fallback: the "seen it" flag is local-only, so also check
    // whether the profile already has a learning goal set (from a prior
    // session on another device) before showing the wizard again.
    userApi
      .getById(userId)
      .then((profile) => {
        if (!active) return
        if (profile.learningGoal) markOnboardingComplete(userId)
        else setShowOnboarding(true)
      })
      .catch(() => {
        /* if the profile check fails, don't block the app on the wizard */
      })
    return () => {
      active = false
    }
  }, [mounted])

  if (!mounted) return null
  if (!isAuthenticated()) return null

  return (
    <>
      <AppShell>{children}</AppShell>
      {showOnboarding && (
        <OnboardingFlow
          userId={getUserId()!}
          onDone={() => {
            markOnboardingComplete(getUserId())
            setShowOnboarding(false)
          }}
        />
      )}
    </>
  )
}
