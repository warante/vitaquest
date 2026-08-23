import { describe, expect, test } from "bun:test"
import { getAchievements, getProgramProgress, getProgramWeek } from "./evolution"

const week = [
  { date: "2026-08-17", completedActions: 5, totalActions: 5 },
  { date: "2026-08-18", completedActions: 5, totalActions: 5 },
] as const

describe("phase four evolution rules", () => {
  test("keeps a goal inside the twelve-week program", () => {
    expect(getProgramWeek("2026-08-17", "2026-09-02")).toBe(3)
    expect(getProgramWeek("2026-08-17", "2027-01-01")).toBe(12)
  })

  test("compares weekly adherence with the goal", () => {
    expect(
      getProgramProgress({
        averageCompletion: 60,
        completedActions: 6,
        totalActions: 10,
        bestDate: "2026-08-17",
      }),
    ).toBe(75)
  })

  test("unlocks achievements from observable progress", () => {
    const achievements = getAchievements(
      week,
      { averageCompletion: 100, completedActions: 10, totalActions: 10, bestDate: "2026-08-17" },
      3,
    )
    expect(
      achievements
        .filter((achievement) => achievement.unlocked)
        .map((achievement) => achievement.key),
    ).toEqual(["streak", "consistent"])
  })

  test("unlocks first-week from registered days, not from padded calendar days", () => {
    const registered = Array.from({ length: 7 }, (_, index) => ({
      date: `2026-08-${String(10 + index).padStart(2, "0")}`,
      completedActions: 0,
      totalActions: 3,
    }))
    const achievements = getAchievements(
      registered,
      { averageCompletion: 0, completedActions: 0, totalActions: 21, bestDate: "" },
      0,
    )
    expect(achievements.find((achievement) => achievement.key === "first-week")?.unlocked).toBe(
      true,
    )
    expect(achievements.find((achievement) => achievement.key === "full-week")?.unlocked).toBe(
      false,
    )
  })
})
