import { NextResponse } from "next/server"
import { z } from "zod"
import {
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
  createSessionToken,
  isValidAccessKey,
} from "../../../auth"

export const runtime = "nodejs"

const loginSchema = z.object({ accessKey: z.string().trim().min(1).max(200) })

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { accessKey } = loginSchema.parse(await request.json())
    if (!(await isValidAccessKey(accessKey))) {
      return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(AUTH_COOKIE_NAME, await createSessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: "/",
    })
    return response
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) {
      return NextResponse.json({ error: "Introduce una clave válida" }, { status: 400 })
    }
    return NextResponse.json({ error: "No se pudo iniciar sesión" }, { status: 500 })
  }
}

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(AUTH_COOKIE_NAME, "", { maxAge: 0, path: "/" })
  return response
}
