"use client"

import { useState } from "react"
import { CalendarDays, Eye, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/lib/api"
import { useGoogleCalendarIntegration } from "@/hooks/useGoogleCalendarIntegration"
import { cn } from "@/lib/utils"

export function GoogleCalendarIntegrationCard() {
  const { connected, accountEmail, lastSyncedAt, isLoading, connect, disconnect } =
    useGoogleCalendarIntegration()
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleConnect() {
    setConnecting(true)
    try {
      await connect()
      // Successful connect navigates to Google, so this component normally
      // unmounts before the state needs to be reset.
    } catch (e) {
      setConnecting(false)
      toast.error(getApiErrorMessage(e, "Could not start Google Calendar connection"), {
        description: "Check the Google OAuth configuration in Vercel and try again.",
      })
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await disconnect()
      toast.success("Google Calendar disconnected")
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not disconnect Google Calendar"))
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card shadow-sm dark:bg-slate-900/40",
      )}
    >
      <div className="border-b border-border/60 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/5 text-blue-500">
            <CalendarDays size={15} strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Google Calendar</p>
            <p className="text-sm text-muted-foreground">
              Show your real calendar beside Hengo tasks so you can plan around existing
              commitments.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5">
        {isLoading ? (
          <div className="h-11 animate-pulse rounded-lg bg-accent/5" />
        ) : connected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-lg bg-accent/5 px-4 py-3 dark:bg-white/5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{accountEmail}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye size={11} strokeWidth={2.5} /> Read-only access
                </p>
              </div>
            </div>
            <p className="px-1 text-xs text-muted-foreground">
              {lastSyncedAt
                ? `Last synced ${format(new Date(lastSyncedAt), "MMM d, h:mm a")}`
                : "Connected. Open Calendar to load your events."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" /> Disconnecting…
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              type="button"
              size="sm"
              onClick={() => void handleConnect()}
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" /> Connecting…
                </>
              ) : (
                "Connect Google Calendar"
              )}
            </Button>
            <p className="text-xs leading-5 text-muted-foreground">
              Hengo requests read-only Calendar access. Your Google events stay external and cannot
              be edited from Hengo.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
