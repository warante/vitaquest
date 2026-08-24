import { describe, expect, test } from "bun:test"
import { achievementDefinitions, evaluateAchievements } from "./achievements"

const emptyInput = {
  completedActionsTotal: 0,
  streakDays: 0,
  strengthSessions: 0,
  cardioSessions: 0,
  sessionsTotal: 0,
  metricsCount: 0,
  positiveTrends: 0,
  hasPr: false,
}

describe("achievement system", () => {
  test("starts with every achievement locked", () => {
    const states = evaluateAchievements(emptyInput)
    expect(states.every((state) => !state.unlocked)).toBe(true)
  })

  test("unlocks first-step achievements from activity", () => {
    const states = evaluateAchievements({
      ...emptyInput,
      completedActionsTotal: 1,
      sessionsTotal: 1,
      metricsCount: 1,
    })
    const unlocked = states.filter((state) => state.unlocked).map((state) => state.key)
    expect(unlocked).toContain("first-mission")
    expect(unlocked).toContain("first-session")
    expect(unlocked).toContain("first-metric")
  })

  test("unlocks streak achievements by streak length", () => {
    const states = evaluateAchievements({ ...emptyInput, streakDays: 30 })
    const unlocked = states.filter((state) => state.unlocked).map((state) => state.key)
    expect(unlocked).toContain("streak-7")
    expect(unlocked).toContain("streak-30")
  })

  test("unlocks strength and cardio achievements by session counts", () => {
    const states = evaluateAchievements({
      ...emptyInput,
      strengthSessions: 10,
      cardioSessions: 10,
      hasPr: true,
    })
    const unlocked = states.filter((state) => state.unlocked).map((state) => state.key)
    expect(unlocked).toContain("first-pr")
    expect(unlocked).toContain("strength-10")
    expect(unlocked).toContain("cardio-10")
  })

  test("declares a rarity for every achievement", () => {
    for (const definition of achievementDefinitions) {
      expect(["comun", "poco_comun", "raro", "epico", "legendario"]).toContain(definition.rarity)
    }
  })
})
