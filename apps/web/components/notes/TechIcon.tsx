"use client"

import {
  Code2,
  Coffee,
  Container,
  Database,
  FileCode2,
  Flame,
  Globe,
  Layers,
  Leaf,
  Map,
  Rocket,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TechIconProps {
  slug?: string
  name?: string
  size?: number
  className?: string
}

// lucide-only icon map (koriai has no react-icons). Each category gets a stable
// accent colour reused by NoteCard's hover glow.
const ICON_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  java: { icon: Coffee, color: "#f89820" },
  springboot: { icon: Leaf, color: "#6db33f" },
  mybatis: { icon: Database, color: "#c0392b" },
  sql: { icon: Database, color: "#336791" },
  "jsp-jstl": { icon: FileCode2, color: "#e44d26" },
  jquery: { icon: Code2, color: "#0769ad" },
  projects: { icon: Rocket, color: "#a78bfa" },
  roadmap: { icon: Map, color: "#f59e0b" },
  arch: { icon: Layers, color: "#38bdf8" },
  container: { icon: Container, color: "#22c55e" },
  performance: { icon: Flame, color: "#f97316" },
  global: { icon: Globe, color: "#0ea5e9" },
  common: { icon: Code2, color: "#60a5fa" },
}

const FALLBACK = { icon: Layers, color: "#6b7280" }

export function TechIcon({ slug, name, size = 22, className }: TechIconProps) {
  const key = name ?? slug ?? "common"
  const { icon: Icon, color } = ICON_MAP[key] ?? FALLBACK

  return (
    <Icon
      size={size}
      style={{ color }}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    />
  )
}

export function getTechColor(key: string): string {
  return ICON_MAP[key]?.color ?? FALLBACK.color
}
