import { describe, expect, test } from "bun:test"
import {
  chatUserPrompt,
  healthSnapshotText,
  insightsUserPrompt,
  parseInsightsJson,
  systemPrompt,
} from "./ai-prompts"
import type { HealthSnapshot } from "./insights"

const snapshot: HealthSnapshot = {
  goals: { strengthGoal: 3, cardioGoal: 150 },
  week: { completedActions: 24, totalActions: 40, averageCompletion: 60 },
  streakDays: 5,
  strengthSessionsWeek: 2,
  cardioSessionsWeek: 1,
  sessionsWeek: 3,
  avgRpe: 7.5,
  metrics: [
    {
      marker: "triglycerides",
      label: "Triglicéridos",
      unit: "mg/dL",
      value: 169,
      status: "alert",
      trend: "improving",
      history: [
        { date: "2026-05-01", value: 180 },
        { date: "2026-06-01", value: 169 },
      ],
    },
  ],
}

describe("system prompt", () => {
  test("forbids medical diagnosis and medication changes", () => {
    const prompt = systemPrompt().toLowerCase()
    expect(prompt).toContain("diagnósticos")
    expect(prompt).toContain("medicación")
  })

  test("requires Spanish and a non-diagnosis reminder", () => {
    const prompt = systemPrompt()
    expect(prompt).toContain("español")
    expect(prompt).toContain("profesional sanitario")
  })
})

describe("health snapshot text", () => {
  test("includes adherence, streak and metrics", () => {
    const text = healthSnapshotText(snapshot)
    expect(text).toContain("60%")
    expect(text).toContain("5 días")
    expect(text).toContain("Triglicéridos")
    expect(text).toContain("mejorando")
  })

  test("does not include identifying fields", () => {
    const text = healthSnapshotText(snapshot)
    expect(text).not.toContain("displayName")
    expect(text).not.toContain("profileId")
  })
})

describe("insights prompt", () => {
  test("requests a JSON-only response", () => {
    const prompt = insightsUserPrompt(snapshot)
    expect(prompt).toContain("JSON")
    expect(prompt).toContain("insights")
  })
})

describe("chat prompt", () => {
  test("embeds the question alongside the context", () => {
    const prompt = chatUserPrompt(snapshot, "¿Qué tal voy?")
    expect(prompt).toContain("¿Qué tal voy?")
    expect(prompt).toContain("60%")
  })
})

describe("insights JSON parsing", () => {
  test("parses a clean object response", () => {
    const parsed = parseInsightsJson(
      '{"insights":[{"title":"A","detail":"B"},{"title":"C","detail":"D"}]}',
    )
    expect(parsed).toEqual([
      { title: "A", detail: "B" },
      { title: "C", detail: "D" },
    ])
  })

  test("parses a response wrapped in markdown fences", () => {
    const parsed = parseInsightsJson('```json\n{"insights":[{"title":"A","detail":"B"}]}\n```')
    expect(parsed).toEqual([{ title: "A", detail: "B" }])
  })

  test("parses a top-level array", () => {
    const parsed = parseInsightsJson('[{"title":"A","detail":"B"}]')
    expect(parsed).toEqual([{ title: "A", detail: "B" }])
  })

  test("drops invalid entries", () => {
    const parsed = parseInsightsJson(
      '{"insights":[{"title":"A","detail":"B"},{"title":42,"detail":"C"},{"title":"D","detail":""}]}',
    )
    expect(parsed).toEqual([{ title: "A", detail: "B" }])
  })

  test("returns an empty list for garbage", () => {
    expect(parseInsightsJson("esto no es json")).toEqual([])
  })
})
