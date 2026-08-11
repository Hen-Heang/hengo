/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { HolidayMarker } from "./HolidayMarker"

afterEach(cleanup)

describe("HolidayMarker", () => {
  it("shows both country flags and opens details for the selected date", () => {
    const date = new Date(2026, 0, 1)
    const onClick = vi.fn()

    render(
      <HolidayMarker
        date={date}
        holidays={[
          { date: "2026-01-01", name: "New Year's Day", country: "KR" },
          { date: "2026-01-01", name: "New Year's Day", country: "KH" },
        ]}
        onClick={onClick}
        variant="month"
      />,
    )

    const marker = screen.getByRole("button", {
      name: /view holiday details.*south korea.*cambodia/i,
    })
    expect(marker.querySelector('[data-country-flag="KR"]')).not.toBeNull()
    expect(marker.querySelector('[data-country-flag="KH"]')).not.toBeNull()
    expect(marker.textContent).toContain("2 holidays")

    fireEvent.click(marker)
    expect(onClick).toHaveBeenCalledOnce()
    expect(onClick).toHaveBeenCalledWith(date)
  })
})
