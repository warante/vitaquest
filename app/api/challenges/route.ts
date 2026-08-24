import { and, asc, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { type AppDatabase, DatabaseConfigurationError, getDatabase } from "../../../db/client"
import { configuredProfileId } from "../../../db/config"
import { challenges } from "../../../db/schema"
import { challengeCreateSchema, challengeUpdateSchema } from "../../../db/validation"
import { weeklyChallenges } from "../../domain/challenges"

export const runtime = "nodejs"

async function ensureWeeklyChallenges(db: AppDatabase, profileId: string): Promise<void> {
  for (const challenge of weeklyChallenges) {
    const [existing] = await db
      .select({ id: challenges.id })
      .from(challenges)
      .where(and(eq(challenges.profileId, profileId), eq(challenges.slug, challenge.slug)))
      .limit(1)
    if (!existing) {
      await db.insert(challenges).values({
        profileId,
        slug: challenge.slug,
        title: challenge.title,
        detail: challenge.detail,
      })
    }
  }
}

const challengeColumns = {
  id: challenges.id,
  slug: challenges.slug,
  title: challenges.title,
  detail: challenges.detail,
  completed: challenges.completed,
}

export async function GET(): Promise<NextResponse> {
  try {
    const profileId = configuredProfileId()
    const db = await getDatabase()
    await ensureWeeklyChallenges(db, profileId)
    const rows = await db
      .select(challengeColumns)
      .from(challenges)
      .where(eq(challenges.profileId, profileId))
      .orderBy(asc(challenges.createdAt))
    return NextResponse.json({ challenges: rows })
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    return NextResponse.json({ error: "No se pudieron leer los retos" }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const input = challengeCreateSchema.parse(await request.json())
    const profileId = configuredProfileId()
    const db = await getDatabase()
    const [challenge] = await db
      .insert(challenges)
      .values({
        profileId,
        slug: null,
        title: input.title,
        detail: input.detail ?? null,
      })
      .returning(challengeColumns)
    return NextResponse.json({ challenge }, { status: 201 })
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) {
      return NextResponse.json({ error: "Reto no válido" }, { status: 400 })
    }
    return NextResponse.json({ error: "No se pudo añadir el reto" }, { status: 500 })
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const input = challengeUpdateSchema.parse(await request.json())
    const db = await getDatabase()
    const [challenge] = await db
      .update(challenges)
      .set({ completed: input.completed })
      .where(eq(challenges.id, input.id))
      .returning(challengeColumns)
    if (!challenge) {
      return NextResponse.json({ error: "Reto no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ challenge })
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) {
      return NextResponse.json({ error: "Reto no válido" }, { status: 400 })
    }
    return NextResponse.json({ error: "No se pudo actualizar el reto" }, { status: 500 })
  }
}
