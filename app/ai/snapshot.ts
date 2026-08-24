import { asc, eq } from "drizzle-orm"
import type { AppDatabase } from "../../db/client"
import { dailyRecords, labRecords, profiles, trainingSessions } from "../../db/schema"
import { calculateCurrentStreak, summarizeWeek } from "../domain/gamification"
import type { HealthSnapshot, MetricSnapshot } from "../domain/insights"
import { summarizeMetrics } from "../domain/metabolic-markers"

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

export async function buildHealthSnapshot(
  db: AppDatabase,
  profileId: string,
): Promise<HealthSnapshot> {
  const today = todayIsoDate()
  const dates = weekDates(today)

  const [profileRows, recordRows, labRows, trainingRows] = await Promise.all([
    db
      .select({ strengthGoal: profiles.strengthGoal, cardioGoal: profiles.cardioGoal })
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1),
    db
      .select({
        date: dailyRecords.recordDate,
        completedActions: dailyRecords.completedActions,
        totalActions: dailyRecords.totalActions,
      })
      .from(dailyRecords)
      .where(eq(dailyRecords.profileId, profileId))
      .orderBy(asc(dailyRecords.recordDate)),
    db
      .select({
        marker: labRecords.marker,
        value: labRecords.value,
        measuredAt: labRecords.measuredAt,
      })
      .from(labRecords)
      .where(eq(labRecords.profileId, profileId))
      .orderBy(asc(labRecords.measuredAt)),
    db
      .select({
        sessionDate: trainingSessions.sessionDate,
        workoutType: trainingSessions.workoutType,
        rpe: trainingSessions.rpe,
      })
      .from(trainingSessions)
      .where(eq(trainingSessions.profileId, profileId)),
  ])

  const profile = profileRows[0]
  const weekRecords = recordRows.filter((record) => dates.includes(record.date))
  const weekSummary = summarizeWeek(weekRecords)
  const streakDays = calculateCurrentStreak(
    recordRows.map((record) => ({
      date: record.date,
      completedActions: record.completedActions,
      totalActions: record.totalActions,
    })),
    today,
  )

  const weekSessions = trainingRows.filter((session) => dates.includes(session.sessionDate))
  const strengthSessionsWeek = weekSessions.filter((session) =>
    session.workoutType.startsWith("fuerza"),
  ).length
  const cardioSessionsWeek = weekSessions.filter((session) =>
    session.workoutType.startsWith("cardio"),
  ).length
  const rpeValues = weekSessions.flatMap((session) => (session.rpe !== null ? [session.rpe] : []))
  const avgRpe =
    rpeValues.length > 0
      ? rpeValues.reduce((total, value) => total + value, 0) / rpeValues.length
      : null

  const metrics: readonly MetricSnapshot[] = summarizeMetrics(
    labRows.map((row) => ({ marker: row.marker, value: row.value, date: row.measuredAt })),
  ).map((metric) => ({
    marker: metric.type,
    label: metric.label,
    unit: metric.unit,
    value: metric.value,
    status: metric.status,
    trend: metric.trend,
    history: metric.history,
  }))

  return {
    goals: {
      strengthGoal: profile?.strengthGoal ?? 3,
      cardioGoal: profile?.cardioGoal ?? 150,
    },
    week: {
      completedActions: weekSummary.completedActions,
      totalActions: weekSummary.totalActions,
      averageCompletion: weekSummary.averageCompletion,
    },
    streakDays,
    strengthSessionsWeek,
    cardioSessionsWeek,
    sessionsWeek: weekSessions.length,
    avgRpe,
    metrics,
  }
}
