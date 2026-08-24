import { describe, expect, test } from "bun:test"
import { calculateTrend, contextFor, summarizeMetrics } from "./metabolic-markers"

describe("metabolic marker context rules", () => {
  test("classifies triglycerides by range", () => {
    expect(contextFor("triglycerides", 140).status).toBe("normal")
    expect(contextFor("triglycerides", 169).status).toBe("alert")
    expect(contextFor("triglycerides", 210).status).toBe("critical")
  })

  test("classifies insulin resistance by HOMA-IR range", () => {
    expect(contextFor("insulin_resistance", 2).status).toBe("normal")
    expect(contextFor("insulin_resistance", 3).status).toBe("alert")
    expect(contextFor("insulin_resistance", 5).status).toBe("critical")
  })

  test("classifies fatty liver index by FLI range", () => {
    expect(contextFor("fatty_liver_index", 20).status).toBe("normal")
    expect(contextFor("fatty_liver_index", 57.7).status).toBe("alert")
    expect(contextFor("fatty_liver_index", 70).status).toBe("critical")
  })

  test("classifies ALT by range", () => {
    expect(contextFor("alt_gpt", 37).status).toBe("normal")
    expect(contextFor("alt_gpt", 50).status).toBe("alert")
    expect(contextFor("alt_gpt", 90).status).toBe("critical")
  })

  test("every context text includes a non-diagnosis disclaimer", () => {
    for (const type of [
      "triglycerides",
      "insulin_resistance",
      "fatty_liver_index",
      "alt_gpt",
    ] as const) {
      for (const value of [10, 100, 500]) {
        expect(contextFor(type, value).text.toLowerCase()).toContain("no diagnóstico")
      }
    }
  })
})

describe("metric trend calculation", () => {
  test("returns unknown with fewer than two readings", () => {
    expect(calculateTrend([])).toBe("unknown")
    expect(calculateTrend([10])).toBe("unknown")
  })

  test("detects an improving (downward) trend for metabolic markers", () => {
    expect(calculateTrend([200, 190, 185, 160])).toBe("improving")
  })

  test("detects a worsening (upward) trend", () => {
    expect(calculateTrend([160, 170, 175, 190])).toBe("worsening")
  })

  test("treats a small change as stable", () => {
    expect(calculateTrend([160, 161, 160])).toBe("stable")
  })
})

describe("metric summary", () => {
  test("summarizes readings per metric with latest value and history", () => {
    const summary = summarizeMetrics([
      { marker: "triglycerides", value: 180, date: "2026-05-01" },
      { marker: "triglycerides", value: 169, date: "2026-06-01" },
      { marker: "alt_gpt", value: 37, date: "2026-06-01" },
    ])
    const triglycerides = summary.find((metric) => metric.type === "triglycerides")
    const alt = summary.find((metric) => metric.type === "alt_gpt")
    expect(triglycerides?.value).toBe(169)
    expect(triglycerides?.trend).toBe("improving")
    expect(triglycerides?.history).toEqual([
      { date: "2026-05-01", value: 180 },
      { date: "2026-06-01", value: 169 },
    ])
    expect(alt?.value).toBe(37)
    expect(alt?.status).toBe("normal")
  })

  test("returns empty metrics when there are no readings", () => {
    const summary = summarizeMetrics([])
    expect(summary).toHaveLength(4)
    for (const metric of summary) {
      expect(metric.value).toBeNull()
      expect(metric.trend).toBe("unknown")
    }
  })
})
