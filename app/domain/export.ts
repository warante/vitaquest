import type { DailyRecord } from "./gamification"
import type { MetricPoint } from "./metabolic-markers"

export type ExportMetric = Readonly<{
  label: string
  unit: string
  history: readonly MetricPoint[]
}>

export type ExportTrainingSession = Readonly<{
  sessionDate: string
  workoutType: string
  durationMinutes: number
  rpe: number | null
  feeling: string | null
  notes: string | null
  exercises: readonly Readonly<{
    exerciseName: string
    sets: readonly Readonly<{ reps: number; weight: number | null }>[]
  }>[]
}>

export type ExportPayload = Readonly<{
  exportedAt: string
  selectedDate: string
  xp: number
  streakDays: number
  actions: readonly Readonly<{ label: string; completed: boolean }>[]
  week: readonly DailyRecord[]
  metrics: readonly ExportMetric[]
  training: readonly ExportTrainingSession[]
}>

export function createExportJson(
  input: Omit<ExportPayload, "exportedAt">,
  exportedAt: string,
): string {
  return JSON.stringify({ ...input, exportedAt }, null, 2)
}
