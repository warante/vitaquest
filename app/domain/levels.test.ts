import { describe, expect, test } from "bun:test"
import { levelForXp, levelProgress, levelTitle, themeForLevel } from "./levels"

describe("level system", () => {
  test("maps XP to levels using the threshold curve", () => {
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(99)).toBe(1)
    expect(levelForXp(100)).toBe(2)
    expect(levelForXp(299)).toBe(2)
    expect(levelForXp(300)).toBe(3)
    expect(levelForXp(1500)).toBe(6)
    expect(levelForXp(99999)).toBe(6)
  })

  test("returns the title for a level", () => {
    expect(levelTitle(1)).toBe("Novato")
    expect(levelTitle(4)).toBe("Veterano")
    expect(levelTitle(6)).toBe("Leyenda")
  })

  test("computes progress to the next level", () => {
    const start = levelProgress(0)
    expect(start.level).toBe(1)
    expect(start.progress).toBe(0)
    expect(start.nextThreshold).toBe(100)

    const mid = levelProgress(50)
    expect(mid.level).toBe(1)
    expect(mid.progress).toBe(50)

    const max = levelProgress(1500)
    expect(max.level).toBe(6)
    expect(max.nextThreshold).toBeNull()
    expect(max.progress).toBe(100)
  })

  test("maps level to a cosmetic theme", () => {
    expect(themeForLevel(1)).toBe("verde")
    expect(themeForLevel(2)).toBe("verde")
    expect(themeForLevel(3)).toBe("azul")
    expect(themeForLevel(5)).toBe("purpura")
    expect(themeForLevel(6)).toBe("dorado")
  })
})
