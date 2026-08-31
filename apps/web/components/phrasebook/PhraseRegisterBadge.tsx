import { Badge } from "@/components/ui/badge"
import type { PhraseRegister } from "@/lib/types"

// 해요체 (polite) is deliberately never labeled "casual" — see
// docs/korean-phrasebook-implementation.md and the seed data's register rule.
const LABELS: Record<PhraseRegister, string> = {
  formal: "격식체 · Formal",
  polite: "해요체 · Polite",
}

export function PhraseRegisterBadge({
  register,
  className,
}: {
  register: PhraseRegister
  className?: string
}) {
  return (
    <Badge variant={register === "formal" ? "accent" : "secondary"} className={className}>
      {LABELS[register]}
    </Badge>
  )
}
