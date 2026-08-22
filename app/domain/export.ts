import type { DailyRecord } from "./gamification"

export type ExportPayload = Readonly<{
  exportedAt: string
  selectedDate: string
  xp: number
  streakDays: number
  actions: readonly Readonly<{ label: string; completed: boolean }>[]
  week: readonly DailyRecord[]
}>

export function createExportJson(
  input: Omit<ExportPayload, "exportedAt">,
  exportedAt: string,
): string {
  return JSON.stringify({ ...input, exportedAt }, null, 2)
}
