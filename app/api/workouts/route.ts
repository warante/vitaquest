import { desc, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { DatabaseConfigurationError, getDatabase } from "../../../db/client"
import { workouts } from "../../../db/schema"
import { workoutInputSchema } from "../../../db/validation"

export const runtime = "nodejs"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const input = workoutInputSchema.parse(await request.json())
    const db = await getDatabase()
    const [workout] = await db.insert(workouts).values(input).returning({ id: workouts.id })
    return NextResponse.json(workout, { status: 201 })
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) {
      return NextResponse.json({ error: "Entrenamiento no válido" }, { status: 400 })
    }
    return NextResponse.json({ error: "No se pudo guardar el entrenamiento" }, { status: 500 })
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
      .from(workouts)
      .where(eq(workouts.profileId, profileId))
      .orderBy(desc(workouts.workoutDate))
    return NextResponse.json(rows)
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    return NextResponse.json({ error: "No se pudieron leer los entrenamientos" }, { status: 500 })
  }
}
