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
})
