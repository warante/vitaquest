export type DailyRecord = Readonly<{
  date: string
  completedActions: number
  totalActions: number
}>

export type Badge = Readonly<{
  key: "beginner" | "momentum" | "steady" | "unstoppable"
  label: string
  threshold: number
}>

export type WeekSummary = Readonly<{
  averageCompletion: number
  completedActions: number
  totalActions: number
  bestDate: string
}>

const XP_PER_ACTION = 60
const FULL_DAY_BONUS = 120
const STREAK_XP_PER_DAY = 10
const DAY_MS = 86_400_000

const badges: readonly Badge[] = [
  { key: "beginner", label: "Primer paso", threshold: 0 },
  { key: "momentum", label: "Buen impulso", threshold: 3 },
  { key: "steady", label: "Ritmo sostenido", threshold: 7 },
  { key: "unstoppable", label: "Constancia imparable", threshold: 14 },
]

function toDayNumber(date: string): number {
  return Date.parse(`${date}T00:00:00Z`) / DAY_MS
}

function toDateString(dayNumber: number): string {
  return new Date(dayNumber * DAY_MS).toISOString().slice(0, 10)
}

export function calculateXp(
  completedActions: number,
  totalActions: number,
  streakDays: number,
): number {
  const actionXp = completedActions * XP_PER_ACTION
  const fullDayBonus = totalActions > 0 && completedActions >= totalActions ? FULL_DAY_BONUS : 0
  return actionXp + fullDayBonus + streakDays * STREAK_XP_PER_DAY
}

export function streakXpMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 2.5
  if (streakDays >= 15) return 2
  if (streakDays >= 8) return 1.5
  if (streakDays >= 4) return 1.2
  return 1
}

export function calculateStreak(records: readonly DailyRecord[], endDate: string): number {
  const recordsByDate = new Map(records.map((record) => [record.date, record]))
  let streak = 0
  let cursor = toDayNumber(endDate)

  while (true) {
    const date = toDateString(cursor)
    const record = recordsByDate.get(date)
    if (
      record === undefined ||
      record.totalActions <= 0 ||
      record.completedActions < record.totalActions
    ) {
      return streak
    }
    streak += 1
    cursor -= 1
  }
}

export function calculateCurrentStreak(records: readonly DailyRecord[], today: string): number {
  const recordsByDate = new Map(records.map((record) => [record.date, record]))
  const isComplete = (date: string): boolean => {
    const record = recordsByDate.get(date)
    return (
      record !== undefined &&
      record.totalActions > 0 &&
      record.completedActions >= record.totalActions
    )
  }

  let cursor = toDayNumber(today)
  if (!isComplete(toDateString(cursor))) {
    cursor -= 1
    if (!isComplete(toDateString(cursor))) {
      return 0
    }
  }

  let streak = 0
  while (isComplete(toDateString(cursor))) {
    streak += 1
    cursor -= 1
  }
  return streak
}

export function getBadgeForStreak(streakDays: number): Badge {
  return badges.reduce((current, badge) =>
    badge.threshold <= streakDays && badge.threshold > current.threshold ? badge : current,
  )
}

export function summarizeWeek(records: readonly DailyRecord[]): WeekSummary {
  if (records.length === 0) {
    return { averageCompletion: 0, completedActions: 0, totalActions: 0, bestDate: "" }
  }

  const completedActions = records.reduce((total, record) => total + record.completedActions, 0)
  const totalActions = records.reduce((total, record) => total + record.totalActions, 0)
  const averageCompletion =
    totalActions === 0 ? 0 : Math.round((completedActions / totalActions) * 100)
  const firstRecord = records[0]
  if (firstRecord === undefined) {
    return { averageCompletion, completedActions, totalActions, bestDate: "" }
  }
  const bestRecord = records.reduce((current, record) => {
    const currentRatio = current.completedActions / current.totalActions
    const nextRatio = record.completedActions / record.totalActions
    return nextRatio > currentRatio ? record : current
  }, firstRecord)

  return {
    averageCompletion,
    completedActions,
    totalActions,
    bestDate: bestRecord?.date ?? "",
  }
}
