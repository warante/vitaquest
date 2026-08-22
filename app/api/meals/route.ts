import { desc, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { DatabaseConfigurationError, getDatabase } from "../../../db/client"
import { meals } from "../../../db/schema"
import { mealInputSchema } from "../../../db/validation"

export const runtime = "nodejs"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const input = mealInputSchema.parse(await request.json())
    const [meal] = await getDatabase().insert(meals).values(input).returning({ id: meals.id })
    return NextResponse.json(meal, { status: 201 })
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) {
      return NextResponse.json({ error: "Comida no válida" }, { status: 400 })
    }
    return NextResponse.json({ error: "No se pudo guardar la comida" }, { status: 500 })
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const profileId = new URL(request.url).searchParams.get("profileId")
  if (!profileId) {
    return NextResponse.json({ error: "profileId es obligatorio" }, { status: 400 })
  }

  try {
    const rows = await getDatabase()
      .select()
      .from(meals)
      .where(eq(meals.profileId, profileId))
      .orderBy(desc(meals.mealDate))
    return NextResponse.json(rows)
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    return NextResponse.json({ error: "No se pudieron leer las comidas" }, { status: 500 })
  }
}
