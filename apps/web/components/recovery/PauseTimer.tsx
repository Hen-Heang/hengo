"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { pauseCurve } from "@/lib/recovery"

const TOTAL_SECONDS = 300

// True dark, fixed regardless of the app's light/dark theme — this screen is
// designed for 1am in a dark room, not for matching the rest of the shell.
export function PauseTimer({ onComplete }: { onComplete: () => Promise<void> }) {
  const router = useRouter()
  const [elapsed, setElapsed] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const startRef = useRef(Date.now())
  // A ref, not the finishing state, guards against double-firing: React's
  // Strict Mode intentionally double-invokes state updater functions to
  // catch impure ones, so a side effect inside setFinishing's updater would
  // run onComplete() twice and log the event twice.
  const finishedRef = useRef(false)

  const finish = async () => {
    if (finishedRef.current) return
    finishedRef.current = true
    setFinishing(true)
    await onComplete()
    router.push("/growth/recovery")
  }

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.min(TOTAL_SECONDS, (Date.now() - startRef.current) / 1000))
    }, 100)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (elapsed >= TOTAL_SECONDS) void finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed])

  const curve = pauseCurve(elapsed, TOTAL_SECONDS)
  const remaining = Math.max(0, Math.ceil(TOTAL_SECONDS - elapsed))
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-black px-6 text-center">
      <div className="relative flex size-56 items-center justify-center sm:size-64">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div
          className="absolute rounded-full bg-blue-500/20"
          style={{ inset: `${(1 - curve) * 20}%`, opacity: 0.35 + curve * 0.5, transition: "inset 120ms linear, opacity 120ms linear" }}
        />
        <div
          className="absolute rounded-full border border-blue-400/40"
          style={{ inset: `${(1 - curve) * 12}%`, transition: "inset 120ms linear" }}
        />
        <span className="relative text-3xl font-bold tabular-nums text-white/90 sm:text-4xl">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>

      <p className="mt-10 max-w-xs text-sm text-white/60">Just breathe. This passes.</p>

      <button
        type="button"
        onClick={finish}
        disabled={finishing}
        className="mt-12 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 disabled:opacity-50"
      >
        {finishing ? "Saving…" : "I'm done"}
      </button>
    </div>
  )
}
