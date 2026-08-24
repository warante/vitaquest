import { NextResponse } from "next/server"
import { DatabaseConfigurationError, getDatabase } from "../../../db/client"
import { configuredProfileId } from "../../../db/config"
import { labRecords } from "../../../db/schema"
import { metabolicMarkerInputSchema } from "../../../db/validation"

export const runtime = "nodejs"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const input = metabolicMarkerInputSchema.parse(await request.json())
    const profileId = configuredProfileId()
    const db = await getDatabase()
    const [record] = await db
      .insert(labRecords)
      .values({
        profileId,
        marker: input.marker,
        value: input.value,
        unit: input.unit,
        measuredAt: input.measuredAt,
        notes: input.notes ?? null,
      })
      .returning({ id: labRecords.id })
    return NextResponse.json({ id: record?.id }, { status: 201 })
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
