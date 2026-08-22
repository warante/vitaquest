import { describe, expect, test } from "bun:test"
import {
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
