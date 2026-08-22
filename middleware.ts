import { type NextRequest, NextResponse } from "next/server"
import { AUTH_COOKIE_NAME, isValidSessionToken } from "./app/auth"

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
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
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|login|api/auth/login|api/health).*)",
  ],
}
