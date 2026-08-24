import { describe, expect, test } from "bun:test"
import { monthlyEvent } from "./events"

describe("temporal events", () => {
  test("returns a deterministic event for a month", () => {
    expect(monthlyEvent("2026-08-23")).toEqual(monthlyEvent("2026-08-24"))
  })

  test("changes the event across months", () => {
    expect(monthlyEvent("2026-08-15").key).not.toBe(monthlyEvent("2026-09-15").key)
  })

  test("labels the period with the month and year", () => {
    expect(monthlyEvent("2026-08-15").period).toBe("Agosto 2026")
    expect(monthlyEvent("2026-01-15").period).toBe("Enero 2026")
  })

  test("falls back gracefully for an invalid date", () => {
    const event = monthlyEvent("")
    expect(event.title.length).toBeGreaterThan(0)
    expect(event.period).toBe("")
  })

  test("every event has a title, description, icon and positive XP", () => {
    for (let month = 1; month <= 12; month++) {
      const event = monthlyEvent(`2026-${String(month).padStart(2, "0")}-15`)
      expect(event.title.length).toBeGreaterThan(0)
      expect(event.description.length).toBeGreaterThan(0)
      expect(event.icon.length).toBeGreaterThan(0)
      expect(event.xp).toBeGreaterThan(0)
    }
  })
})
