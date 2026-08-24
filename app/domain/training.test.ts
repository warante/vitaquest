import { describe, expect, test } from "bun:test"
import {
  estimateOneRepMax,
  libraryNames,
  suggestedExercises,
  weeklyPlan,
  workoutTypeLabel,
  workoutTypes,
} from "./training"

describe("training domain", () => {
  test("maps a workout type to its label", () => {
    expect(workoutTypeLabel("fuerza_a")).toBe("Fuerza A")
    expect(workoutTypeLabel("cardio_z2")).toBe("Cardio Z2")
    expect(workoutTypeLabel("desconocido")).toBe("desconocido")
  })

  test("defines the expected workout types", () => {
    expect(workoutTypes.map((item) => item.type)).toContain("fuerza_a")
    expect(workoutTypes.map((item) => item.type)).toContain("cardio_z2")
    expect(workoutTypes.map((item) => item.type)).toContain("custom")
  })

  test("estimates one-rep max with the Epley formula", () => {
    expect(estimateOneRepMax(100, 1)).toBeCloseTo(103.33, 1)
    expect(estimateOneRepMax(100, 10)).toBeCloseTo(133.33, 1)
    expect(estimateOneRepMax(0, 10)).toBe(0)
    expect(estimateOneRepMax(80, 0)).toBe(0)
  })

  test("provides exercise names for the autocomplete library", () => {
    expect(libraryNames).toContain("Sentadilla")
    expect(libraryNames).toContain("Press banca")
    expect(libraryNames.length).toBeGreaterThan(10)
  })

  test("defines a seven-day weekly plan", () => {
    expect(weeklyPlan).toHaveLength(7)
    expect(weeklyPlan[0]).toBe("fuerza_a")
    expect(weeklyPlan[6]).toBe("descanso_activo")
  })

  test("suggests exercises for each strength workout type", () => {
    expect(suggestedExercises("fuerza_a")).toContain("Press banca")
    expect(suggestedExercises("fuerza_b")).toContain("Peso muerto")
    expect(suggestedExercises("fuerza_c")).toContain("Press militar")
    expect(suggestedExercises("cardio_z2")).toContain("Cinta")
    expect(suggestedExercises("descanso_activo")).toHaveLength(0)
  })
})
