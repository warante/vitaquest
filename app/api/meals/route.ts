import { and, desc, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { DatabaseConfigurationError, getDatabase } from "../../../db/client"
import { configuredProfileId } from "../../../db/config"
import { meals } from "../../../db/schema"
import { mealInputSchema, mealSubstitutionSchema } from "../../../db/validation"

export const runtime = "nodejs"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const input = mealInputSchema.parse(await request.json())
    const db = await getDatabase()
    const [meal] = await db.insert(meals).values(input).returning({ id: meals.id })
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

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const input = mealSubstitutionSchema.parse(await request.json())
    const profileId = configuredProfileId()
    const db = await getDatabase()
    const meal = await db.transaction(async (transaction) => {
      const [existing] = await transaction
        .select({ id: meals.id })
        .from(meals)
        .where(
          and(
            eq(meals.profileId, profileId),
            eq(meals.mealDate, input.mealDate),
            eq(meals.mealType, input.mealType),
          ),
        )
        .limit(1)
      if (existing) {
        const [updated] = await transaction
          .update(meals)
          .set({ name: input.name })
          .where(eq(meals.id, existing.id))
          .returning({ id: meals.id })
        return updated
      }
      const [created] = await transaction
        .insert(meals)
        .values({ profileId, mealDate: input.mealDate, mealType: input.mealType, name: input.name })
        .returning({ id: meals.id })
      return created
    })
    return NextResponse.json({ id: meal?.id })
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) {
      return NextResponse.json({ error: "Comida no válida" }, { status: 400 })
    }
    return NextResponse.json({ error: "No se pudo actualizar la comida" }, { status: 500 })
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
