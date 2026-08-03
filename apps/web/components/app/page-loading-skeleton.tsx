import { Skeleton } from "@/components/ui/skeleton"

// Generic route-level fallback for Next.js `loading.tsx` boundaries — shown
// immediately during navigation while a heavy client page's JS mounts and
// runs its first render, so the tab never goes blank while that happens.
export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite" aria-label="Loading page">
      <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-5 shadow-sm sm:p-8">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="mt-5 h-10 w-72 max-w-full" />
        <Skeleton className="mt-3 h-5 w-full max-w-lg" />
        <div className="mt-6 flex gap-2.5 border-t border-border/60 pt-5">
          <Skeleton className="h-14 w-28 rounded-xl" />
          <Skeleton className="h-14 w-28 rounded-xl" />
          <Skeleton className="hidden h-14 w-28 rounded-xl sm:block" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <Skeleton className="mt-4 h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
