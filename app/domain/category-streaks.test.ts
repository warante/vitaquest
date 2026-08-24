import { describe, expect, test } from "bun:test"
import {
  computeCategoryStreaks,
  consecutiveDays,
  consecutiveWeeks,
  isoWeekKey,
} from "./category-streaks"

describe("category streaks", () => {
  test("maps a date to its ISO week key", () => {
    expect(isoWeekKey("2026-08-17")).toBe("2026-W34")
    expect(isoWeekKey("2026-08-24")).toBe("2026-W35")
    expect(isoWeekKey("2026-01-01")).toBe("2026-W01")
    expect(isoWeekKey("2025-12-29")).toBe("2026-W01")
  })

  test("counts consecutive days ending on the selected date", () => {
    const hit = new Set(["2026-08-20", "2026-08-21", "2026-08-22"])
    expect(consecutiveDays(hit, "2026-08-22")).toBe(3)
  })

  test("keeps a daily streak alive when today is not met yet", () => {
    const hit = new Set(["2026-08-21", "2026-08-22"])
    expect(consecutiveDays(hit, "2026-08-23")).toBe(2)
  })

  test("returns zero when neither today nor yesterday is met", () => {
    const hit = new Set(["2026-08-20"])
    expect(consecutiveDays(hit, "2026-08-23")).toBe(0)
  })

  test("counts consecutive weeks and allows the current week to be in progress", () => {
    const hit = new Set(["2026-W33", "2026-W34"])
    expect(consecutiveWeeks(hit, "2026-08-24")).toBe(2)
  })

  test("counts the current week when it already meets the goal", () => {
    const hit = new Set(["2026-W33", "2026-W34", "2026-W35"])
    expect(consecutiveWeeks(hit, "2026-08-24")).toBe(3)
  })

  test("computes the three category streaks from raw signals", () => {
    const result = computeCategoryStreaks({
      stepsDates: new Set(["2026-08-21", "2026-08-22"]),
      fiberDates: new Set(["2026-08-22"]),
      strengthSessionDates: ["2026-08-17", "2026-08-18"],
      strengthGoal: 3,
      today: "2026-08-23",
    })
    const byKey = new Map(result.map((streak) => [streak.key, streak]))
    expect(byKey.get("pasos")?.count).toBe(2)
    expect(byKey.get("fibra")?.count).toBe(1)
    expect(byKey.get("fuerza")?.count).toBe(0)
  })

  test("counts a strength week only when the weekly goal is reached", () => {
    const result = computeCategoryStreaks({
      stepsDates: new Set(),
      fiberDates: new Set(),
      strengthSessionDates: [
        "2026-08-17",
        "2026-08-18",
        "2026-08-19",
        "2026-08-10",
        "2026-08-11",
        "2026-08-12",
      ],
      strengthGoal: 3,
      today: "2026-08-24",
    })
    const fuerza = result.find((streak) => streak.key === "fuerza")
    expect(fuerza?.count).toBe(2)
  })

  test("every category exposes label, icon, goal, unit and count", () => {
    const result = computeCategoryStreaks({
      stepsDates: new Set(),
      fiberDates: new Set(),
      strengthSessionDates: [],
      strengthGoal: 3,
      today: "2026-08-23",
    })
    expect(result).toHaveLength(3)
    for (const streak of result) {
      expect(streak.label.length).toBeGreaterThan(0)
      expect(streak.icon.length).toBeGreaterThan(0)
      expect(streak.goal.length).toBeGreaterThan(0)
      expect(["días", "semanas"]).toContain(streak.unit)
      expect(streak.count).toBeGreaterThanOrEqual(0)
    }
  })
})
