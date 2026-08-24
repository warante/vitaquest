import { and, asc, eq, inArray } from "drizzle-orm"
import { NextResponse } from "next/server"
import { type AppDatabase, DatabaseConfigurationError, getDatabase } from "../../../db/client"
import { configuredProfileId } from "../../../db/config"
import {
  challenges,
  dailyActions,
  dailyRecords,
  labRecords,
  meals,
  profiles,
  trainingSessions,
} from "../../../db/schema"
import { dashboardCreateSchema, dashboardUpdateSchema } from "../../../db/validation"
import type { DashboardDay, DayDetail } from "../../dashboard-types"
import {
  computeCategoryStreaks,
  FIBER_ACTION_SLUGS,
  STEPS_ACTION_SLUGS,
} from "../../domain/category-streaks"
import { calculateStreak, calculateXp, type DailyRecord } from "../../domain/gamification"
import { summarizeMetrics } from "../../domain/metabolic-markers"

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
  {
    slug: "post-meal-walk",
    label: "Caminar después de comer",
    detail: "Caminar de 10 a 15 minutos después de comer",
    icon: "🚶",
  },
  {
    slug: "eat-fruit",
    label: "Comer fruta",
    detail: "Comer de 2 a 3 piezas de fruta al día",
    icon: "🍎",
  },
  {
    slug: "fiber-30g",
    label: "Fibra cerca de 30 g",
    detail: "Legumbres, avena, fruta, verdura, integrales y frutos secos",
    icon: "🌾",
  },
  {
    slug: "walk-8000-steps",
    label: "Caminata",
    detail: "Caminar 8000 pasos o más",
    icon: "👟",
  },
  {
    slug: "stretch-5-min",
    label: "Estirar 5 minutos",
    detail: "Movilidad o estiramientos suaves al final del día",
    icon: "🧘",
  },
  {
    slug: "active-break",
    label: "Pausa activa",
    detail: "Levantarse y moverse 2-3 minutos cada hora de estar sentado",
    icon: "🧍",
  },
  {
    slug: "veggie-serving",
    label: "Ración de verdura",
    detail: "Incluir verdura en las dos comidas principales",
    icon: "🥦",
  },
  {
    slug: "protein-every-meal",
    label: "Proteína en cada comida",
    detail: "Asegurar una fuente de proteína en desayuno, comida y cena",
    icon: "🍗",
  },
  {
    slug: "no-ultraprocessed",
    label: "Sin ultraprocesados hoy",
    detail: "Evitar snacks y refrescos procesados",
    icon: "🚫",
  },
  {
    slug: "light-early-dinner",
    label: "Cenar ligero y temprano",
    detail: "Última comida 2-3 horas antes de acostarse",
    icon: "🍽️",
  },
  {
    slug: "nuts-snack",
    label: "Almendras o frutos secos",
    detail: "Un puñado pequeño como snack saludable",
    icon: "🥜",
  },
  {
    slug: "take-stairs",
    label: "Escaleras en vez de ascensor",
    detail: "Subir por escaleras en vez de ascensor",
    icon: "🪜",
  },
  {
    slug: "reduce-sugar",
    label: "Reducir azúcar",
    detail: "Evitar azúcares añadidos durante el día",
    icon: "🍬",
  },
] as const

const profilePlan = {
  goalSummary: "Mejorar salud metabólica y reducir el riesgo de esteatosis hepática",
  breakfastPattern: "Tazón de avena con leche de avena, nueces y fruta troceada",
  trainingPattern:
    "Fullbody con empuje horizontal y vertical, tirón horizontal y vertical, piernas y gemelos; core y HIIT en días alternos",
} as const

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

async function ensureProfile(db: AppDatabase, profileId: string) {
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
      stepsGoal: profiles.stepsGoal,
      fiberGoal: profiles.fiberGoal,
      strengthGoal: profiles.strengthGoal,
      cardioGoal: profiles.cardioGoal,
      walksGoal: profiles.walksGoal,
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
  const db = await getDatabase()
  const date = todayIsoDate()
  const dates = weekDates(date)
  const [profile, records, labRows, completedChallenges, completedActionRows, trainingRows] =
    await Promise.all([
      ensureProfile(db, profileId),
      db
        .select({
          id: dailyRecords.id,
          date: dailyRecords.recordDate,
          completedActions: dailyRecords.completedActions,
          totalActions: dailyRecords.totalActions,
          xp: dailyRecords.xp,
        })
        .from(dailyRecords)
        .where(eq(dailyRecords.profileId, profileId))
        .orderBy(asc(dailyRecords.recordDate)),
      db
        .select({
          marker: labRecords.marker,
          value: labRecords.value,
          date: labRecords.measuredAt,
        })
        .from(labRecords)
        .where(eq(labRecords.profileId, profileId))
        .orderBy(asc(labRecords.measuredAt)),
      db
        .select({ id: challenges.id })
        .from(challenges)
        .where(and(eq(challenges.profileId, profileId), eq(challenges.completed, true))),
      db
        .select({ date: dailyRecords.recordDate, slug: dailyActions.slug })
        .from(dailyActions)
        .innerJoin(dailyRecords, eq(dailyActions.recordId, dailyRecords.id))
        .where(and(eq(dailyRecords.profileId, profileId), eq(dailyActions.completed, true))),
      db
        .select({
          sessionDate: trainingSessions.sessionDate,
          workoutType: trainingSessions.workoutType,
        })
        .from(trainingSessions)
        .where(eq(trainingSessions.profileId, profileId)),
    ])
  const weekRecords = records.filter((record) => dates.includes(record.date))
  const weekRecordIds = weekRecords.map((record) => record.id)
  const [weekActions, weekMeals] = await Promise.all([
    weekRecordIds.length > 0
      ? db
          .select({
            recordId: dailyActions.recordId,
            slug: dailyActions.slug,
            label: dailyActions.label,
            detail: dailyActions.detail,
            icon: dailyActions.icon,
            completed: dailyActions.completed,
          })
          .from(dailyActions)
          .where(inArray(dailyActions.recordId, weekRecordIds))
      : [],
    db
      .select({
        mealDate: meals.mealDate,
        mealType: meals.mealType,
        name: meals.name,
      })
      .from(meals)
      .where(and(eq(meals.profileId, profileId), inArray(meals.mealDate, dates))),
  ])
  const recordIdByDate = new Map(weekRecords.map((record) => [record.date, record.id]))
  const days: Record<string, DayDetail> = {}
  for (const day of dates) {
    const recordId = recordIdByDate.get(day)
    days[day] = {
      actions: recordId
        ? weekActions
            .filter((action) => action.recordId === recordId)
            .map(({ slug, label, detail, icon, completed }) => ({
              slug,
              label,
              detail,
              icon,
              completed,
            }))
        : [],
      meals: weekMeals
        .filter((meal) => meal.mealDate === day)
        .map(({ mealType, name }) => ({ mealType, name })),
    }
  }
  const stepsDates = new Set(
    completedActionRows.filter((row) => STEPS_ACTION_SLUGS.has(row.slug)).map((row) => row.date),
  )
  const fiberDates = new Set(
    completedActionRows.filter((row) => FIBER_ACTION_SLUGS.has(row.slug)).map((row) => row.date),
  )
  const strengthSessionDates = trainingRows
    .filter((row) => row.workoutType.startsWith("fuerza"))
    .map((row) => row.sessionDate)
  const categoryStreaks = computeCategoryStreaks({
    stepsDates,
    fiberDates,
    strengthSessionDates,
    strengthGoal: profile.strengthGoal,
    today: date,
  })

  return {
    profile: {
      displayName: profile.displayName,
      goalSummary: profile.goalSummary,
      breakfastPattern: profile.breakfastPattern,
      trainingPattern: profile.trainingPattern,
      goals: {
        stepsGoal: profile.stepsGoal,
        fiberGoal: profile.fiberGoal,
        strengthGoal: profile.strengthGoal,
        cardioGoal: profile.cardioGoal,
        walksGoal: profile.walksGoal,
      },
    },
    today: { date },
    days,
    week: serializeWeek(records, dates),
    history: records.map(({ date, completedActions, totalActions }) => ({
      date,
      completedActions,
      totalActions,
    })),
    metrics: summarizeMetrics(
      labRows.map((row) => ({ marker: row.marker, value: row.value, date: row.date })),
    ),
    categoryStreaks,
    totalXp:
      records.reduce((total, record) => total + record.xp, 0) + completedChallenges.length * 40,
  }
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
    const db = await getDatabase()
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
    const db = await getDatabase()
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
