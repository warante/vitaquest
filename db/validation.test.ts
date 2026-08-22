import { describe, expect, test } from "bun:test"
import { dailyRecordInputSchema, labInputSchema } from "./validation"

describe("database input schemas", () => {
  test("parses a daily record at the API boundary", () => {
    const result = dailyRecordInputSchema.safeParse({
      profileId: "11111111-1111-4111-8111-111111111111",
      recordDate: "2026-08-21",
      completedActions: 2,
      totalActions: 5,
      xp: 60,
      streakDays: 3,
      actions: [
        { slug: "walk", label: "Caminar", detail: "30 minutos", icon: "🚶", completed: true },
      ],
    })

    expect(result.success).toBe(true)
  })

  test("rejects an invalid laboratory value", () => {
    const result = labInputSchema.safeParse({
      profileId: "11111111-1111-4111-8111-111111111111",
      measuredAt: "2026-08-21",
      marker: "glucose",
      value: "normal",
      unit: "mg/dL",
    })

    expect(result.success).toBe(false)
  })
})
