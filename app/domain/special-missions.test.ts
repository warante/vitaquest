import { describe, expect, test } from "bun:test"
import { dailySpecialMission, specialMissions } from "./special-missions"

describe("special missions", () => {
  test("returns a mission deterministically for a given date", () => {
    expect(dailySpecialMission("2026-08-23")).toEqual(dailySpecialMission("2026-08-23"))
  })

  test("rotates the mission across consecutive days", () => {
    expect(dailySpecialMission("2026-08-23").key).not.toBe(dailySpecialMission("2026-08-24").key)
  })

  test("every mission has a title, description, icon and positive XP", () => {
    for (const mission of specialMissions) {
      expect(mission.title.length).toBeGreaterThan(0)
      expect(mission.description.length).toBeGreaterThan(0)
      expect(mission.icon.length).toBeGreaterThan(0)
      expect(mission.xp).toBeGreaterThan(0)
    }
  })
})
