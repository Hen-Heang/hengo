import { cn } from "@/lib/utils"

type CardGridProps = {
  children: React.ReactNode
  className?: string
  // Minimum width a card can shrink to before wrapping to the next row. This
  // is what should differ between pages (richer cards need more room) — the
  // *mechanism* (auto-fill/minmax) stays the same everywhere, so column count
  // adapts to whatever width the grid actually has instead of every page
  // hardcoding its own sm:/lg: breakpoint guesses.
  minCardWidth?: number
}

export function CardGrid({ children, className, minCardWidth = 260 }: CardGridProps) {
  return (
    <div
      className={cn("grid gap-4 sm:gap-5", className)}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${minCardWidth}px), 1fr))` }}
    >
      {children}
    </div>
  )
}
