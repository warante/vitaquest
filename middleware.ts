import { type NextRequest, NextResponse } from "next/server"
import { AUTH_COOKIE_NAME, isValidSessionToken } from "./app/auth"
import { clientIp, consumeRateLimit } from "./app/rate-limit"

const API_RATE_LIMIT = 300
const AI_RATE_LIMIT = 20
const RATE_WINDOW_MS = 60_000

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/")) {
    const isAi = pathname.startsWith("/api/ai/")
    const limit = isAi ? AI_RATE_LIMIT : API_RATE_LIMIT
    const result = consumeRateLimit(
      `api:${clientIp(request)}:${isAi ? "ai" : "default"}`,
      limit,
      RATE_WINDOW_MS,
    )
    if (!result.allowed) {
      const response = NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 })
      response.headers.set("Retry-After", String(result.retryAfterSeconds))
      return response
    }
  }

  const session = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (await isValidSessionToken(session)) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("next", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon-192.svg|icon-512.svg|icon-192.png|icon-512.png|login|api/auth/login|api/health).*)",
  ],
}
