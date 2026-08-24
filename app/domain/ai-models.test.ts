import { describe, expect, test } from "bun:test"
import { DEFAULT_AI_MODEL, isSupportedModel, resolveModel } from "./ai-models"

describe("model resolution", () => {
  test("returns the default model when none is provided", () => {
    expect(resolveModel(undefined)).toBe(DEFAULT_AI_MODEL)
    expect(resolveModel("")).toBe(DEFAULT_AI_MODEL)
  })

  test("returns a supported model as-is", () => {
    expect(resolveModel("gemma3:4b")).toBe("gemma3:4b")
  })

  test("falls back to the default for an unsupported model", () => {
    expect(resolveModel("modelo-inventado")).toBe(DEFAULT_AI_MODEL)
  })
})

describe("supported model check", () => {
  test("recognizes the default model", () => {
    expect(isSupportedModel(DEFAULT_AI_MODEL)).toBe(true)
  })

  test("rejects unknown models", () => {
    expect(isSupportedModel("nope")).toBe(false)
  })
})
