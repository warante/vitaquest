import { describe, expect, test } from "bun:test"
import {
  answerFromData,
  detectAnomalies,
  type HealthSnapshot,
  type MetricSnapshot,
  ruleBasedInsights,
  trendLabel,
} from "./insights"

function metric(overrides: Partial<MetricSnapshot>): MetricSnapshot {
  return {
    marker: "triglycerides",
    label: "Triglicéridos",
    unit: "mg/dL",
    value: null,
    status: null,
    trend: "unknown",
    history: [],
    ...overrides,
  }
}

function snapshot(overrides: Partial<HealthSnapshot>): HealthSnapshot {
  return {
    goals: { strengthGoal: 3, cardioGoal: 150 },
    week: { completedActions: 0, totalActions: 0, averageCompletion: 0 },
    streakDays: 0,
    strengthSessionsWeek: 0,
    cardioSessionsWeek: 0,
    sessionsWeek: 0,
    avgRpe: null,
    metrics: [],
    ...overrides,
  }
}

describe("trend labels", () => {
  test("maps every trend to a readable label", () => {
    expect(trendLabel("improving")).toBe("mejorando")
    expect(trendLabel("stable")).toBe("estable")
    expect(trendLabel("worsening")).toBe("empeorando")
    expect(trendLabel("unknown")).toBe("sin suficiente historial")
  })
})

describe("anomaly detection", () => {
  test("flags a critical metric as out of range", () => {
    const result = detectAnomalies(
      snapshot({
        metrics: [metric({ value: 210, status: "critical", unit: "mg/dL" })],
      }),
    )
    expect(
      result.some((item) => item.type === "metric_out_of_range" && item.severity === "critical"),
    ).toBe(true)
  })

  test("flags an alert metric as a warning", () => {
    const result = detectAnomalies(snapshot({ metrics: [metric({ value: 169, status: "alert" })] }))
    expect(
      result.some((item) => item.type === "metric_out_of_range" && item.severity === "warning"),
    ).toBe(true)
  })

  test("detects a metric spike larger than 20%", () => {
    const result = detectAnomalies(
      snapshot({
        metrics: [
          metric({
            history: [
              { date: "2026-05-01", value: 100 },
              { date: "2026-06-01", value: 150 },
            ],
          }),
        ],
      }),
    )
    expect(result.some((item) => item.type === "metric_spike")).toBe(true)
  })

  test("ignores small metric changes", () => {
    const result = detectAnomalies(
      snapshot({
        metrics: [
          metric({
            history: [
              { date: "2026-05-01", value: 100 },
              { date: "2026-06-01", value: 104 },
            ],
          }),
        ],
      }),
    )
    expect(result.some((item) => item.type === "metric_spike")).toBe(false)
  })

  test("flags low weekly adherence", () => {
    const result = detectAnomalies(
      snapshot({ week: { completedActions: 3, totalActions: 20, averageCompletion: 15 } }),
    )
    expect(result.some((item) => item.type === "adherence_low")).toBe(true)
  })

  test("flags a week with no data", () => {
    const result = detectAnomalies(snapshot({}))
    expect(result.some((item) => item.type === "no_data")).toBe(true)
  })

  test("flags a training break only when there is data", () => {
    const withoutData = detectAnomalies(snapshot({}))
    expect(withoutData.some((item) => item.type === "training_break")).toBe(false)
    const withData = detectAnomalies(
      snapshot({ week: { completedActions: 5, totalActions: 10, averageCompletion: 50 } }),
    )
    expect(withData.some((item) => item.type === "training_break")).toBe(true)
  })

  test("flags consistently high RPE", () => {
    const result = detectAnomalies(snapshot({ avgRpe: 9 }))
    expect(result.some((item) => item.type === "high_rpe")).toBe(true)
  })
})

describe("rule-based insights", () => {
  test("encourages a fresh week with no data", () => {
    const result = ruleBasedInsights(snapshot({}))
    expect(result.some((item) => item.title === "Semana por estrenar")).toBe(true)
  })

  test("celebrates high adherence", () => {
    const result = ruleBasedInsights(
      snapshot({ week: { completedActions: 40, totalActions: 40, averageCompletion: 100 } }),
    )
    expect(result.some((item) => item.tone === "positive")).toBe(true)
  })

  test("encourages without guilt on low adherence", () => {
    const result = ruleBasedInsights(
      snapshot({ week: { completedActions: 2, totalActions: 20, averageCompletion: 10 } }),
    )
    expect(result.some((item) => item.title === "Una semana, no un veredicto")).toBe(true)
  })

  test("celebrates a streak of seven or more days", () => {
    const result = ruleBasedInsights(snapshot({ streakDays: 9 }))
    expect(result.some((item) => item.title === "Racha de 9 días")).toBe(true)
  })

  test("reports improving and worsening metrics", () => {
    const result = ruleBasedInsights(
      snapshot({
        metrics: [
          metric({ marker: "alt_gpt", label: "ALT / GPT", trend: "improving", value: 30 }),
          metric({
            marker: "fatty_liver_index",
            label: "Índice Hígado Graso",
            trend: "worsening",
            value: 55,
          }),
        ],
      }),
    )
    expect(result.some((item) => item.title.includes("buena tendencia"))).toBe(true)
    expect(result.some((item) => item.title.includes("a vigilar"))).toBe(true)
  })
})

describe("rule-based chat answers", () => {
  test("answers metric questions with the latest value", () => {
    const result = answerFromData(
      snapshot({
        metrics: [
          metric({ label: "Triglicéridos", value: 169, unit: "mg/dL", trend: "improving" }),
        ],
      }),
      "¿Qué tendencia tienen mis triglicéridos?",
    )
    expect(result).toContain("169")
    expect(result).toContain("mejorando")
  })

  test("answers streak questions", () => {
    const result = answerFromData(snapshot({ streakDays: 12 }), "¿Cuántos días de racha llevo?")
    expect(result).toContain("12")
  })

  test("answers training questions", () => {
    const result = answerFromData(
      snapshot({ sessionsWeek: 4, strengthSessionsWeek: 3, cardioSessionsWeek: 1 }),
      "¿Cuántas sesiones hice esta semana?",
    )
    expect(result).toContain("4")
  })

  test("falls back to a generic answer with a disclaimer", () => {
    const result = answerFromData(snapshot({}), "¿Cuál es el sentido de la vida?")
    expect(result.toLowerCase()).toContain("profesional sanitario")
  })
})
