import { describe, expect, test } from "bun:test"
import { createExportJson } from "./export"

describe("export summary", () => {
  test("creates a portable JSON snapshot", () => {
    const result = createExportJson(
      {
        selectedDate: "2026-08-22",
        xp: 120,
        streakDays: 4,
        actions: [{ label: "Caminar", completed: true }],
        week: [{ date: "2026-08-22", completedActions: 1, totalActions: 5 }],
      },
      "2026-08-22T10:00:00.000Z",
    )

    expect(result).toContain('"exportedAt": "2026-08-22T10:00:00.000Z"')
    expect(result).toContain('"selectedDate": "2026-08-22"')
  })
})
