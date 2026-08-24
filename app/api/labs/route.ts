import { desc, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { DatabaseConfigurationError, getDatabase } from "../../../db/client"
import { labRecords } from "../../../db/schema"
import { labInputSchema } from "../../../db/validation"

export const runtime = "nodejs"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const input = labInputSchema.parse(await request.json())
    const db = await getDatabase()
    const [lab] = await db
      .insert(labRecords)
      .values({ ...input, value: input.value })
      .returning({ id: labRecords.id })
    return NextResponse.json(lab, { status: 201 })
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) {
      return NextResponse.json({ error: "Analítica no válida" }, { status: 400 })
    }
    return NextResponse.json({ error: "No se pudo guardar la analítica" }, { status: 500 })
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const profileId = new URL(request.url).searchParams.get("profileId")
  if (!profileId) {
    return NextResponse.json({ error: "profileId es obligatorio" }, { status: 400 })
  }

  try {
    const db = await getDatabase()
    const rows = await db
      .select()
      .from(labRecords)
      .where(eq(labRecords.profileId, profileId))
      .orderBy(desc(labRecords.measuredAt))
    return NextResponse.json(rows)
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    return NextResponse.json({ error: "No se pudieron leer las analíticas" }, { status: 500 })
  }
}
