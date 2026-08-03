import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Ghost "← Label" link used as a page-top back affordance. Pages whose only
// other way out is the desktop sidebar (mobile has no back in the top bar)
// render this; pass `mobileOnly` on workspace root pages where the desktop
// sidebar already covers navigation.
export function BackLink({
  href,
  label,
  mobileOnly = false,
  className,
}: {
  href: string
  label: string
  mobileOnly?: boolean
  className?: string
}) {
  return (
    <Button asChild variant="ghost" size="sm" className={cn("-ml-2", mobileOnly && "lg:hidden", className)}>
      <Link href={href}>
        <ArrowLeft size={16} strokeWidth={2} />
        {label}
      </Link>
    </Button>
  )
}
