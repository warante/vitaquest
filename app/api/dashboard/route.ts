import { and, asc, eq, gte, lte } from "drizzle-orm"
import { NextResponse } from "next/server"
import { DatabaseConfigurationError, getDatabase } from "../../../db/client"
import { dailyActions, dailyRecords, profiles } from "../../../db/schema"
import {
  dashboardCreateSchema,
  dashboardUpdateSchema,
  profileIdSchema,
} from "../../../db/validation"
import type { DashboardDay } from "../../dashboard-types"
import { calculateStreak, calculateXp, type DailyRecord } from "../../domain/gamification"

export const runtime = "nodejs"

const starterActions = [
  {
    slug: "oatmeal-breakfast",
    label: "Desayuno de avena",
    detail: "Avena, leche de avena, nueces y fruta",
    icon: "🥣",
  },
  {
    slug: "daily-movement",
    label: "Movimiento del día",
    detail: "Fullbody, caminata o cardio según el plan",
    icon: "🏋️",
  },
  {
    slug: "drink-water",
    label: "Beber agua",
    detail: "Acercarte a tu objetivo de hidratación",
    icon: "💧",
  },
  {
    slug: "mediterranean-meal",
    label: "Comida mediterránea",
    detail: "Verduras, proteína y grasa saludable",
    icon: "🥗",
  },
  {
    slug: "sleep-on-time",
    label: "Dormir a buena hora",
    detail: "Preparar el descanso",
    icon: "🌙",
  },
] as const

const profilePlan = {
  goalSummary: "Mejorar salud metabólica y reducir el riesgo de esteatosis hepática",
  breakfastPattern: "Tazón de avena con leche de avena, nueces y fruta troceada",
  trainingPattern:
    "Fullbody con empuje horizontal y vertical, tirón horizontal y vertical, piernas y gemelos; core y HIIT en días alternos",
} as const

function configuredProfileId(): string {
  // biome-ignore lint/complexity/useLiteralKeys: ProcessEnv requires indexed access in strict TypeScript.
  const result = profileIdSchema.safeParse(process.env["VITAQUEST_PROFILE_ID"])
  if (!result.success) {
    throw new Error("VITAQUEST_PROFILE_ID no está configurado correctamente")
  }
  return result.data
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function weekDates(date: string): readonly string[] {
  const current = new Date(`${date}T00:00:00Z`)
  const mondayOffset = (current.getUTCDay() + 6) % 7
  current.setUTCDate(current.getUTCDate() - mondayOffset)
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(current)
    day.setUTCDate(current.getUTCDate() + index)
    return day.toISOString().slice(0, 10)
  })
}

function calendarLabel(date: string): Readonly<{ label: string; number: string }> {
  const value = new Date(`${date}T00:00:00Z`)
  const labels = ["D", "L", "M", "X", "J", "V", "S"] as const
  return { label: labels[value.getUTCDay()] ?? "", number: date.slice(-2) }
}

async function ensureProfile(db: ReturnType<typeof getDatabase>, profileId: string) {
  // biome-ignore lint/complexity/useLiteralKeys: ProcessEnv requires indexed access in strict TypeScript.
  const displayName = process.env["VITAQUEST_DISPLAY_NAME"]?.trim() || "David"
  const [profile] = await db
    .insert(profiles)
    .values({ id: profileId, displayName, ...profilePlan })
    .onConflictDoUpdate({
      target: profiles.id,
      set: { displayName, ...profilePlan, updatedAt: new Date() },
    })
    .returning({
      displayName: profiles.displayName,
      goalSummary: profiles.goalSummary,
      breakfastPattern: profiles.breakfastPattern,
      trainingPattern: profiles.trainingPattern,
    })
  if (!profile) {
    throw new Error("No se pudo preparar el perfil")
  }
  return profile
}

function serializeWeek(
  records: readonly DailyRecord[],
  dates: readonly string[],
): readonly DashboardDay[] {
  const byDate = new Map(records.map((record) => [record.date, record]))
  return dates.map((date) => {
    const record = byDate.get(date)
    const label = calendarLabel(date)
    return {
      date,
      ...label,
      completedActions: record?.completedActions ?? 0,
      totalActions: record?.totalActions ?? 0,
    }
  })
}

async function readDashboard() {
  const profileId = configuredProfileId()
  const db = getDatabase()
  const date = todayIsoDate()
  const dates = weekDates(date)
  const [profile, records] = await Promise.all([
    ensureProfile(db, profileId),
    db
      .select({
        date: dailyRecords.recordDate,
        completedActions: dailyRecords.completedActions,
        totalActions: dailyRecords.totalActions,
      })
      .from(dailyRecords)
      .where(
        and(
          eq(dailyRecords.profileId, profileId),
          gte(dailyRecords.recordDate, dates[0] ?? date),
          lte(dailyRecords.recordDate, dates.at(-1) ?? date),
        ),
      )
      .orderBy(asc(dailyRecords.recordDate)),
  ])
  const todayRecord = records.find((record) => record.date === date)
  const actions = todayRecord
    ? await db
        .select({
          slug: dailyActions.slug,
          label: dailyActions.label,
          detail: dailyActions.detail,
          icon: dailyActions.icon,
          completed: dailyActions.completed,
        })
        .from(dailyActions)
        .where(
          eq(
            dailyActions.recordId,
            (
              await db
                .select({ id: dailyRecords.id })
                .from(dailyRecords)
                .where(
                  and(eq(dailyRecords.profileId, profileId), eq(dailyRecords.recordDate, date)),
                )
                .limit(1)
            )[0]?.id ?? "00000000-0000-0000-0000-000000000000",
          ),
        )
    : []
  return { profile, today: { date, actions }, week: serializeWeek(records, dates) }
}

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(await readDashboard())
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    return NextResponse.json({ error: "No se pudo cargar tu dashboard" }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { recordDate } = dashboardCreateSchema.parse(await request.json())
    const profileId = configuredProfileId()
    const db = getDatabase()
    await ensureProfile(db, profileId)
    await db.transaction(async (transaction) => {
      const [record] = await transaction
        .insert(dailyRecords)
        .values({
          profileId,
          recordDate,
          completedActions: 0,
          totalActions: starterActions.length,
          xp: 0,
          streakDays: 0,
        })
        .onConflictDoNothing({ target: [dailyRecords.profileId, dailyRecords.recordDate] })
        .returning({ id: dailyRecords.id })
      if (record) {
        await transaction
          .insert(dailyActions)
          .values(
            starterActions.map((action) => ({ ...action, recordId: record.id, completed: false })),
          )
      }
    })
    return NextResponse.json(await readDashboard(), { status: 201 })
  } catch (error) {
    if (error instanceof DatabaseConfigurationError)
      return NextResponse.json({ error: error.message }, { status: 503 })
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError"))
      return NextResponse.json({ error: "Datos de inicio no válidos" }, { status: 400 })
    return NextResponse.json({ error: "No se pudo crear tu primer día" }, { status: 500 })
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const input = dashboardUpdateSchema.parse(await request.json())
    const profileId = configuredProfileId()
    const db = getDatabase()
    await ensureProfile(db, profileId)
    await db.transaction(async (transaction) => {
      const existing = await transaction
        .select({ id: dailyRecords.id })
        .from(dailyRecords)
        .where(
          and(eq(dailyRecords.profileId, profileId), eq(dailyRecords.recordDate, input.recordDate)),
        )
        .limit(1)
      const completedActions = input.actions.filter((action) => action.completed).length
      const allRecords = await transaction
        .select({
          date: dailyRecords.recordDate,
          completedActions: dailyRecords.completedActions,
          totalActions: dailyRecords.totalActions,
        })
        .from(dailyRecords)
        .where(eq(dailyRecords.profileId, profileId))
      const records = allRecords.map((record) => ({
        date: record.date,
        completedActions: record.completedActions,
        totalActions: record.totalActions,
      }))
      const nextRecords = records
        .filter((record) => record.date !== input.recordDate)
        .concat({ date: input.recordDate, completedActions, totalActions: input.actions.length })
      const streakDays = calculateStreak(nextRecords, input.recordDate)
      const xp = calculateXp(completedActions, input.actions.length, streakDays)
      const [record] = await transaction
        .insert(dailyRecords)
        .values({
          profileId,
          recordDate: input.recordDate,
          completedActions,
          totalActions: input.actions.length,
          xp,
          streakDays,
        })
        .onConflictDoUpdate({
          target: [dailyRecords.profileId, dailyRecords.recordDate],
          set: {
            completedActions,
            totalActions: input.actions.length,
            xp,
            streakDays,
            updatedAt: new Date(),
          },
        })
        .returning({ id: dailyRecords.id })
      if (!record) throw new Error("No se pudo guardar la acción")
      if (existing[0]?.id)
        await transaction.delete(dailyActions).where(eq(dailyActions.recordId, existing[0].id))
      await transaction.insert(dailyActions).values(
        input.actions.map((action) => ({
          ...action,
          recordId: record.id,
          completedAt: action.completed ? new Date() : null,
        })),
      )
    })
    return NextResponse.json(await readDashboard())
  } catch (error) {
    if (error instanceof DatabaseConfigurationError)
      return NextResponse.json({ error: error.message }, { status: 503 })
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError"))
      return NextResponse.json({ error: "Datos de acción no válidos" }, { status: 400 })
    return NextResponse.json({ error: "No se pudo guardar la acción" }, { status: 500 })
  }
}
