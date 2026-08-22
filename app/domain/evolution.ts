import type { DailyRecord, WeekSummary } from "./gamification"

export const goalFocuses = ["Constancia", "Movimiento", "Alimentación"] as const
export type GoalFocus = (typeof goalFocuses)[number]

export type Reminder = Readonly<{
  id: "morning" | "evening"
  label: string
  time: string
  enabled: boolean
}>

export type Achievement = Readonly<{
  key: "first-week" | "streak" | "consistent" | "full-week"
  label: string
  detail: string
  unlocked: boolean
  progress: string
}>

const DAY_MS = 86_400_000
const PROGRAM_WEEKS = 12

export const defaultReminders: readonly Reminder[] = [
  { id: "morning", label: "Revisar la misión del día", time: "08:00", enabled: true },
  { id: "evening", label: "Cerrar el día con calma", time: "20:30", enabled: false },
]

export function getProgramWeek(startDate: string, currentDate: string): number {
  const elapsedDays = Math.floor(
    (Date.parse(`${currentDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / DAY_MS,
  )
  return Math.min(Math.max(Math.floor(elapsedDays / 7) + 1, 1), PROGRAM_WEEKS)
}

export function getProgramProgress(summary: WeekSummary, targetCompletion = 80): number {
  if (targetCompletion <= 0) return 0
  return Math.min(Math.round((summary.averageCompletion / targetCompletion) * 100), 100)
}

export function getAchievements(
  records: readonly DailyRecord[],
  summary: WeekSummary,
  streakDays: number,
): readonly Achievement[] {
  const completedDays = records.filter(
    (record) => record.completedActions >= record.totalActions && record.totalActions > 0,
  ).length
  return [
    {
      key: "first-week",
      label: "Primera semana",
      detail: "Registra siete días de contexto.",
      unlocked: records.length >= 7,
      progress: `${Math.min(records.length, 7)} / 7 días`,
    },
    {
      key: "streak",
      label: "Tres seguidos",
      detail: "Completa tres días consecutivos.",
      unlocked: streakDays >= 3,
      progress: `${Math.min(streakDays, 3)} / 3 días`,
    },
    {
      key: "consistent",
      label: "Ritmo fiable",
      detail: "Mantén una media semanal del 80%.",
      unlocked: summary.averageCompletion >= 80,
      progress: `${summary.averageCompletion} / 80%`,
    },
    {
      key: "full-week",
      label: "Semana completa",
      detail: "Completa todos los días de la semana.",
      unlocked: completedDays >= 7,
      progress: `${completedDays} / 7 días`,
    },
  ]
}
