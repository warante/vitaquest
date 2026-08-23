import { describe, expect, test } from "bun:test"
import {
  calculateCurrentStreak,
  calculateStreak,
  calculateXp,
  type DailyRecord,
  getBadgeForStreak,
  summarizeWeek,
} from "./gamification"

const records: readonly DailyRecord[] = [
  { date: "2026-08-17", completedActions: 3, totalActions: 5 },
  { date: "2026-08-18", completedActions: 5, totalActions: 5 },
  { date: "2026-08-19", completedActions: 4, totalActions: 5 },
  { date: "2026-08-20", completedActions: 5, totalActions: 5 },
]

const streakRecords: readonly DailyRecord[] = [
  { date: "2026-08-17", completedActions: 5, totalActions: 5 },
  { date: "2026-08-18", completedActions: 5, totalActions: 5 },
  { date: "2026-08-19", completedActions: 5, totalActions: 5 },
  { date: "2026-08-20", completedActions: 5, totalActions: 5 },
]

describe("gamification rules", () => {
  test("calculates action XP, full-day bonus and streak bonus", () => {
    expect(calculateXp(5, 5, 3)).toBe(450)
  })

  test("counts the consecutive completed days ending on the selected date", () => {
    expect(calculateStreak(streakRecords, "2026-08-20")).toBe(4)
    expect(calculateStreak(streakRecords, "2026-08-19")).toBe(3)
  })

  test("does not count empty calendar days as completed days", () => {
    expect(
      calculateStreak(
        [
          { date: "2026-08-21", completedActions: 0, totalActions: 0 },
          { date: "2026-08-22", completedActions: 5, totalActions: 5 },
        ],
        "2026-08-22",
      ),
    ).toBe(1)
    expect(calculateXp(0, 0, 0)).toBe(0)
  })

  test("keeps the live streak alive when today is not completed yet", () => {
    const records = [
      { date: "2026-08-19", completedActions: 5, totalActions: 5 },
      { date: "2026-08-20", completedActions: 5, totalActions: 5 },
    ]
    expect(calculateCurrentStreak(records, "2026-08-21")).toBe(2)
    expect(calculateCurrentStreak(records, "2026-08-20")).toBe(2)
  })

  test("counts a single completed day as a one-day streak", () => {
    expect(
      calculateCurrentStreak(
        [{ date: "2026-08-20", completedActions: 5, totalActions: 5 }],
        "2026-08-21",
      ),
    ).toBe(1)
  })

  test("returns zero when the last completed day is older than yesterday", () => {
    expect(
      calculateCurrentStreak(
        [{ date: "2026-08-18", completedActions: 5, totalActions: 5 }],
        "2026-08-21",
      ),
    ).toBe(0)
  })

  test("returns the badge tier for the current streak", () => {
    expect(getBadgeForStreak(0)).toEqual({ key: "beginner", label: "Primer paso", threshold: 0 })
    expect(getBadgeForStreak(12)).toEqual({ key: "steady", label: "Ritmo sostenido", threshold: 7 })
  })

  test("summarizes completion across the local week", () => {
    expect(summarizeWeek(records)).toEqual({
      averageCompletion: 85,
      completedActions: 17,
      totalActions: 20,
      bestDate: "2026-08-18",
    })
  })
})
