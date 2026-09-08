import { AI_TEMPERATURE } from "./ai-models"

export type AiChatMessage = Readonly<{
  role: "system" | "user" | "assistant"
  content: string
}>

export type AiRemoteModel = Readonly<{
  id: string
  label: string
}>

function normalizeEndpoint(raw: string): string {
  return raw.replace(/\/+$/, "")
}

function authHeaders(apiKey: string): Record<string, string> {
  if (!apiKey.trim()) return {}
  return { Authorization: `Bearer ${apiKey}` }
}

export async function fetchRemoteModels(
  endpoint: string,
  apiKey: string,
): Promise<AiRemoteModel[]> {
  const base = normalizeEndpoint(endpoint)
  const res = await fetch(`${base}/v1/models`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(apiKey),
    },
  })
  if (!res.ok) {
    throw new Error(`No se pudieron obtener los modelos (${res.status})`)
  }
  const json = (await res.json()) as {
    data?: { id: string; owned_by?: string }[]
  }
  if (!Array.isArray(json.data)) return []
  return json.data.map((m) => ({
    id: m.id,
    label: m.owned_by ? `${m.id} · ${m.owned_by}` : m.id,
  }))
}

export async function chatCompletion(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: readonly AiChatMessage[],
): Promise<string> {
  const base = normalizeEndpoint(endpoint)
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(apiKey),
    },
    body: JSON.stringify({
      model,
      temperature: AI_TEMPERATURE,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Error del modelo (${res.status}): ${text.slice(0, 120)}`)
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = json.choices?.[0]?.message?.content
  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("La respuesta del modelo está vacía.")
  }
  return content
}
