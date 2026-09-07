export type CategoryKey = "pasos" | "fuerza" | "fibra"

export type CategoryStreakUnit = "días" | "semanas"

export type CategoryStreak = Readonly<{
  key: CategoryKey
  label: string
  icon: string
  goal: string
  unit: CategoryStreakUnit
  count: number
}>

export const STEPS_ACTION_SLUGS: ReadonlySet<string> = new Set(["walk-8000-steps", "steps-8000"])

export const FIBER_ACTION_SLUGS: ReadonlySet<string> = new Set(["fiber-30g"])

const categoryDefinitions: readonly Omit<CategoryStreak, "count">[] = [
  { key: "pasos", label: "Pasos", icon: "👟", goal: "objetivo diario de pasos", unit: "días" },
  {
    key: "fuerza",
    label: "Fuerza",
    icon: "🏋️",
    goal: "sesiones de fuerza por semana",
    unit: "semanas",
  },
  { key: "fibra", label: "Fibra", icon: "🌾", goal: "objetivo diario de fibra", unit: "días" },
]

const DAY_MS = 86_400_000

function toDayNumber(date: string): number {
  return Date.parse(`${date}T00:00:00Z`) / DAY_MS
}

function toDateString(dayNumber: number): string {
  return new Date(dayNumber * DAY_MS).toISOString().slice(0, 10)
}

export function consecutiveDays(hitDates: ReadonlySet<string>, endDate: string): number {
  const isHit = (date: string): boolean => hitDates.has(date)
  let cursor = toDayNumber(endDate)
  if (!isHit(toDateString(cursor))) {
    cursor -= 1
    if (!isHit(toDateString(cursor))) return 0
  }
  let streak = 0
  while (isHit(toDateString(cursor))) {
    streak += 1
    cursor -= 1
  }
  return streak
}

export function isoWeekKey(date: string): string {
  const value = new Date(`${date}T00:00:00Z`)
  const day = value.getUTCDay() || 7
  value.setUTCDate(value.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((value.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7)
  return `${value.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
}

export function consecutiveWeeks(hitWeeks: ReadonlySet<string>, endDate: string): number {
  const monday = new Date(`${endDate}T00:00:00Z`)
  const day = monday.getUTCDay() || 7
  monday.setUTCDate(monday.getUTCDate() - (day - 1))
  const currentWeek = isoWeekKey(monday.toISOString().slice(0, 10))
  let streak = hitWeeks.has(currentWeek) ? 1 : 0
  let cursor = new Date(monday.getTime() - 7 * DAY_MS)
  while (hitWeeks.has(isoWeekKey(cursor.toISOString().slice(0, 10)))) {
    streak += 1
    cursor = new Date(cursor.getTime() - 7 * DAY_MS)
  }
  return streak
}

export type CategoryStreakInput = Readonly<{
  stepsDates: ReadonlySet<string>
  fiberDates: ReadonlySet<string>
  strengthSessionDates: readonly string[]
  strengthGoal: number
  today: string
}>

export function computeCategoryStreaks(input: CategoryStreakInput): readonly CategoryStreak[] {
  const sessionsByWeek = new Map<string, number>()
  for (const date of input.strengthSessionDates) {
    const week = isoWeekKey(date)
    sessionsByWeek.set(week, (sessionsByWeek.get(week) ?? 0) + 1)
  }
  const strengthWeeks = new Set<string>()
  for (const [week, count] of sessionsByWeek) {
    if (count >= input.strengthGoal) strengthWeeks.add(week)
  }

  const counts: Record<CategoryKey, number> = {
    pasos: consecutiveDays(input.stepsDates, input.today),
    fuerza: consecutiveWeeks(strengthWeeks, input.today),
    fibra: consecutiveDays(input.fiberDates, input.today),
  }

  return categoryDefinitions.map((definition) => ({
    ...definition,
    count: counts[definition.key],
  }))
}
