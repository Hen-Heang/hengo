import { HOLIDAY_COUNTRY_META, type HolidayCountry } from "@/lib/holidays"
import { cn } from "@/lib/utils"

interface HolidayCountryFlagProps {
  country: HolidayCountry
  className?: string
  decorative?: boolean
}

export function HolidayCountryFlag({
  country,
  className,
  decorative = false,
}: HolidayCountryFlagProps) {
  const accessibilityProps = decorative
    ? { "aria-hidden": true as const }
    : {
        role: "img" as const,
        "aria-label": `${HOLIDAY_COUNTRY_META[country].label} flag`,
      }

  if (country === "KH") {
    return (
      <svg
        viewBox="0 0 48 32"
        data-country-flag="KH"
        focusable="false"
        className={cn(
          "inline-block shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/10",
          className,
        )}
        {...accessibilityProps}
      >
        <rect width="48" height="32" fill="#032EA1" />
        <rect y="8" width="48" height="16" fill="#E00025" />
        <path
          fill="#FFF"
          d="M11 23h26v-2h-2v-4h-3v-4l-2-2v3h-3V9l-3-4-3 4v5h-3v-3l-2 2v4h-3v4h-2v2Zm5-2v-2h16v2H16Zm3-4v-1h10v1H19Z"
        />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 48 32"
      data-country-flag="KR"
      focusable="false"
      className={cn(
        "inline-block shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/10",
        className,
      )}
      {...accessibilityProps}
    >
      <rect width="48" height="32" fill="#FFF" />
      <g transform="rotate(-32 24 16)">
        <path d="M17.5 16a6.5 6.5 0 0 1 13 0Z" fill="#CD2E3A" />
        <path d="M17.5 16a6.5 6.5 0 0 0 13 0Z" fill="#0047A0" />
        <circle cx="20.75" cy="16" r="3.25" fill="#CD2E3A" />
        <circle cx="27.25" cy="16" r="3.25" fill="#0047A0" />
      </g>
      <g fill="#111">
        <g transform="translate(10 8) rotate(-32)">
          <rect x="-4" y="-3" width="8" height="1.2" />
          <rect x="-4" y="-0.6" width="8" height="1.2" />
          <rect x="-4" y="1.8" width="8" height="1.2" />
        </g>
        <g transform="translate(38 8) rotate(32)">
          <rect x="-4" y="-3" width="3.2" height="1.2" />
          <rect x="0.8" y="-3" width="3.2" height="1.2" />
          <rect x="-4" y="-0.6" width="8" height="1.2" />
          <rect x="-4" y="1.8" width="3.2" height="1.2" />
          <rect x="0.8" y="1.8" width="3.2" height="1.2" />
        </g>
        <g transform="translate(10 24) rotate(32)">
          <rect x="-4" y="-3" width="8" height="1.2" />
          <rect x="-4" y="-0.6" width="3.2" height="1.2" />
          <rect x="0.8" y="-0.6" width="3.2" height="1.2" />
          <rect x="-4" y="1.8" width="8" height="1.2" />
        </g>
        <g transform="translate(38 24) rotate(-32)">
          <rect x="-4" y="-3" width="3.2" height="1.2" />
          <rect x="0.8" y="-3" width="3.2" height="1.2" />
          <rect x="-4" y="-0.6" width="3.2" height="1.2" />
          <rect x="0.8" y="-0.6" width="3.2" height="1.2" />
          <rect x="-4" y="1.8" width="8" height="1.2" />
        </g>
      </g>
    </svg>
  )
}
