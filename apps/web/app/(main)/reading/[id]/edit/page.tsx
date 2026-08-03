"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { UnitEditor } from "@/components/reading/UnitEditor"
import { readingApi } from "@/lib/api"
import type { ReadingUnit } from "@/lib/reading"

export default function EditReadingUnitPage() {
  const params = useParams<{ id: string }>()
  // Same fix as the unit detail page: on a hard load useParams() returns the
  // raw percent-encoded segment for non-ASCII (Korean) ids — decode it so the
  // Supabase lookup matches the stored id.
  const unitId = decodeURIComponent(params.id)
  const [unit, setUnit] = useState<ReadingUnit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    readingApi
      .getUnit(unitId)
      .then((u) => active && setUnit(u))
      .catch(() => active && setUnit(null))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [unitId])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm font-bold">Loading unit…</span>
      </div>
    )
  }

  if (!unit) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-lg font-bold text-foreground">Unit not found.</p>
        <Link href="/reading" className="text-sm font-bold text-blue-600 hover:underline">
          Back to Reading Units
        </Link>
      </div>
    )
  }

  return <UnitEditor key={unit.id} unit={unit} />
}
