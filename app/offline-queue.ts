export type QueuedMutation = Readonly<{
  key: string
  url: string
  method: "POST" | "PUT" | "DELETE"
  headers: Readonly<Record<string, string>>
  body: string
}>

const STORAGE_KEY = "vitaquest-offline-queue"

function readQueue(): QueuedMutation[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as QueuedMutation[]) : []
  } catch {
    return []
  }
}

function writeQueue(queue: readonly QueuedMutation[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {
    // Almacenamiento no disponible o lleno; se ignora sin romper la interfaz.
  }
}

export function enqueueMutation(mutation: QueuedMutation): void {
  const next = [...readQueue().filter((item) => item.key !== mutation.key), mutation]
  writeQueue(next)
}

export async function flushQueue(): Promise<number> {
  const queue = readQueue()
  if (queue.length === 0) return 0
  const remaining: QueuedMutation[] = []
  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      })
      if (!response.ok) throw new Error(`flush ${item.url}`)
    } catch {
      remaining.push(item)
    }
  }
  writeQueue(remaining)
  return remaining.length
}
