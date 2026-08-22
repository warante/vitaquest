import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { DatabaseConfigurationError, getDatabase } from "../../../db/client"
import { dailyActions, dailyRecords } from "../../../db/schema"
import { dailyRecordInputSchema } from "../../../db/validation"

export const runtime = "nodejs"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const input = dailyRecordInputSchema.parse(await request.json())
    const db = getDatabase()
    const result = await db.transaction(async (transaction) => {
      const [record] = await transaction
        .insert(dailyRecords)
        .values({
          profileId: input.profileId,
          recordDate: input.recordDate,
          completedActions: input.completedActions,
          totalActions: input.totalActions,
          xp: input.xp,
          streakDays: input.streakDays,
        })
        .onConflictDoUpdate({
          target: [dailyRecords.profileId, dailyRecords.recordDate],
          set: {
            completedActions: input.completedActions,
            totalActions: input.totalActions,
            xp: input.xp,
            streakDays: input.streakDays,
            updatedAt: new Date(),
          },
        })
        .returning({ id: dailyRecords.id })

      if (!record) {
        throw new Error("daily record was not returned")
      }

      await transaction.delete(dailyActions).where(eq(dailyActions.recordId, record.id))
      if (input.actions.length > 0) {
        await transaction.insert(dailyActions).values(
          input.actions.map((action) => ({
            recordId: record.id,
            ...action,
            completedAt: action.completed ? new Date() : null,
          })),
        )
      }

      return record
    })

    return NextResponse.json({ id: result.id }, { status: 201 })
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) {
      return NextResponse.json({ error: "Datos diarios no válidos" }, { status: 400 })
    }
    return NextResponse.json({ error: "No se pudo guardar el registro diario" }, { status: 500 })
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const profileId = url.searchParams.get("profileId")
  const recordDate = url.searchParams.get("recordDate")

  if (!profileId || !recordDate) {
    return NextResponse.json({ error: "profileId y recordDate son obligatorios" }, { status: 400 })
  }

  try {
    const db = getDatabase()
    const [record] = await db
      .select()
      .from(dailyRecords)
      .where(and(eq(dailyRecords.profileId, profileId), eq(dailyRecords.recordDate, recordDate)))
      .limit(1)

    return NextResponse.json(record ?? null)
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    return NextResponse.json({ error: "No se pudo leer el registro diario" }, { status: 500 })
  }
}
