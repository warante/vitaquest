export const AUTH_COOKIE_NAME = "vitaquest_session"
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

function configuredAccessKey(): string | null {
  const { VITAQUEST_ACCESS_KEY: rawAccessKey } = process.env
  const accessKey = rawAccessKey?.trim()
  return accessKey || null
}

async function digest(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function createSessionToken(): Promise<string> {
  const accessKey = configuredAccessKey()
  if (!accessKey) throw new Error("VITAQUEST_ACCESS_KEY no está configurada")
  return digest(`vitaquest:${accessKey}`)
}

export async function isValidAccessKey(value: string): Promise<boolean> {
  const accessKey = configuredAccessKey()
  return value.length > 0 && accessKey !== null && value === accessKey
}

export async function isValidSessionToken(value: string | undefined): Promise<boolean> {
  const accessKey = configuredAccessKey()
  return accessKey !== null && value === (await digest(`vitaquest:${accessKey}`))
}
