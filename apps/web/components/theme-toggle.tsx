"use client"

import { useSyncExternalStore } from "react"
import { Check, Laptop, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

function subscribeToHydration(callback: () => void) {
  queueMicrotask(callback)
  return () => undefined
}

const themes = [
  { label: "Light", value: "light", icon: Sun },
  { label: "Dark", value: "dark", icon: Moon },
  { label: "System", value: "system", icon: Laptop },
] as const

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme, theme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  )

  const activeTheme = mounted ? theme : "system"
  const ActiveIcon = mounted && resolvedTheme === "dark" ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "size-11 rounded-full border-border/70 bg-background/80 px-0 backdrop-blur",
            className,
          )}
          aria-label="Toggle theme"
        >
          <ActiveIcon size={20} strokeWidth={1.5} className="text-current" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40 rounded-2xl">
        {themes.map((option) => {
          const Icon = option.icon

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="rounded-xl"
            >
              <Icon size={20} strokeWidth={1.5} className="text-current" />
              {option.label}
              {activeTheme === option.value ? (
                <Check size={20} strokeWidth={1.5} className="ml-auto text-current" />
              ) : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
