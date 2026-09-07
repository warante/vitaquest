export type AiModelOption = Readonly<{
  value: string
  label: string
}>

export const aiModelOptions: readonly AiModelOption[] = [
  { value: "qwen2.5-coder-32k:latest", label: "Coder · 32k (default)" },
  { value: "qwen3-coder-30b:latest", label: "Coder heavy · 30B" },
  { value: "gpt-oss:20b", label: "General · 20B" },
  { value: "gemma3:4b", label: "Rápido · 4B" },
]

export const DEFAULT_AI_MODEL = "qwen2.5-coder-32k:latest"

export const AI_TEMPERATURE = 0.2

export function isSupportedModel(model: string): boolean {
  return aiModelOptions.some((option) => option.value === model)
}

export function resolveModel(model: string | undefined): string {
  const candidate = model?.trim() || ""
  return isSupportedModel(candidate) ? candidate : DEFAULT_AI_MODEL
}
