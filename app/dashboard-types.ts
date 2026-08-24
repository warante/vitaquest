import type { CategoryStreak } from "./domain/category-streaks"
import type { MetricSummary } from "./domain/metabolic-markers"

export type DashboardAction = Readonly<{
  slug: string
  label: string
  detail: string
  icon: string
  completed: boolean
}>

export type DashboardDay = Readonly<{
  date: string
  label: string
  number: string
  completedActions: number
  totalActions: number
}>

export type DashboardHistoryEntry = Readonly<{
  date: string
  completedActions: number
  totalActions: number
}>

export type DashboardMeal = Readonly<{
  mealType: string
  name: string
}>

export type DayDetail = Readonly<{
  actions: readonly DashboardAction[]
  meals: readonly DashboardMeal[]
}>

export type DashboardResponse = Readonly<{
  profile: Readonly<{
    displayName: string
    goalSummary: string | null
    breakfastPattern: string | null
    trainingPattern: string | null
    goals: Readonly<{
      stepsGoal: number
      fiberGoal: number
      strengthGoal: number
      cardioGoal: number
      walksGoal: number
    }>
  }>
  today: Readonly<{
    date: string
  }>
  days: Readonly<Record<string, DayDetail>>
  week: readonly DashboardDay[]
  history: readonly DashboardHistoryEntry[]
  metrics: readonly MetricSummary[]
  categoryStreaks: readonly CategoryStreak[]
  totalXp: number
}>
