type RateWindow = { count: number; resetAt: number }

const buckets = new Map<string, RateWindow>()

function pruneExpired(now: number): void {
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key)
  }
}

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { readonly allowed: boolean; readonly retryAfterSeconds: number } {
  const now = Date.now()
  pruneExpired(now)

  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  current.count += 1
  if (current.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  return { allowed: true, retryAfterSeconds: 0 }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const firstForwarded = forwarded?.split(",")[0]?.trim()
  if (firstForwarded) return firstForwarded
  return request.headers.get("x-real-ip") ?? "unknown"
}
