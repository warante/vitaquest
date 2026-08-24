import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { DatabaseConfigurationError, getDatabase } from "../../../db/client"
import { configuredProfileId } from "../../../db/config"
import { profiles } from "../../../db/schema"
import { settingsUpdateSchema } from "../../../db/validation"

export const runtime = "nodejs"

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const input = settingsUpdateSchema.parse(await request.json())
    const profileId = configuredProfileId()
    const db = await getDatabase()
    const [profile] = await db
      .update(profiles)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(profiles.id, profileId))
      .returning({
        stepsGoal: profiles.stepsGoal,
        fiberGoal: profiles.fiberGoal,
        strengthGoal: profiles.strengthGoal,
        cardioGoal: profiles.cardioGoal,
        walksGoal: profiles.walksGoal,
      })
    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ goals: profile })
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) {
      return NextResponse.json({ error: "Objetivos no válidos" }, { status: 400 })
    }
    return NextResponse.json({ error: "No se pudieron guardar los objetivos" }, { status: 500 })
  }
}
