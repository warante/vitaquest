import { describe, expect, test } from "bun:test"
import { adaptiveChallenges, adaptiveChallengesFor, tierForLevel } from "./adaptive-challenges"

describe("adaptive challenges", () => {
  test("maps a level to a challenge tier", () => {
    expect(tierForLevel(1)).toBe("facil")
    expect(tierForLevel(2)).toBe("facil")
    expect(tierForLevel(3)).toBe("medio")
    expect(tierForLevel(5)).toBe("dificil")
    expect(tierForLevel(6)).toBe("especial")
  })

  test("returns only challenges available for the level", () => {
    const beginner = adaptiveChallengesFor(1)
    expect(beginner.every((challenge) => challenge.tier === "facil")).toBe(true)

    const advanced = adaptiveChallengesFor(4)
    expect(advanced.some((challenge) => challenge.tier === "medio")).toBe(true)
    expect(advanced.every((challenge) => challenge.tier !== "dificil")).toBe(true)

    const legend = adaptiveChallengesFor(6)
    expect(legend).toHaveLength(adaptiveChallenges.length)
  })

  test("every challenge has a title, description, icon and positive XP", () => {
    for (const challenge of adaptiveChallenges) {
      expect(challenge.title.length).toBeGreaterThan(0)
      expect(challenge.description.length).toBeGreaterThan(0)
      expect(challenge.icon.length).toBeGreaterThan(0)
      expect(challenge.xp).toBeGreaterThan(0)
      expect(["facil", "medio", "dificil", "especial"]).toContain(challenge.tier)
    }
  })
})
