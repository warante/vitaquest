import { useCallback, useEffect, useMemo, useState } from "react"
import { MetricLineChart, MetricSparkline, WorkoutCalendar } from "./charts"
import {
  createChallenge,
  createDailyRecord,
  createLabRecord,
  createTrainingSession,
  deleteDailyRecordsForWeek,
  exportAllData,
  getAllDailyRecords,
  getAiSettings,
  getChallenges,
  getDailyActionsForRecord,
  getLabRecords,
  getMealsForDate,
  getOrInitProfile,
  getTrainingSessions,
  importAllData,
  saveAiSettings,
  updateChallenge,
  updateDailyActions,
  updateProfileGoals,
  upsertMeal,
} from "./db/actions"
import { evaluateAchievements } from "./domain/achievements"
import { adaptiveChallengesFor } from "./domain/adaptive-challenges"
import { chatCompletion, fetchRemoteModels } from "./domain/ai-client"
import type { AiModelOption } from "./domain/ai-models"
import { chatUserPrompt, insightsUserPrompt, parseInsightsJson, systemPrompt } from "./domain/ai-prompts"
import {
  computeCategoryStreaks,
  FIBER_ACTION_SLUGS,
  STEPS_ACTION_SLUGS,
} from "./domain/category-streaks"
import { weeklyChallenges } from "./domain/challenges"
import { monthlyEvent } from "./domain/events"
import {
  calculateCurrentStreak,
  getBadgeForStreak,
  streakXpMultiplier,
  summarizeWeek,
} from "./domain/gamification"
import { HEALTH_DISCLAIMER } from "./domain/insights"
import { levelProgress, themeForLevel } from "./domain/levels"
import { defaultMeals, type MealType, mealOptions, mealTypes } from "./domain/meals"
import {
  type MetricPoint,
  type MetricReading,
  metricDefinitions,
  summarizeMetrics,
} from "./domain/metabolic-markers"
import { dailySpecialMission } from "./domain/special-missions"
import {
  estimateOneRepMax,
  feelingOptions,
  libraryNames,
  suggestedExercises,
  weeklyPlan,
  workoutTypeLabel,
  workoutTypes,
} from "./domain/training"
import { formatMetricValue, formatShortDate } from "./format"

const navigation = [
  { label: "Hoy", target: "today", icon: "🎯" },
  { label: "Semana", target: "semana", icon: "📅" },
  { label: "Entreno", target: "entrenamiento", icon: "🏋️" },
  { label: "Retos", target: "retos", icon: "🏆" },
  { label: "Progreso", target: "progreso", icon: "📈" },
  { label: "Coach", target: "coach", icon: "🤖" },
  { label: "Ajustes", target: "ajustes", icon: "⚙️" },
] as const

const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

type ChallengeItem = Readonly<{
  id: string
  slug: string | null
  title: string
  detail: string | null
  completed: boolean
}>

type TrainingSetItem = Readonly<{
  setNumber: number
  reps: number
  weight: number | null
  weightUnit: string
  completed: boolean
  rpe: number | null
}>

type TrainingExerciseItem = Readonly<{
  id: string
  exerciseName: string
  notes: string | null
  sets: readonly TrainingSetItem[]
}>

type TrainingSessionItem = Readonly<{
  id: string
  sessionDate: string
  workoutType: string
  durationMinutes: number
  rpe: number | null
  feeling: string | null
  notes: string | null
  exercises: readonly TrainingExerciseItem[]
}>

type DraftSet = { id: string; reps: string; weight: string }
type DraftExercise = { id: string; name: string; sets: DraftSet[] }

type InsightItem = Readonly<{ title: string; detail: string; tone: string }>

type DashboardData = {
  profile: {
    displayName: string
    goalSummary: string | null
    breakfastPattern: string | null
    trainingPattern: string | null
    goals: {
      stepsGoal: number
      fiberGoal: number
      strengthGoal: number
      cardioGoal: number
      walksGoal: number
    }
  }
  today: { date: string }
  days: Record<
    string,
    {
      actions: { slug: string; label: string; detail: string; icon: string; completed: boolean }[]
      meals: { mealType: string; name: string }[]
    }
  >
  week: { date: string; completedActions: number; totalActions: number }[]
  history: { date: string; completedActions: number; totalActions: number }[]
  metrics: ReturnType<typeof summarizeMetrics>
  categoryStreaks: ReturnType<typeof computeCategoryStreaks>
  totalXp: number
}

function feelingIcon(key: string | null): string {
  return feelingOptions.find((option) => option.key === key)?.icon ?? ""
}

function progressionDelta(points: readonly MetricPoint[]): string {
  if (points.length < 2) return ""
  const latest = points[points.length - 1]?.value ?? 0
  const previous = points[points.length - 2]?.value ?? 0
  const diff = latest - previous
  if (Math.abs(diff) < 0.05) return "→ mismo peso"
  return diff > 0
    ? `↑ ${formatMetricValue(diff, 1)} kg`
    : `↓ ${formatMetricValue(Math.abs(diff), 1)} kg`
}

const trendSymbols: Record<string, string> = {
  improving: "↓",
  stable: "→",
  worsening: "↑",
  unknown: "",
}

function currentWeekDates(): string[] {
  const now = new Date()
  const mondayOffset = (now.getUTCDay() + 6) % 7
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - mondayOffset),
  )
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday)
    day.setUTCDate(monday.getUTCDate() + index)
    return day.toISOString().slice(0, 10)
  })
}

function workoutBadgeClass(type: string): string {
  if (type.startsWith("fuerza")) return "strength"
  if (type.startsWith("cardio")) return "cardio"
  return "recovery"
}

const RING_SIZE = 96
const RING_STROKE = 8
const RING_RADIUS = RING_SIZE / 2 - RING_STROKE
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function ProgressRing({ percent, label }: { percent: number; label: string }): React.ReactElement {
  const offset = RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE
  return (
    <div className="progress-ring">
      <svg width={RING_SIZE} height={RING_SIZE} role="img" aria-label={`${label}: ${percent}%`}>
        <title>{`${label}: ${percent}%`}</title>
        <circle
          className="progress-ring-bg"
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
        />
        <circle
          className="progress-ring-fill"
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="progress-ring-text">
        <div className="progress-ring-percent">{percent}%</div>
        <div className="progress-ring-label">{label}</div>
      </div>
    </div>
  )
}

const STARTER_ACTIONS = [
  {
    slug: "steps-8000",
    label: "≥ 8000 pasos",
    detail: "Movimiento repartido durante el día",
    icon: "",
    completed: false,
  },
  {
    slug: "post-meal-walk",
    label: "Paseo 10-15 min tras una comida",
    detail: "Idealmente después de comida o cena",
    icon: "🚶",
    completed: false,
  },
  {
    slug: "veggies-2-meals",
    label: "Verdura en ≥ 2 comidas",
    detail: "Usa la regla de medio plato",
    icon: "🥦",
    completed: false,
  },
  {
    slug: "fruit-2-pieces",
    label: "2 piezas de fruta entera",
    detail: "Mejor entera que en zumo",
    icon: "🍎",
    completed: false,
  },
  {
    slug: "fiber-30g",
    label: "Fibra cerca de 30 g",
    detail: "Legumbres, avena, fruta, verdura, integrales y frutos secos",
    icon: "🌾",
    completed: false,
  },
  {
    slug: "no-alcohol-sugar",
    label: "Sin alcohol ni bebidas azucaradas",
    detail: "Agua, café o infusiones como base",
    icon: "💧",
    completed: false,
  },
  {
    slug: "daily-movement",
    label: "Movimiento o movilidad del día",
    detail: "Descanso activo",
    icon: "🧘",
    completed: false,
  },
]

async function buildDashboard(): Promise<DashboardData> {
  const profile = await getOrInitProfile()
  const allRecords = await getAllDailyRecords()
  const weekDates = currentWeekDates()
  const today = new Date().toISOString().slice(0, 10)

  const days: DashboardData["days"] = {}
  const week: DashboardData["week"] = []
  const history: DashboardData["history"] = []

  for (const record of allRecords) {
    const actions = await getDailyActionsForRecord(record.id)
    const meals = await getMealsForDate(record.recordDate)
    days[record.recordDate] = {
      actions: actions.map((a) => ({
        slug: a.slug,
        label: a.label,
        detail: a.detail,
        icon: a.icon,
        completed: a.completed,
      })),
      meals: meals.map((m) => ({ mealType: m.mealType, name: m.name })),
    }
    const entry = {
      date: record.recordDate,
      completedActions: record.completedActions,
      totalActions: record.totalActions,
    }
    history.push(entry)
    if (weekDates.includes(record.recordDate)) {
      week.push(entry)
    }
  }

  weekDates.forEach((date) => {
    if (!days[date]) {
      days[date] = { actions: [], meals: [] }
    }
    if (!week.find((w) => w.date === date)) {
      week.push({ date, completedActions: 0, totalActions: 0 })
    }
  })

  const labRecords = await getLabRecords()
  const readings: MetricReading[] = labRecords.map((r) => ({
    marker: r.marker,
    value: r.value,
    date: r.measuredAt,
  }))
  const metrics = summarizeMetrics(readings)

  const stepsDates = new Set<string>()
  const fiberDates = new Set<string>()
  for (const record of allRecords) {
    const actions = await getDailyActionsForRecord(record.id)
    if (actions.some((a) => a.completed && STEPS_ACTION_SLUGS.has(a.slug)))
      stepsDates.add(record.recordDate)
    if (actions.some((a) => a.completed && FIBER_ACTION_SLUGS.has(a.slug)))
      fiberDates.add(record.recordDate)
  }

  const allSessions = await getTrainingSessions()
  const strengthSessionDates = allSessions
    .filter((s) => s.workoutType.startsWith("fuerza"))
    .map((s) => s.sessionDate)

  const categoryStreaks = computeCategoryStreaks({
    stepsDates,
    fiberDates,
    strengthSessionDates,
    strengthGoal: profile.strengthGoal,
    today,
  })

  const totalXp = allRecords.reduce((sum, r) => sum + r.xp, 0)

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
    today: { date: today },
    days,
    week: week.sort((a, b) => a.date.localeCompare(b.date)),
    history: history.sort((a, b) => a.date.localeCompare(b.date)),
    metrics,
    categoryStreaks,
    totalXp,
  }
}

export function App(): React.ReactElement {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("today")
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => (new Date().getUTCDay() + 6) % 7)
  const [goals, setGoals] = useState({
    stepsGoal: 8000,
    fiberGoal: 30,
    strengthGoal: 3,
    cardioGoal: 150,
    walksGoal: 10,
  })
  const [savingGoals, setSavingGoals] = useState(false)
  const [goalsSaved, setGoalsSaved] = useState(false)
  const [substitutingType, setSubstitutingType] = useState<MealType | null>(null)
  const [savingMeal, setSavingMeal] = useState(false)
  const [challenges, setChallenges] = useState<readonly ChallengeItem[]>([])
  const [newChallengeTitle, setNewChallengeTitle] = useState("")
  const [addingChallenge, setAddingChallenge] = useState(false)
  const [savingChallenge, setSavingChallenge] = useState(false)
  const [metricMarker, setMetricMarker] = useState("triglycerides")
  const [metricValue, setMetricValue] = useState("")
  const [metricDate, setMetricDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [metricNotes, setMetricNotes] = useState("")
  const [savingMetric, setSavingMetric] = useState(false)
  const [sessions, setSessions] = useState<readonly TrainingSessionItem[]>([])
  const [draftType, setDraftType] = useState("fuerza_a")
  const [draftDate, setDraftDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [draftDuration, setDraftDuration] = useState("")
  const [draftRpe, setDraftRpe] = useState("")
  const [draftFeeling, setDraftFeeling] = useState("")
  const [draftNotes, setDraftNotes] = useState("")
  const [draftExercises, setDraftExercises] = useState<DraftExercise[]>(() => [
    {
      id: crypto.randomUUID(),
      name: "",
      sets: [{ id: crypto.randomUUID(), reps: "", weight: "" }],
    },
  ])
  const [savingSession, setSavingSession] = useState(false)
  const [insights, setInsights] = useState<readonly InsightItem[]>([])
  const [aiEndpoint, setAiEndpoint] = useState("")
  const [aiApiKey, setAiApiKey] = useState("")
  const [aiEnabled, setAiEnabled] = useState(false)
  const [aiModel, setAiModel] = useState("")
  const [aiModels, setAiModels] = useState<readonly AiModelOption[]>([])
  const [aiTesting, setAiTesting] = useState(false)
  const [aiTestResult, setAiTestResult] = useState<string | null>(null)
  const [aiSaving, setAiSaving] = useState(false)
  const [aiSaved, setAiSaved] = useState(false)
  const [aiLoadingInsights, setAiLoadingInsights] = useState(false)
  const [chatMessages, setChatMessages] = useState<readonly { role: "user" | "assistant"; content: string }[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)

  const weekRecords = dashboard?.week ?? []
  const historyRecords = dashboard?.history ?? []
  const todayDate = dashboard?.today.date ?? ""
  const selectedDate = useMemo(() => {
    const now = new Date()
    const mondayOffset = (now.getUTCDay() + 6) % 7
    const monday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - mondayOffset),
    )
    monday.setUTCDate(monday.getUTCDate() + selectedDayIndex)
    return monday.toISOString().slice(0, 10)
  }, [selectedDayIndex])
  const currentDay = dashboard?.days[selectedDate] ?? { actions: [], meals: [] }
  const actions = currentDay.actions
  const meals = currentDay.meals

  const completedCount = useMemo(() => actions.filter((a) => a.completed).length, [actions])
  const progress = actions.length === 0 ? 0 : Math.round((completedCount / actions.length) * 100)
  const weekSummary = useMemo(() => summarizeWeek(weekRecords), [weekRecords])
  const weekProgress = weekSummary.averageCompletion
  const streakDays = useMemo(
    () => (todayDate ? calculateCurrentStreak(historyRecords, todayDate) : 0),
    [historyRecords, todayDate],
  )
  const badge = getBadgeForStreak(streakDays)
  const totalXp = dashboard?.totalXp ?? 0
  const level = levelProgress(totalXp)
  const streakMultiplier = streakXpMultiplier(streakDays)
  const specialMission = useMemo(() => dailySpecialMission(todayDate), [todayDate])
  const theme = themeForLevel(level.level)
  const categoryStreaks = dashboard?.categoryStreaks ?? []
  const temporalEvent = useMemo(() => monthlyEvent(todayDate), [todayDate])
  const adaptiveChallengesList = useMemo(() => adaptiveChallengesFor(level.level), [level.level])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    return () => {
      document.documentElement.removeAttribute("data-theme")
    }
  }, [theme])

  const weeklyChallengeItems = weeklyChallenges.map((c) => {
    const saved = challenges.find((item) => item.slug === c.slug)
    return {
      id: saved?.id ?? "",
      title: c.title,
      detail: c.detail,
      icon: c.icon,
      completed: saved?.completed ?? false,
    }
  })
  const customChallenges = challenges.filter((item) => item.slug === null)
  const displayChallenges = [
    ...weeklyChallengeItems,
    ...customChallenges.map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail ?? "",
      icon: "🎯",
      completed: item.completed,
    })),
  ]
  const metrics = dashboard?.metrics ?? []

  const personalRecords = useMemo(() => {
    const bestByExercise = new Map<string, number>()
    for (const session of sessions) {
      for (const exercise of session.exercises) {
        const best = exercise.sets.reduce((max, set) => {
          if (set.weight === null || set.weight <= 0) return max
          return Math.max(max, estimateOneRepMax(set.weight, set.reps))
        }, 0)
        if (best > (bestByExercise.get(exercise.exerciseName) ?? 0)) {
          bestByExercise.set(exercise.exerciseName, best)
        }
      }
    }
    return [...bestByExercise.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [sessions])

  const exerciseProgress = useMemo(() => {
    const byName = new Map<string, MetricPoint[]>()
    const sessionsAsc = [...sessions].reverse()
    for (const session of sessionsAsc) {
      for (const exercise of session.exercises) {
        const best = exercise.sets.reduce((max, set) => {
          if (set.weight === null || set.weight <= 0) return max
          return Math.max(max, estimateOneRepMax(set.weight, set.reps))
        }, 0)
        if (best <= 0) continue
        const points = byName.get(exercise.exerciseName) ?? []
        points.push({ date: session.sessionDate, value: best })
        byName.set(exercise.exerciseName, points)
      }
    }
    return [...byName.entries()]
      .map(([name, points]) => ({ name, points }))
      .filter((item) => item.points.length >= 2)
  }, [sessions])

  const sessionDates = useMemo(() => new Set(sessions.map((s) => s.sessionDate)), [sessions])

  const trainingWeekSummary = useMemo(() => {
    const week = currentWeekDates()
    const weekSessions = sessions.filter((s) => week.includes(s.sessionDate))
    const rpeValues = weekSessions.flatMap((s) => (s.rpe !== null ? [s.rpe] : []))
    const avgRpe =
      rpeValues.length > 0 ? rpeValues.reduce((t, v) => t + v, 0) / rpeValues.length : null
    let topProgression: { name: string; delta: number } | null = null
    for (const item of exerciseProgress) {
      const points = item.points
      if (points.length >= 2) {
        const latest = points[points.length - 1]?.value ?? 0
        const previous = points[points.length - 2]?.value ?? 0
        const delta = latest - previous
        if (topProgression === null || delta > topProgression.delta) {
          topProgression = { name: item.name, delta }
        }
      }
    }
    return { completed: weekSessions.length, planned: weeklyPlan.length, avgRpe, topProgression }
  }, [sessions, exerciseProgress])

  const achievementStates = useMemo(() => {
    const completedActionsTotal = historyRecords.reduce((sum, r) => sum + r.completedActions, 0)
    const strengthSessions = sessions.filter((s) => s.workoutType.startsWith("fuerza")).length
    const cardioSessions = sessions.filter((s) => s.workoutType.startsWith("cardio")).length
    const metricsCount = metrics.filter((m) => m.value !== null).length
    const positiveTrends = metrics.filter((m) => m.trend === "improving").length
    const hasPr = sessions.some((s) =>
      s.exercises.some((e) => e.sets.some((set) => set.weight !== null && set.weight > 0)),
    )
    return evaluateAchievements({
      completedActionsTotal,
      streakDays,
      strengthSessions,
      cardioSessions,
      sessionsTotal: sessions.length,
      metricsCount,
      positiveTrends,
      hasPr,
    })
  }, [historyRecords, streakDays, sessions, metrics])

  const loadDashboard = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const data = await buildDashboard()
      setDashboard(data)
      setError("")
    } catch {
      setError("No se pudieron cargar tus datos.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    if (dashboard) setGoals({ ...dashboard.profile.goals })
  }, [dashboard])

  async function createFirstDay(): Promise<void> {
    setCreating(true)
    try {
      await createDailyRecord(selectedDate, STARTER_ACTIONS)
      await loadDashboard()
    } catch {
      setError("No se pudo crear tu primer día.")
    } finally {
      setCreating(false)
    }
  }

  async function toggleAction(slug: string): Promise<void> {
    if (!dashboard || saving) return
    const nextActions = actions.map((a) =>
      a.slug === slug ? { ...a, completed: !a.completed } : a,
    )
    setSaving(true)
    setDashboard((current) =>
      current
        ? {
            ...current,
            days: {
              ...current.days,
              [selectedDate]: {
                actions: nextActions,
                meals: current.days[selectedDate]?.meals ?? [],
              },
            },
          }
        : current,
    )
    try {
      await updateDailyActions(selectedDate, nextActions)
      await loadDashboard()
    } catch {
      setError("No se pudo guardar el cambio.")
    } finally {
      setSaving(false)
    }
  }

  async function saveGoals(): Promise<void> {
    if (!dashboard || savingGoals) return
    setSavingGoals(true)
    setGoalsSaved(false)
    try {
      await updateProfileGoals(goals)
      setGoalsSaved(true)
    } catch {
      setError("No se pudieron guardar los objetivos.")
    } finally {
      setSavingGoals(false)
    }
  }

  async function resetWeek(): Promise<void> {
    if (!window.confirm("¿Reiniciar el progreso de esta semana?")) return
    try {
      await deleteDailyRecordsForWeek(currentWeekDates())
      await loadDashboard()
    } catch {
      setError("No se pudo reiniciar la semana.")
    }
  }

  function updateGoal(field: keyof typeof goals, rawValue: string): void {
    const value = Number(rawValue)
    setGoals((current) => ({ ...current, [field]: Number.isNaN(value) ? 0 : value }))
  }

  async function testAiConnection(): Promise<void> {
    if (!aiEndpoint.trim()) {
      setAiTestResult("Introduce una URL de endpoint válida.")
      return
    }
    setAiTesting(true)
    setAiTestResult(null)
    try {
      const remote = await fetchRemoteModels(aiEndpoint, aiApiKey)
      const options = remote.map((m) => ({ value: m.id, label: m.label }))
      setAiModels(options)
      if (remote.length === 0) {
        setAiTestResult("Conexión OK, pero el endpoint no devuelve modelos.")
      } else {
        setAiTestResult(`Conexión OK · ${remote.length} modelo(s) disponible(s).`)
        if (!aiModel || !options.some((o) => o.value === aiModel)) {
          setAiModel(options[0].value)
        }
      }
    } catch (err) {
      setAiTestResult(
        err instanceof Error ? err.message : "No se pudo conectar con el endpoint.",
      )
    } finally {
      setAiTesting(false)
    }
  }

  async function saveAiConfig(): Promise<void> {
    setAiSaving(true)
    setAiSaved(false)
    try {
      await saveAiSettings({
        endpoint: aiEndpoint.trim(),
        apiKey: aiApiKey,
        enabled: aiEnabled,
        model: aiModel,
      })
      setAiSaved(true)
    } catch {
      setError("No se pudo guardar la configuración de IA.")
    } finally {
      setAiSaving(false)
    }
  }

  function buildHealthSnapshot() {
    if (!dashboard) return null
    const weekTotal = weekRecords.reduce((sum, d) => sum + d.totalActions, 0)
    const weekCompleted = weekRecords.reduce((sum, d) => sum + d.completedActions, 0)
    const now = new Date()
    const mondayOffset = (now.getUTCDay() + 6) % 7
    const monday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - mondayOffset),
    )
    const sunday = new Date(monday)
    sunday.setUTCDate(sunday.getUTCDate() + 6)
    const weekStart = monday.toISOString().slice(0, 10)
    const weekEnd = sunday.toISOString().slice(0, 10)
    const sessionsWeek = sessions.filter((s) => s.sessionDate >= weekStart && s.sessionDate <= weekEnd).length
    const strengthWeek = sessions.filter(
      (s) => s.sessionDate >= weekStart && s.sessionDate <= weekEnd && s.workoutType === "strength",
    ).length
    const cardioWeek = sessions.filter(
      (s) => s.sessionDate >= weekStart && s.sessionDate <= weekEnd && s.workoutType !== "strength",
    ).length
    const rpeValues = sessions.filter((s) => s.rpe !== null).map((s) => s.rpe as number)
    const avgRpe =
      rpeValues.length > 0 ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length : null
    return {
      week: {
        averageCompletion: weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0,
        completedActions: weekCompleted,
        totalActions: weekTotal,
      },
      streakDays,
      sessionsWeek,
      strengthSessionsWeek: strengthWeek,
      cardioSessionsWeek: cardioWeek,
      avgRpe,
      goals: {
        strengthGoal: dashboard.profile.goals.strengthGoal,
        cardioGoal: dashboard.profile.goals.cardioGoal,
      },
      metrics: [],
    }
  }

  async function generateAiInsights(): Promise<void> {
    if (!aiEnabled || !aiEndpoint.trim() || !aiModel) return
    const snapshot = buildHealthSnapshot()
    if (!snapshot) return
    setAiLoadingInsights(true)
    try {
      const response = await chatCompletion(aiEndpoint, aiApiKey, aiModel, [
        { role: "system", content: systemPrompt() },
        { role: "user", content: insightsUserPrompt(snapshot) },
      ])
      const parsed = parseInsightsJson(response)
      setInsights(
        parsed.map((item) => ({
          title: item.title,
          detail: item.detail,
          tone: "neutral" as const,
        })),
      )
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron generar los insights.",
      )
    } finally {
      setAiLoadingInsights(false)
    }
  }

  async function sendChatMessage(): Promise<void> {
    const question = chatInput.trim()
    if (!question || chatLoading || !aiEnabled || !aiEndpoint.trim() || !aiModel) return
    const snapshot = buildHealthSnapshot()
    if (!snapshot) return
    const userMessage = { role: "user" as const, content: question }
    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setChatLoading(true)
    try {
      const response = await chatCompletion(aiEndpoint, aiApiKey, aiModel, [
        { role: "system", content: systemPrompt() },
        { role: "user", content: chatUserPrompt(snapshot, question) },
      ])
      setChatMessages((prev) => [...prev, { role: "assistant", content: response }])
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo responder a la pregunta.")
    } finally {
      setChatLoading(false)
    }
  }

  function mealNameFor(type: MealType): string {
    return meals.find((m) => m.mealType === type)?.name ?? defaultMeals[type]
  }

  async function substituteMeal(type: MealType, name: string): Promise<void> {
    if (!dashboard || savingMeal) return
    setSavingMeal(true)
    try {
      await upsertMeal(selectedDate, type, name)
      const nextMeals = meals.filter((m) => m.mealType !== type).concat({ mealType: type, name })
      setDashboard((current) =>
        current
          ? {
              ...current,
              days: {
                ...current.days,
                [selectedDate]: {
                  actions: current.days[selectedDate]?.actions ?? [],
                  meals: nextMeals,
                },
              },
            }
          : current,
      )
      setSubstitutingType(null)
    } catch {
      setError("No se pudo actualizar la comida.")
    } finally {
      setSavingMeal(false)
    }
  }

  const loadChallenges = useCallback(async (): Promise<void> => {
    try {
      const data = await getChallenges()
      setChallenges(
        data.map((c) => ({
          id: c.id,
          slug: c.slug,
          title: c.title,
          detail: c.detail,
          completed: c.completed,
        })),
      )
    } catch {
      setError("No se pudieron cargar los retos.")
    }
  }, [])

  useEffect(() => {
    void loadChallenges()
  }, [loadChallenges])

  const loadSessions = useCallback(async (): Promise<void> => {
    try {
      const data = await getTrainingSessions()
      setSessions(
        data.map((s) => ({
          id: s.id,
          sessionDate: s.sessionDate,
          workoutType: s.workoutType,
          durationMinutes: s.durationMinutes,
          rpe: s.rpe,
          feeling: s.feeling,
          notes: s.notes,
          exercises: s.exercises.map((e) => ({
            id: e.id,
            exerciseName: e.exerciseName,
            notes: e.notes,
            sets: e.sets.map((set) => ({
              setNumber: set.setNumber,
              reps: set.reps,
              weight: set.weight,
              weightUnit: set.weightUnit,
              completed: set.completed,
              rpe: set.rpe,
            })),
          })),
        })),
      )
    } catch {
      setError("No se pudieron cargar las sesiones.")
    }
  }, [])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  useEffect(() => {
    void (async () => {
      const settings = await getAiSettings()
      setAiEndpoint(settings.endpoint)
      setAiApiKey(settings.apiKey)
      setAiEnabled(settings.enabled)
      setAiModel(settings.model)
      if (settings.endpoint.trim()) {
        try {
          const remote = await fetchRemoteModels(settings.endpoint, settings.apiKey)
          const options = remote.map((m) => ({ value: m.id, label: m.label }))
          setAiModels(options)
          if (!settings.model && options.length > 0) {
            setAiModel(options[0].value)
          }
        } catch {
          /* endpoint not reachable yet */
        }
      }
    })()
  }, [])

  async function addChallenge(): Promise<void> {
    const title = newChallengeTitle.trim()
    if (!title || addingChallenge) return
    setAddingChallenge(true)
    try {
      const c = await createChallenge(title)
      setChallenges((current) => [
        ...current,
        { id: c.id, slug: c.slug, title: c.title, detail: c.detail, completed: c.completed },
      ])
      setNewChallengeTitle("")
    } catch {
      setError("No se pudo añadir el reto.")
    } finally {
      setAddingChallenge(false)
    }
  }

  async function toggleChallenge(id: string, currentCompleted: boolean): Promise<void> {
    if (savingChallenge) return
    setSavingChallenge(true)
    try {
      await updateChallenge(id, !currentCompleted)
      setChallenges((current) =>
        current.map((c) => (c.id === id ? { ...c, completed: !currentCompleted } : c)),
      )
    } catch {
      setError("No se pudo actualizar el reto.")
    } finally {
      setSavingChallenge(false)
    }
  }

  async function addMetric(): Promise<void> {
    const raw = metricValue.trim().replace(",", ".")
    if (!metricMarker || raw === "" || savingMetric) return
    const value = Number(raw)
    if (Number.isNaN(value)) return
    const definition = metricDefinitions.find((d) => d.type === metricMarker)
    setSavingMetric(true)
    try {
      await createLabRecord({
        marker: metricMarker,
        value,
        unit: definition?.unit ?? "",
        measuredAt: metricDate || new Date().toISOString().slice(0, 10),
        notes: metricNotes.trim() || undefined,
      })
      setMetricValue("")
      setMetricNotes("")
      await loadDashboard()
    } catch {
      setError("No se pudo guardar la analítica.")
    } finally {
      setSavingMetric(false)
    }
  }

  function addExercise(): void {
    setDraftExercises((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: "",
        sets: [{ id: crypto.randomUUID(), reps: "", weight: "" }],
      },
    ])
  }

  function removeExercise(index: number): void {
    setDraftExercises((current) => current.filter((_, i) => i !== index))
  }

  function updateExerciseName(index: number, name: string): void {
    setDraftExercises((current) => current.map((e, i) => (i === index ? { ...e, name } : e)))
  }

  function addSet(exerciseIndex: number): void {
    setDraftExercises((current) =>
      current.map((e, i) =>
        i === exerciseIndex
          ? { ...e, sets: [...e.sets, { id: crypto.randomUUID(), reps: "", weight: "" }] }
          : e,
      ),
    )
  }

  function removeSet(exerciseIndex: number, setIndex: number): void {
    setDraftExercises((current) =>
      current.map((e, i) =>
        i === exerciseIndex ? { ...e, sets: e.sets.filter((_, si) => si !== setIndex) } : e,
      ),
    )
  }

  function updateSet(
    exerciseIndex: number,
    setIndex: number,
    field: "reps" | "weight",
    value: string,
  ): void {
    setDraftExercises((current) =>
      current.map((e, i) =>
        i === exerciseIndex
          ? { ...e, sets: e.sets.map((s, si) => (si === setIndex ? { ...s, [field]: value } : s)) }
          : e,
      ),
    )
  }

  async function saveSession(): Promise<void> {
    const duration = Number(draftDuration)
    if (Number.isNaN(duration) || duration <= 0 || savingSession) return
    const exercises = draftExercises
      .map((e) => ({
        exerciseName: e.name.trim(),
        sets: e.sets
          .filter((s) => s.reps.trim() !== "")
          .map((s) => {
            const weight = s.weight.trim().replace(",", ".")
            return {
              reps: Number(s.reps),
              weight: weight === "" ? undefined : Number(weight),
              weightUnit: "kg",
            }
          }),
      }))
      .filter((e) => e.exerciseName !== "" && e.sets.length > 0)
    if (exercises.length === 0) return
    setSavingSession(true)
    try {
      await createTrainingSession({
        sessionDate: draftDate,
        workoutType: draftType,
        durationMinutes: duration,
        rpe: draftRpe.trim() === "" ? undefined : Number(draftRpe),
        feeling: draftFeeling || undefined,
        notes: draftNotes.trim() || undefined,
        exercises,
      })
      setDraftExercises([
        {
          id: crypto.randomUUID(),
          name: "",
          sets: [{ id: crypto.randomUUID(), reps: "", weight: "" }],
        },
      ])
      setDraftDuration("")
      setDraftRpe("")
      setDraftFeeling("")
      setDraftNotes("")
      await loadSessions()
    } catch {
      setError("No se pudo guardar la sesión.")
    } finally {
      setSavingSession(false)
    }
  }

  function startWorkout(dayIndex: number): void {
    const type = weeklyPlan[dayIndex] ?? "custom"
    const date = currentWeekDates()[dayIndex] ?? draftDate
    const suggestions = suggestedExercises(type)
    setDraftType(type)
    setDraftDate(date)
    setDraftExercises(
      suggestions.length > 0
        ? suggestions.map((name) => ({
            id: crypto.randomUUID(),
            name,
            sets: [{ id: crypto.randomUUID(), reps: "", weight: "" }],
          }))
        : [
            {
              id: crypto.randomUUID(),
              name: "",
              sets: [{ id: crypto.randomUUID(), reps: "", weight: "" }],
            },
          ],
    )
    setActiveTab("entrenamiento")
  }

  async function exportData(): Promise<void> {
    try {
      const json = await exportAllData()
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `vitaquest-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setError("No se pudo exportar los datos.")
    }
  }

  async function importData(file: File): Promise<void> {
    try {
      const text = await file.text()
      await importAllData(text)
      await loadDashboard()
      await loadChallenges()
      await loadSessions()
    } catch {
      setError("No se pudo importar los datos.")
    }
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>

      <header className="app-header">
        <div className="header-top">
          <div className="quest-banner">
            <div className="quest-banner-content">
              <p className="quest-eyebrow">12 SEMANAS · SALUD METABÓLICA</p>
              <h1>VitaQuest</h1>
              <p>
                Un plan práctico para convertir alimentación, fuerza, cardio y movimiento diario en
                pequeñas misiones medibles. No busca perfección: busca acumular semanas buenas.
              </p>
            </div>
          </div>
          <div className="progress-ring-container">
            <div className="progress-rings">
              <ProgressRing percent={progress} label="hoy" />
              <ProgressRing percent={weekProgress} label="semana" />
            </div>
            <div className="xp-info">
              <strong>
                {totalXp} XP · Nivel {level.level} · {level.title}
              </strong>
              <span>
                Racha: {streakDays} días · {badge.label}
                {streakMultiplier > 1
                  ? ` · multiplicador ×${streakMultiplier.toString().replace(".", ",")}`
                  : ""}
              </span>
              <div className="level-progress">
                <div className="level-progress-track">
                  <div className="level-progress-fill" style={{ width: `${level.progress}%` }} />
                </div>
                <span className="level-progress-label">
                  {level.nextThreshold === null
                    ? "Nivel máximo"
                    : `${totalXp} / ${level.nextThreshold} XP`}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="health-metrics">
          {metrics.map((metric) => (
            <div key={metric.type} className={`metric-card ${metric.status ?? "empty"}`}>
              <div className="metric-label">{metric.label}</div>
              <div className="metric-value">
                <span className="metric-number">
                  {metric.value === null ? "—" : formatMetricValue(metric.value, metric.decimals)}
                </span>
                {metric.unit ? <span className="metric-unit">{metric.unit}</span> : null}
                <span className={`metric-trend trend-${metric.trend}`} aria-hidden="true">
                  {trendSymbols[metric.trend]}
                </span>
              </div>
              <div className="metric-context">
                {metric.value === null ? "Sin registros todavía." : metric.context}
              </div>
              <MetricSparkline points={metric.history} />
            </div>
          ))}
        </div>
      </header>

      <nav className="tab-navigation" aria-label="Navegación principal">
        <div className="tab-list" role="tablist" aria-label="Secciones">
          {navigation.map((item) => (
            <button
              key={item.target}
              id={`tab-${item.target}`}
              role="tab"
              aria-selected={activeTab === item.target}
              aria-controls={`panel-${item.target}`}
              className={`tab-item ${activeTab === item.target ? "active" : ""}`}
              onClick={() => setActiveTab(item.target)}
              type="button"
            >
              <span className="tab-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="tab-label">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="content" id="main-content" aria-busy={loading}>
        {loading ? (
          <div className="loading-state" role="status" aria-live="polite">
            <div className="loading-state-icon" aria-hidden="true">
              ⏳
            </div>
            <h3>Cargando tu espacio…</h3>
          </div>
        ) : null}
        {error ? (
          <div className="error-state" role="alert">
            <h3>Error</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={() => void loadDashboard()} type="button">
              Reintentar
            </button>
          </div>
        ) : null}

        {activeTab === "today" && (
          <div id="panel-today" role="tabpanel" aria-labelledby="tab-today">
            <div className="day-selector">
              {daysOfWeek.map((day, index) => (
                <button
                  key={day}
                  className={`day-pill ${selectedDayIndex === index ? "active" : ""}`}
                  onClick={() => setSelectedDayIndex(index)}
                  type="button"
                >
                  {day}
                </button>
              ))}
            </div>
            <div className="special-mission">
              <span className="special-mission-icon">{specialMission.icon}</span>
              <div className="special-mission-content">
                <div className="special-mission-label">Misión del día</div>
                <div className="special-mission-title">{specialMission.title}</div>
                <div className="special-mission-description">{specialMission.description}</div>
              </div>
              <span className="special-mission-xp">+{specialMission.xp} XP</span>
            </div>
            <section className="section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Misiones · {daysOfWeek[selectedDayIndex]}</h2>
                  <p className="section-subtitle">
                    Cada misión suma 10 XP. Un día al 70% o más cuenta para la racha.
                  </p>
                </div>
              </div>
              {actions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">✦</div>
                  <h3>Aún no tienes misiones</h3>
                  <p>Empieza con un plan base editable.</p>
                  <button
                    className="btn-primary"
                    onClick={() => void createFirstDay()}
                    disabled={creating}
                    type="button"
                  >
                    {creating ? "Creando…" : "Crear mi primer día"}
                  </button>
                </div>
              ) : (
                <div className="missions-list">
                  {actions.map((action) => (
                    <button
                      key={action.slug}
                      className={`mission-card ${action.completed ? "completed" : ""}`}
                      onClick={() => void toggleAction(action.slug)}
                      type="button"
                    >
                      <div className="mission-checkbox" />
                      <div className="mission-content">
                        <div className="mission-title">{action.label}</div>
                        <div className="mission-detail">{action.detail}</div>
                      </div>
                      <div className="mission-xp">+10 XP</div>
                    </button>
                  ))}
                </div>
              )}
            </section>
            <section className="section">
              <div className="meals-section">
                <div className="meals-header">
                  <h3>Comidas del día</h3>
                  <p>
                    Sin contar calorías: proteína + mucha verdura + hidrato rico en fibra + grasa
                    saludable.
                  </p>
                </div>
                {mealTypes.map((type) => (
                  <div key={type} className="meal-block">
                    <div className="meal-info">
                      <div className="meal-type">{type}</div>
                      <div className="meal-name">{mealNameFor(type)}</div>
                    </div>
                    <button
                      className="meal-change-btn"
                      type="button"
                      onClick={() => setSubstitutingType(type)}
                    >
                      Cambiar
                    </button>
                  </div>
                ))}
              </div>
              <div className="daily-activity">
                <div className="activity-header">
                  <span className="activity-icon">🏃</span>
                  <h3 className="activity-title">Descanso activo</h3>
                </div>
                <div className="activity-details">
                  <p className="activity-detail">Paseo suave</p>
                  <p className="activity-detail">Movilidad opcional</p>
                  <p className="activity-detail">Preparar comidas básicas de la semana</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "semana" && (
          <div id="panel-semana" role="tabpanel" aria-labelledby="tab-semana">
            <section className="section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Mapa semanal</h2>
                  <p className="section-subtitle">
                    Tres sesiones de fuerza, dos estímulos cardiovasculares y movimiento diario.
                  </p>
                </div>
              </div>
              <div className="weekly-map">
                {daysOfWeek.map((day, index) => {
                  const type = weeklyPlan[index] ?? "descanso_activo"
                  return (
                    <div key={day} className="week-day-card">
                      <div className="week-day-name">{day}</div>
                      <span className={`workout-badge ${workoutBadgeClass(type)}`}>
                        {workoutTypeLabel(type)}
                      </span>
                      <div className="meal-preview">
                        <strong>Comida:</strong> Pollo + quinoa + verduras
                      </div>
                      <div className="meal-preview" style={{ marginTop: "8px" }}>
                        <strong>Cena:</strong> Salmón + brócoli + garbanzos
                      </div>
                      <button
                        className="week-register-btn"
                        type="button"
                        onClick={() => startWorkout(index)}
                      >
                        Registrar
                      </button>
                    </div>
                  )
                })}
              </div>
              <div className="plate-rule" style={{ marginTop: "32px" }}>
                <h3>Regla visual del plato</h3>
                <div className="plate-sections">
                  <div className="plate-section">
                    <span className="plate-icon">🥬</span>
                    <div className="plate-content">
                      <h4>½ verduras</h4>
                      <p>En comida y cena cuando sea posible.</p>
                    </div>
                  </div>
                  <div className="plate-section">
                    <span className="plate-icon">🍗</span>
                    <div className="plate-content">
                      <h4>¼ proteína</h4>
                      <p>Pescado, huevos, pollo/pavo, legumbres, yogur natural.</p>
                    </div>
                  </div>
                  <div className="plate-section">
                    <span className="plate-icon">🌾</span>
                    <div className="plate-content">
                      <h4>¼ hidrato rico en fibra</h4>
                      <p>Legumbres, avena, patata cocida, arroz/pasta integral, pan integral.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "entrenamiento" && (
          <div id="panel-entrenamiento" role="tabpanel" aria-labelledby="tab-entrenamiento">
            <section className="section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Diario de entrenamiento</h2>
                  <p className="section-subtitle">
                    Registra tus sesiones y sigue la progresión de pesos.
                  </p>
                </div>
              </div>
              <div className="workout-calendar-section">
                <h3>Calendario de entrenamientos</h3>
                <WorkoutCalendar sessionDates={sessionDates} />
              </div>
              <div className="settings-form">
                <h3>Registrar sesión</h3>
                <div className="settings-grid">
                  <div className="setting-field">
                    <label htmlFor="session-type">Tipo</label>
                    <select
                      id="session-type"
                      value={draftType}
                      onChange={(e) => setDraftType(e.target.value)}
                    >
                      {workoutTypes.map((item) => (
                        <option key={item.type} value={item.type}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="setting-field">
                    <label htmlFor="session-date">Fecha</label>
                    <input
                      id="session-date"
                      type="date"
                      value={draftDate}
                      onChange={(e) => setDraftDate(e.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label htmlFor="session-duration">Duración (min)</label>
                    <input
                      id="session-duration"
                      type="number"
                      inputMode="numeric"
                      placeholder="45"
                      value={draftDuration}
                      onChange={(e) => setDraftDuration(e.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label htmlFor="session-rpe">Esfuerzo (RPE 1-10)</label>
                    <input
                      id="session-rpe"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={10}
                      placeholder="Opcional"
                      value={draftRpe}
                      onChange={(e) => setDraftRpe(e.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label htmlFor="session-feeling">Sensación</label>
                    <select
                      id="session-feeling"
                      value={draftFeeling}
                      onChange={(e) => setDraftFeeling(e.target.value)}
                    >
                      <option value="">—</option>
                      {feelingOptions.map((o) => (
                        <option key={o.key} value={o.key}>
                          {o.icon} {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="setting-field">
                    <label htmlFor="session-notes">Notas</label>
                    <input
                      id="session-notes"
                      type="text"
                      placeholder="Opcional"
                      value={draftNotes}
                      onChange={(e) => setDraftNotes(e.target.value)}
                    />
                  </div>
                </div>
                <datalist id="exercise-suggestions">
                  {libraryNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                {draftExercises.map((exercise, exerciseIndex) => (
                  <div key={exercise.id} className="draft-exercise">
                    <div className="draft-exercise-header">
                      <input
                        className="exercise-name-input"
                        type="text"
                        list="exercise-suggestions"
                        placeholder="Ejercicio"
                        value={exercise.name}
                        onChange={(e) => updateExerciseName(exerciseIndex, e.target.value)}
                        aria-label={`Ejercicio ${exerciseIndex + 1}`}
                      />
                      {draftExercises.length > 1 ? (
                        <button
                          className="draft-remove-btn"
                          type="button"
                          onClick={() => removeExercise(exerciseIndex)}
                          aria-label="Quitar ejercicio"
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                    {exercise.sets.map((set, setIndex) => (
                      <div key={set.id} className="draft-set-row">
                        <span className="draft-set-number">{setIndex + 1}</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="Reps"
                          value={set.reps}
                          onChange={(e) =>
                            updateSet(exerciseIndex, setIndex, "reps", e.target.value)
                          }
                          aria-label={`Serie ${setIndex + 1} repeticiones`}
                        />
                        <input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          placeholder="Peso (kg)"
                          value={set.weight}
                          onChange={(e) =>
                            updateSet(exerciseIndex, setIndex, "weight", e.target.value)
                          }
                          aria-label={`Serie ${setIndex + 1} peso`}
                        />
                        {exercise.sets.length > 1 ? (
                          <button
                            className="draft-remove-btn"
                            type="button"
                            onClick={() => removeSet(exerciseIndex, setIndex)}
                            aria-label="Quitar serie"
                          >
                            ✕
                          </button>
                        ) : null}
                      </div>
                    ))}
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => addSet(exerciseIndex)}
                    >
                      Añadir serie
                    </button>
                  </div>
                ))}
                <button className="btn-secondary" type="button" onClick={() => addExercise()}>
                  Añadir ejercicio
                </button>
                <div className="settings-actions" style={{ marginTop: "16px" }}>
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => void saveSession()}
                    disabled={savingSession}
                  >
                    {savingSession ? "Guardando…" : "Guardar sesión"}
                  </button>
                </div>
              </div>
              <div className="training-history" style={{ marginTop: "32px" }}>
                <h3>Historial</h3>
                {personalRecords.length > 0 ? (
                  <div className="personal-records">
                    <h4>Récords personales (1RM estimado)</h4>
                    <ul>
                      {personalRecords.map((r) => (
                        <li key={r.name}>
                          {r.name}: {formatMetricValue(r.value, 1)} kg
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {exerciseProgress.length > 0 ? (
                  <div className="exercise-progression">
                    <h4 className="training-subheading">Progresión por ejercicio (1RM estimado)</h4>
                    {exerciseProgress.map((item) => (
                      <div key={item.name} className="progression-block">
                        <MetricLineChart
                          label={item.name}
                          points={item.points}
                          unit="kg"
                          decimals={1}
                        />
                        <div className="progression-delta">{progressionDelta(item.points)}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {sessions.length === 0 ? (
                  <p className="section-subtitle">Aún no has registrado ninguna sesión.</p>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className="session-card">
                      <div className="session-header">
                        <span className="session-date">{formatShortDate(session.sessionDate)}</span>
                        <span className="session-type">
                          {workoutTypeLabel(session.workoutType)}
                        </span>
                        <span className="session-duration">{session.durationMinutes} min</span>
                        {session.feeling ? <span>{feelingIcon(session.feeling)}</span> : null}
                      </div>
                      {session.exercises.map((exercise) => {
                        const best = exercise.sets.reduce(
                          (max, set) =>
                            set.weight !== null && set.weight > 0
                              ? Math.max(max, estimateOneRepMax(set.weight, set.reps))
                              : max,
                          0,
                        )
                        return (
                          <div key={exercise.id} className="session-exercise">
                            <div className="session-exercise-name">{exercise.exerciseName}</div>
                            <div className="session-exercise-sets">
                              {exercise.sets.map((set) => (
                                <span key={set.setNumber} className="session-set">
                                  {set.reps}×
                                  {set.weight === null
                                    ? "—"
                                    : `${formatMetricValue(set.weight, 1)} kg`}
                                </span>
                              ))}
                              {best > 0 ? (
                                <span className="session-estimated-max">
                                  1RM ~{formatMetricValue(best, 1)} kg
                                </span>
                              ) : null}
                            </div>
                          </div>
                        )
                      })}
                      {session.notes ? <p className="session-notes">{session.notes}</p> : null}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === "retos" && (
          <div id="panel-retos" role="tabpanel" aria-labelledby="tab-retos">
            <section className="section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Retos de esta semana</h2>
                  <p className="section-subtitle">
                    Márcalos cuando los consigas. Cada reto vale 40 XP.
                  </p>
                </div>
              </div>
              <div className="event-banner">
                <span className="event-icon">{temporalEvent.icon}</span>
                <div className="event-content">
                  <div className="event-label">Evento · {temporalEvent.period}</div>
                  <div className="event-title">{temporalEvent.title}</div>
                  <div className="event-description">{temporalEvent.description}</div>
                </div>
                <span className="event-xp">+{temporalEvent.xp} XP</span>
              </div>
              <div className="challenges-list">
                {displayChallenges.map((challenge) => (
                  <div
                    key={challenge.id || challenge.title}
                    className={`challenge-card ${challenge.completed ? "completed" : ""}`}
                  >
                    <span className="challenge-icon">{challenge.icon}</span>
                    <div className="challenge-content">
                      <div className="challenge-title">{challenge.title}</div>
                      {challenge.detail ? (
                        <div className="challenge-detail">{challenge.detail}</div>
                      ) : null}
                    </div>
                    <button
                      className={`challenge-btn ${challenge.completed ? "completed" : ""}`}
                      type="button"
                      disabled={savingChallenge || !challenge.id}
                      onClick={() => void toggleChallenge(challenge.id, challenge.completed)}
                    >
                      {challenge.completed ? "Conseguido ✓" : "Conseguido"}
                    </button>
                  </div>
                ))}
              </div>
              <div className="add-challenge">
                <input
                  className="challenge-input"
                  type="text"
                  placeholder="Añadir reto propio..."
                  value={newChallengeTitle}
                  onChange={(e) => setNewChallengeTitle(e.target.value)}
                  aria-label="Título del reto propio"
                />
                <button
                  className="challenge-add-btn"
                  type="button"
                  onClick={() => void addChallenge()}
                  disabled={addingChallenge || !newChallengeTitle.trim()}
                >
                  {addingChallenge ? "Añadiendo…" : "Añadir"}
                </button>
              </div>
              <div style={{ marginTop: "48px" }}>
                <h3 className="section-title" style={{ marginBottom: "24px" }}>
                  Retos adaptativos
                </h3>
                <p className="section-subtitle" style={{ marginBottom: "16px" }}>
                  Según tu nivel {level.level} ({level.title}), estos retos están a tu alcance.
                </p>
                <div className="challenges-list">
                  {adaptiveChallengesList.map((challenge) => (
                    <div key={challenge.key} className="challenge-card">
                      <span className="challenge-icon">{challenge.icon}</span>
                      <div className="challenge-content">
                        <div className="challenge-title">{challenge.title}</div>
                        <div className="challenge-detail">{challenge.description}</div>
                      </div>
                      <span className="challenge-xp">+{challenge.xp} XP</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: "48px" }}>
                <h3 className="section-title" style={{ marginBottom: "24px" }}>
                  Logros
                </h3>
                <div className="achievements-grid">
                  {achievementStates.map((achievement) => (
                    <div
                      key={achievement.key}
                      className={`achievement-card ${achievement.unlocked ? "unlocked" : ""} rarity-${achievement.rarity}`}
                    >
                      <div className="achievement-icon">{achievement.icon}</div>
                      <div className="achievement-name">{achievement.name}</div>
                      <div className="achievement-requirement">{achievement.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "progreso" && (
          <div id="panel-progreso" role="tabpanel" aria-labelledby="tab-progreso">
            <section className="section">
              <div className="weekly-summary">
                <h3>Resumen semanal</h3>
                <div className="summary-bars">
                  <div className="summary-bar-row">
                    <div className="summary-bar-label">Hábitos</div>
                    <div className="summary-bar-track">
                      <div
                        className="summary-bar-fill"
                        style={{ width: `${weekSummary.averageCompletion}%` }}
                      />
                    </div>
                    <div className="summary-bar-value">{weekSummary.averageCompletion}%</div>
                  </div>
                </div>
                <p className="section-subtitle">
                  {weekSummary.completedActions} de {weekSummary.totalActions} acciones · mejor día:{" "}
                  {weekSummary.bestDate || "—"}
                </p>
              </div>
              <div className="weekly-summary" style={{ marginTop: "32px" }}>
                <h3>Entrenamiento de la semana</h3>
                <div className="training-summary-stats">
                  <div className="training-stat">
                    <div className="training-stat-value">
                      {trainingWeekSummary.completed} / {trainingWeekSummary.planned}
                    </div>
                    <div className="training-stat-label">sesiones</div>
                  </div>
                  <div className="training-stat">
                    <div className="training-stat-value">
                      {trainingWeekSummary.avgRpe === null
                        ? "—"
                        : formatMetricValue(trainingWeekSummary.avgRpe, 1)}
                    </div>
                    <div className="training-stat-label">RPE medio</div>
                  </div>
                </div>
                {trainingWeekSummary.topProgression ? (
                  <p className="section-subtitle">
                    Mayor progresión: {trainingWeekSummary.topProgression.name} (
                    {trainingWeekSummary.topProgression.delta > 0 ? "+" : ""}
                    {formatMetricValue(trainingWeekSummary.topProgression.delta, 1)} kg)
                  </p>
                ) : (
                  <p className="section-subtitle">Registra sesiones para ver tu progresión.</p>
                )}
              </div>
              <div className="weekly-summary" style={{ marginTop: "32px" }}>
                <h3>Rachas por categoría</h3>
                <div className="category-streaks">
                  {categoryStreaks.map((streak) => (
                    <div key={streak.key} className="category-streak-card">
                      <span className="category-streak-icon">{streak.icon}</span>
                      <div className="category-streak-count">
                        {streak.count} {streak.unit}
                      </div>
                      <div className="category-streak-label">{streak.label}</div>
                      <div className="category-streak-goal">{streak.goal}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="twelve-week-goal" style={{ marginTop: "32px" }}>
                <h3>Objetivo de las 12 semanas</h3>
                <p>
                  Busca tendencias, no un día perfecto. Una buena semana es una semana que puedes
                  repetir.
                </p>
                <div className="goal-phases">
                  <div className="goal-phase">
                    <div className="goal-phase-title">Semanas 1-4 · Construir rutina</div>
                    <div className="goal-phase-description">
                      Pasos, caminatas tras las comidas y 3 sesiones de fuerza sostenibles.
                    </div>
                  </div>
                  <div className="goal-phase">
                    <div className="goal-phase-title">Semanas 5-8 · Consolidar</div>
                    <div className="goal-phase-description">
                      Acercarte progresivamente al objetivo de cardio y mejorar la calidad de los
                      hidratos.
                    </div>
                  </div>
                  <div className="goal-phase">
                    <div className="goal-phase-title">Semanas 9-12 · Mantener</div>
                    <div className="goal-phase-description">
                      Repetir el patrón sin sensación de dieta temporal. Valorar con tu médico
                      cuándo repetir controles.
                    </div>
                  </div>
                </div>
              </div>
              <div className="metrics-evolution" style={{ marginTop: "32px" }}>
                <h3>Evolución de analíticas</h3>
                <p className="metrics-evolution-note">
                  Tendencias orientativas, no sustituyen una valoración médica.
                </p>
                {metrics.filter((m) => m.history.length >= 2).length === 0 ? (
                  <p className="metrics-evolution-note">
                    Registra al menos dos lecturas de una métrica para ver su evolución.
                  </p>
                ) : (
                  metrics
                    .filter((m) => m.history.length >= 2)
                    .map((metric) => (
                      <MetricLineChart
                        key={metric.type}
                        label={metric.label}
                        points={metric.history}
                        unit={metric.unit}
                        decimals={metric.decimals}
                      />
                    ))
                )}
              </div>
              <div className="settings-form" style={{ marginTop: "32px" }}>
                <h3>Registrar analítica</h3>
                <p>
                  Valores orientativos para seguir tu evolución. No sustituyen una valoración
                  médica.
                </p>
                <div className="settings-grid">
                  <div className="setting-field">
                    <label htmlFor="metric-marker">Métrica</label>
                    <select
                      id="metric-marker"
                      value={metricMarker}
                      onChange={(e) => setMetricMarker(e.target.value)}
                    >
                      {metricDefinitions.map((d) => (
                        <option key={d.type} value={d.type}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="setting-field">
                    <label htmlFor="metric-value">Valor</label>
                    <input
                      id="metric-value"
                      type="number"
                      step="any"
                      inputMode="decimal"
                      placeholder="0,0"
                      value={metricValue}
                      onChange={(e) => setMetricValue(e.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label htmlFor="metric-date">Fecha</label>
                    <input
                      id="metric-date"
                      type="date"
                      value={metricDate}
                      onChange={(e) => setMetricDate(e.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label htmlFor="metric-notes">Notas</label>
                    <input
                      id="metric-notes"
                      type="text"
                      placeholder="Opcional"
                      value={metricNotes}
                      onChange={(e) => setMetricNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="settings-actions">
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => void addMetric()}
                    disabled={savingMetric || !metricValue.trim()}
                  >
                    {savingMetric ? "Guardando…" : "Guardar analítica"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "coach" && (
          <div id="panel-coach" role="tabpanel" aria-labelledby="tab-coach">
            <section className="section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Coach de salud</h2>
                  <p className="section-subtitle">
                    Insights semanales y respuestas sobre tus datos. La IA describe patrones, nunca
                    diagnostica.
                  </p>
                </div>
              </div>
              <div className="coach-source-note">
                {aiEnabled && aiEndpoint.trim()
                  ? `Generado por IA · ${aiModel || "modelo sin configurar"}`
                  : "Generado con reglas locales"}{" "}
                · {HEALTH_DISCLAIMER}
              </div>
              {aiEnabled && aiEndpoint.trim() ? (
                <div className="settings-actions" style={{ marginBottom: "16px" }}>
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => void generateAiInsights()}
                    disabled={aiLoadingInsights || !aiModel}
                  >
                    {aiLoadingInsights
                      ? "Generando insights…"
                      : aiModel
                        ? "Generar insights con IA"
                        : "Configura un modelo en Ajustes"}
                  </button>
                </div>
              ) : null}
              <div className="coach-insights">
                <div className="coach-block-header">
                  <h3>Insights de la semana</h3>
                </div>
                {insights.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">✦</div>
                    <h3>Sin insights todavía</h3>
                    <p>
                      {aiEnabled && aiEndpoint.trim()
                        ? "Pulsa «Generar insights con IA» para analizar tus datos."
                        : "Activa la IA en Ajustes o registra misiones, entrenamientos y analíticas para que el coach tenga datos que analizar."}
                    </p>
                  </div>
                ) : (
                  <div className="insight-list">
                    {insights.map((insight) => (
                      <div
                        key={`${insight.title}-${insight.detail}`}
                        className={`insight-card tone-${insight.tone}`}
                      >
                        <div className="insight-title">{insight.title}</div>
                        <div className="insight-detail">{insight.detail}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {aiEnabled && aiEndpoint.trim() && aiModel ? (
                <div className="coach-chat" style={{ marginTop: "24px" }}>
                  <div className="coach-block-header">
                    <h3>Pregúntale al coach</h3>
                  </div>
                  {chatMessages.length > 0 && (
                    <div
                      className="chat-messages"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        marginBottom: "16px",
                        maxHeight: "400px",
                        overflowY: "auto",
                        padding: "12px",
                        borderRadius: "8px",
                        background: "var(--color-surface-alt, #1a1f2e)",
                      }}
                    >
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "10px 14px",
                            borderRadius: "12px",
                            maxWidth: "85%",
                            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                            background:
                              msg.role === "user"
                                ? "var(--color-primary, #2d6a4f)"
                                : "var(--color-surface, #252b3b)",
                            color:
                              msg.role === "user"
                                ? "var(--color-on-primary, #fff)"
                                : "var(--color-text, #e4e4e7)",
                          }}
                        >
                          <div style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div
                          style={{
                            padding: "10px 14px",
                            borderRadius: "12px",
                            maxWidth: "85%",
                            alignSelf: "flex-start",
                            background: "var(--color-surface, #252b3b)",
                            color: "var(--color-text-muted, #9ca3af)",
                          }}
                        >
                          Pensando…
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-end",
                    }}
                  >
                    <textarea
                      placeholder="Escribe tu pregunta…"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          void sendChatMessage()
                        }
                      }}
                      rows={2}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border, #374151)",
                        background: "var(--color-surface, #252b3b)",
                        color: "var(--color-text, #e4e4e7)",
                        resize: "vertical",
                        fontFamily: "inherit",
                        fontSize: "0.9rem",
                      }}
                    />
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={() => void sendChatMessage()}
                      disabled={chatLoading || !chatInput.trim()}
                      style={{ height: "42px" }}
                    >
                      {chatLoading ? "…" : "Enviar"}
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        )}

        {activeTab === "ajustes" && (
          <div id="panel-ajustes" role="tabpanel" aria-labelledby="tab-ajustes">
            <section className="section">
              <div className="settings-form">
                <h3>Personaliza tus objetivos</h3>
                <p>
                  Estos valores modifican las etiquetas del tracker. Empieza conservador y sube
                  cuando resulte fácil de mantener.
                </p>
                <div className="settings-grid">
                  <div className="setting-field">
                    <label htmlFor="goal-steps">Pasos diarios</label>
                    <input
                      id="goal-steps"
                      type="number"
                      inputMode="numeric"
                      enterKeyHint="done"
                      value={goals.stepsGoal}
                      onChange={(e) => updateGoal("stepsGoal", e.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label htmlFor="goal-fiber">Fibra orientativa (g/día)</label>
                    <input
                      id="goal-fiber"
                      type="number"
                      inputMode="numeric"
                      enterKeyHint="done"
                      value={goals.fiberGoal}
                      onChange={(e) => updateGoal("fiberGoal", e.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label htmlFor="goal-strength">Fuerza (sesiones/semana)</label>
                    <input
                      id="goal-strength"
                      type="number"
                      inputMode="numeric"
                      enterKeyHint="done"
                      value={goals.strengthGoal}
                      onChange={(e) => updateGoal("strengthGoal", e.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label htmlFor="goal-cardio">Cardio moderado (min/semana)</label>
                    <input
                      id="goal-cardio"
                      type="number"
                      inputMode="numeric"
                      enterKeyHint="done"
                      value={goals.cardioGoal}
                      onChange={(e) => updateGoal("cardioGoal", e.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label htmlFor="goal-walks">Caminatas postcomida / semana</label>
                    <input
                      id="goal-walks"
                      type="number"
                      inputMode="numeric"
                      enterKeyHint="done"
                      value={goals.walksGoal}
                      onChange={(e) => updateGoal("walksGoal", e.target.value)}
                    />
                  </div>
                </div>
                <div className="settings-actions">
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => void saveGoals()}
                    disabled={savingGoals}
                  >
                    {savingGoals ? "Guardando…" : "Guardar objetivos"}
                  </button>
                  <button className="btn-secondary" type="button" onClick={() => void resetWeek()}>
                    Reiniciar semana
                  </button>
                </div>
                {goalsSaved ? <p className="settings-saved">Objetivos guardados.</p> : null}
              </div>
              <div className="settings-form" style={{ marginTop: "32px" }}>
                <h3>Datos</h3>
                <p>Descarga una copia de todos tus datos o importa una copia previa.</p>
                <div className="settings-actions">
                  <button className="btn-secondary" type="button" onClick={() => void exportData()}>
                    Exportar datos (JSON)
                  </button>
                  <label className="btn-primary" style={{ cursor: "pointer" }}>
                    Importar datos (JSON)
                    <input
                      type="file"
                      accept=".json"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void importData(file)
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="settings-form" style={{ marginTop: "32px" }}>
                <h3>Función inteligente (IA)</h3>
                <p>
                  Configura tu propio endpoint compatible con OpenAI. La API key y el endpoint se
                  guardan solo en tu dispositivo y nunca se comparten.
                </p>
                <div className="settings-grid">
                  <div className="setting-field" style={{ gridColumn: "1 / -1" }}>
                    <label htmlFor="ai-enabled">Activar IA</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        id="ai-enabled"
                        type="checkbox"
                        checked={aiEnabled}
                        onChange={(e) => setAiEnabled(e.target.checked)}
                        style={{ width: "auto" }}
                      />
                      <span>Usar IA para el coach de salud</span>
                    </div>
                  </div>
                  <div className="setting-field" style={{ gridColumn: "1 / -1" }}>
                    <label htmlFor="ai-endpoint">URL del endpoint</label>
                    <input
                      id="ai-endpoint"
                      type="url"
                      placeholder="https://tu-servidor.example.com"
                      value={aiEndpoint}
                      onChange={(e) => setAiEndpoint(e.target.value)}
                    />
                  </div>
                  <div className="setting-field" style={{ gridColumn: "1 / -1" }}>
                    <label htmlFor="ai-apikey">API Key</label>
                    <input
                      id="ai-apikey"
                      type="password"
                      placeholder="sk-..."
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div className="setting-field">
                    <label htmlFor="ai-model">Modelo</label>
                    <select
                      id="ai-model"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      disabled={aiModels.length === 0}
                    >
                      {aiModels.length === 0 && (
                        <option value="">Pulsa «Probar conexión» para cargar modelos</option>
                      )}
                      {aiModels.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="settings-actions">
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => void testAiConnection()}
                    disabled={aiTesting}
                  >
                    {aiTesting ? "Probando…" : "Probar conexión"}
                  </button>
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => void saveAiConfig()}
                    disabled={aiSaving}
                  >
                    {aiSaving ? "Guardando…" : "Guardar configuración"}
                  </button>
                </div>
                {aiTestResult ? (
                  <p
                    className="settings-saved"
                    style={{
                      color: aiTestResult.startsWith("Conexión OK")
                        ? "var(--color-success, #22c55e)"
                        : undefined,
                    }}
                  >
                    {aiTestResult}
                  </p>
                ) : null}
                {aiSaved ? <p className="settings-saved">Configuración guardada.</p> : null}
                <p className="ai-config-note">{HEALTH_DISCLAIMER}</p>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="legal-footer">
        <p>
          Este plan es una herramienta de hábitos y no sustituye valoración médica. El índice de
          hígado graso indica riesgo, no confirma un diagnóstico. Si durante el ejercicio aparecen
          dolor torácico, mareo intenso, falta de aire desproporcionada u otros síntomas
          preocupantes, interrumpe el entrenamiento y busca valoración profesional.
        </p>
      </footer>

      {substitutingType ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Cambiar ${substitutingType}`}
        >
          <div className="modal-panel">
            <div className="modal-header">
              <h3>Cambiar {substitutingType}</h3>
              <button
                className="modal-close"
                type="button"
                onClick={() => setSubstitutingType(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="modal-options">
              {mealOptions[substitutingType].map((option) => (
                <button
                  key={option}
                  className={`modal-option ${option === mealNameFor(substitutingType) ? "selected" : ""}`}
                  type="button"
                  disabled={savingMeal}
                  onClick={() => void substituteMeal(substitutingType, option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
