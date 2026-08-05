"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { LoaderCircle, Maximize2, Sparkles, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PANEL_ID = "floating-ai-coach"

const FloatingAiCoachPanel = dynamic(
  () =>
    import("@/components/chat/FloatingAiCoachPanel").then(
      (module) => module.FloatingAiCoachPanel
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center" role="status">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Opening your coach…
        </div>
      </div>
    ),
  }
)

type FloatingAiCoachProps = {
  mobile: boolean
  bottomNavVisible: boolean
  keyboardOpen: boolean
}

/**
 * Lightweight global launcher. The persisted chat bundle and its data only load
 * after the first open, then stay mounted so closing the window does not reset a
 * draft or interrupt a streaming response.
 */
export function FloatingAiCoach({
  mobile,
  bottomNavVisible,
  keyboardOpen,
}: FloatingAiCoachProps) {
  const [open, setOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const closeCoach = useCallback(() => {
    setOpen(false)
    window.setTimeout(() => launcherRef.current?.focus(), 0)
  }, [])

  function openCoach() {
    setHasOpened(true)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeCoach()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [closeCoach, open])

  const mobilePanelPosition = bottomNavVisible
    ? "inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] h-[min(36rem,calc(100dvh-9rem-env(safe-area-inset-bottom)))]"
    : "inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] h-[min(36rem,calc(100dvh-5rem-env(safe-area-inset-bottom)))]"

  return (
    <>
      {hasOpened && (
        <section
          id={PANEL_ID}
          role="dialog"
          aria-labelledby={`${PANEL_ID}-title`}
          aria-hidden={!open}
          inert={open ? undefined : true}
          className={cn(
            "fixed z-50 flex overflow-hidden rounded-xl border border-border/80 bg-background shadow-2xl shadow-slate-950/20 dark:shadow-black/40",
            mobile
              ? mobilePanelPosition
              : "bottom-5 right-5 h-[min(42rem,calc(100dvh-2.5rem))] w-[26rem]",
            !open && "hidden"
          )}
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-card px-3.5">
              <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background ring-1 ring-border/70">
                <Image src="/hengo-icon.svg" alt="" width={32} height={32} />
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  id={`${PANEL_ID}-title`}
                  className="truncate text-sm font-semibold text-foreground"
                >
                  Ask AI Coach
                </h2>
                <p className="truncate text-xs text-muted-foreground">
                  Quick help, right here
                </p>
              </div>
              <Button asChild variant="ghost" size="icon-sm">
                <Link
                  href="/chat"
                  onClick={closeCoach}
                  aria-label="Open full AI Coach"
                  title="Open full AI Coach"
                >
                  <Maximize2 className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                ref={closeButtonRef}
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={closeCoach}
                aria-label="Close AI Coach"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="min-h-0 flex-1">
              <FloatingAiCoachPanel active={open} />
            </div>
          </div>
        </section>
      )}

      {!open && !keyboardOpen && (
        <Button
          ref={launcherRef}
          type="button"
          size={mobile ? "icon" : "default"}
          onClick={openCoach}
          aria-label="Open Ask AI Coach"
          aria-controls={PANEL_ID}
          aria-expanded={false}
          className={cn(
            "fixed z-40 rounded-full shadow-lg shadow-primary/30",
            mobile
              ? "right-4 size-14"
              : "bottom-5 right-5 h-12 gap-2.5 px-4",
            mobile && bottomNavVisible
              ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
              : mobile && "bottom-[max(0.75rem,env(safe-area-inset-bottom))]"
          )}
        >
          <Sparkles data-icon="inline-start" className="size-5" aria-hidden="true" />
          {!mobile && <span>Ask AI Coach</span>}
        </Button>
      )}
    </>
  )
}
