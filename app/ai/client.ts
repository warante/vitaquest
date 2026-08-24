import { AI_TEMPERATURE, resolveModel } from "../domain/ai-models"

export const AI_BASE_URL = "https://llm.cerotenedores.com/v1"

export class AiUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AiUnavailableError"
  }
}

export type ChatMessage = Readonly<{
  role: "system" | "user" | "assistant"
  content: string
}>

export type AiConfig = Readonly<{
  baseUrl: string
  apiKey: string
  model: string
}>

type ChatCompletionResponse = Readonly<{
  choices?: readonly Readonly<{
    message?: Readonly<{ content?: unknown }>
  }>[]
}>

export function getAiConfig(): AiConfig {
  const { VITAQUEST_AI_API_KEY: apiKey, VITAQUEST_AI_MODEL: model } = process.env
  return {
    baseUrl: AI_BASE_URL,
    apiKey: apiKey?.trim() || "",
    model: resolveModel(model),
  }
}

export function isAiConfigured(config: AiConfig = getAiConfig()): boolean {
  return config.apiKey.length > 0
}

export async function chatCompletion(
  messages: readonly ChatMessage[],
  options: Readonly<{
    model?: string | undefined
    temperature?: number | undefined
    maxTokens?: number | undefined
  }> = {},
): Promise<string> {
  const config = getAiConfig()
  if (!isAiConfigured(config)) {
    throw new AiUnavailableError("La IA no está configurada (falta VITAQUEST_AI_API_KEY).")
  }

  const model = resolveModel(options.model ?? config.model)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60_000)
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? AI_TEMPERATURE,
        max_tokens: options.maxTokens ?? 2048,
        stream: false,
      }),
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new AiUnavailableError(`El endpoint de IA respondió ${response.status}.`)
    }
    const data = (await response.json()) as ChatCompletionResponse
    const content = data.choices?.[0]?.message?.content
    if (typeof content !== "string" || content.trim() === "") {
      throw new AiUnavailableError("La IA devolvió una respuesta vacía.")
    }
    return content
  } finally {
    clearTimeout(timeout)
  }
}
