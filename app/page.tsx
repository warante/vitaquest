"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { DashboardResponse } from "./dashboard-types"
import { evaluateAchievements } from "./domain/achievements"
import { adaptiveChallengesFor } from "./domain/adaptive-challenges"
import { aiModelOptions, DEFAULT_AI_MODEL } from "./domain/ai-models"
import { weeklyChallenges } from "./domain/challenges"
import { monthlyEvent } from "./domain/events"
import { createExportJson } from "./domain/export"
import {
  calculateCurrentStreak,
  getBadgeForStreak,
  streakXpMultiplier,
  summarizeWeek,
} from "./domain/gamification"
import { HEALTH_DISCLAIMER } from "./domain/insights"
import { levelProgress, themeForLevel } from "./domain/levels"
import { defaultMeals, type MealType, mealOptions, mealTypes } from "./domain/meals"
import { type MetricPoint, metricDefinitions } from "./domain/metabolic-markers"
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
import { enqueueMutation, flushQueue } from "./offline-queue"

const MetricSparkline = dynamic(() => import("./charts").then((mod) => mod.MetricSparkline), {
  loading: () => null,
})

const MetricLineChart = dynamic(() => import("./charts").then((mod) => mod.MetricLineChart), {
  loading: () => null,
})

const WorkoutCalendar = dynamic(() => import("./charts").then((mod) => mod.WorkoutCalendar), {
  loading: () => null,
})

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
type AnomalyItem = Readonly<{ type: string; severity: string; title: string; detail: string }>
type ChatMessageItem = Readonly<{ id: string; role: "user" | "assistant"; content: string }>
type AiStatus = Readonly<{
  configured: boolean
  model: string
  endpoint: string
  temperature: number
}>

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

function ProgressRing({
  percent,
  label,
}: {
  percent: number
  label: string
}): React.ReactElement {
  const offset = RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE
  return (
    <div className="progress-ring">
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        role="img"
        aria-label={`${label}: ${percent}%`}
      >
        <title>{`${label}: ${percent}%`}</title>
        <circle className="progress-ring-bg" cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} />
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

export default function Home(): React.ReactElement {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
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
  const [online, setOnline] = useState(true)
  const [insights, setInsights] = useState<readonly InsightItem[]>([])
  const [anomalies, setAnomalies] = useState<readonly AnomalyItem[]>([])
  const [insightSource, setInsightSource] = useState("")
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [coachError, setCoachError] = useState("")
  const [chatMessages, setChatMessages] = useState<readonly ChatMessageItem[]>([])
  const [chatInput, setChatInput] = useState("")
  const [sendingChat, setSendingChat] = useState(false)
  const [aiModel, setAiModel] = useState<string>(DEFAULT_AI_MODEL)
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null)
  const [testingAi, setTestingAi] = useState(false)
  const [aiTestResult, setAiTestResult] = useState<"ok" | "error" | "">("")

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

  const completedCount = useMemo(
    () => actions.filter((action) => action.completed).length,
    [actions],
  )
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
  const adaptiveChallenges = useMemo(() => adaptiveChallengesFor(level.level), [level.level])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    return () => {
      document.documentElement.removeAttribute("data-theme")
    }
  }, [theme])

  const weeklyChallengeItems = weeklyChallenges.map((challenge) => {
    const saved = challenges.find((item) => item.slug === challenge.slug)
    return {
      id: saved?.id ?? "",
      title: challenge.title,
      detail: challenge.detail,
      icon: challenge.icon,
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

  const sessionDates = useMemo(
    () => new Set(sessions.map((session) => session.sessionDate)),
    [sessions],
  )

  const trainingWeekSummary = useMemo(() => {
    const week = currentWeekDates()
    const weekSessions = sessions.filter((session) => week.includes(session.sessionDate))
    const rpeValues = weekSessions.flatMap((session) => (session.rpe !== null ? [session.rpe] : []))
    const avgRpe =
      rpeValues.length > 0
        ? rpeValues.reduce((total, value) => total + value, 0) / rpeValues.length
        : null
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
    const completedActionsTotal = historyRecords.reduce(
      (sum, record) => sum + record.completedActions,
      0,
    )
    const strengthSessions = sessions.filter((session) =>
      session.workoutType.startsWith("fuerza"),
    ).length
    const cardioSessions = sessions.filter((session) =>
      session.workoutType.startsWith("cardio"),
    ).length
    const metricsCount = metrics.filter((metric) => metric.value !== null).length
    const positiveTrends = metrics.filter((metric) => metric.trend === "improving").length
    const hasPr = sessions.some((session) =>
      session.exercises.some((exercise) =>
        exercise.sets.some((set) => set.weight !== null && set.weight > 0),
      ),
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
      const response = await fetch("/api/dashboard", { cache: "no-store" })
      if (response.status === 503) {
        // Base de datos no configurada - usar datos de ejemplo
        setDashboard({
          profile: {
            displayName: "David",
            goalSummary: "Mejorar salud metabólica y reducir el riesgo de esteatosis hepática",
            breakfastPattern: "Tazón de avena con leche de avena, nueces y fruta troceada",
            trainingPattern: "Fullbody con empuje y tirón, piernas y core",
            goals: {
              stepsGoal: 8000,
              fiberGoal: 30,
              strengthGoal: 3,
              cardioGoal: 150,
              walksGoal: 10,
            },
          },
          today: {
            date: new Date().toISOString().slice(0, 10),
          },
          days: {},
          week: [],
          history: [],
          metrics: [],
          categoryStreaks: [],
          totalXp: 0,
        })
        setError("")
        return
      }
      if (!response.ok) throw new Error("dashboard")
      const data = (await response.json()) as DashboardResponse
      setDashboard(data)
      setError("")
    } catch {
      setError("No se pudo conectar con tu espacio. Revisa la conexión e inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    const updateStatus = (): void => setOnline(navigator.onLine)
    const handleReconnect = (): void => {
      updateStatus()
      void flushQueue().then(() => loadDashboard())
    }
    updateStatus()
    window.addEventListener("online", handleReconnect)
    window.addEventListener("offline", updateStatus)
    return () => {
      window.removeEventListener("online", handleReconnect)
      window.removeEventListener("offline", updateStatus)
    }
  }, [loadDashboard])

  useEffect(() => {
    if (dashboard) {
      setGoals({ ...dashboard.profile.goals })
    }
  }, [dashboard])

  async function createFirstDay(): Promise<void> {
    setCreating(true)
    try {
      const response = await fetch("/api/dashboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recordDate: selectedDate }),
      })
      if (response.status === 503) {
        // Base de datos no configurada - crear datos de ejemplo localmente
        const starterActions = [
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
        setDashboard((current) =>
          current
            ? {
                ...current,
                days: {
                  ...current.days,
                  [selectedDate]: {
                    actions: starterActions,
                    meals: current.days[selectedDate]?.meals ?? [],
                  },
                },
                week: current.week.map((day) =>
                  day.date === selectedDate ? { ...day, totalActions: starterActions.length } : day,
                ),
              }
            : current,
        )
        setError("")
        return
      }
      if (!response.ok) throw new Error("create")
      await loadDashboard()
    } catch {
      setError("No se pudo crear tu primer día. Inténtalo de nuevo.")
    } finally {
      setCreating(false)
    }
  }

  async function toggleAction(slug: string): Promise<void> {
    if (!dashboard || saving) return
    const nextActions = actions.map((action) =>
      action.slug === slug ? { ...action, completed: !action.completed } : action,
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
    const body = JSON.stringify({ recordDate: selectedDate, actions: nextActions })
    if (!navigator.onLine) {
      enqueueMutation({
        key: `dashboard:${selectedDate}`,
        url: "/api/dashboard",
        method: "PUT",
        headers: { "content-type": "application/json" },
        body,
      })
      setSaving(false)
      return
    }
    try {
      const response = await fetch("/api/dashboard", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body,
      })
      if (response.status === 503) {
        // Base de datos no configurada - mantener estado local
        setError("")
        return
      }
      if (!response.ok) throw new Error("save")
      setDashboard((await response.json()) as DashboardResponse)
    } catch {
      enqueueMutation({
        key: `dashboard:${selectedDate}`,
        url: "/api/dashboard",
        method: "PUT",
        headers: { "content-type": "application/json" },
        body,
      })
      setError("Sin conexión. El cambio se guardará al recuperar la conexión.")
    } finally {
      setSaving(false)
    }
  }

  async function saveGoals(): Promise<void> {
    if (!dashboard || savingGoals) return
    setSavingGoals(true)
    setGoalsSaved(false)
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(goals),
      })
      if (!response.ok) throw new Error("save-goals")
      setGoalsSaved(true)
    } catch {
      setError("No se pudieron guardar los objetivos. Inténtalo de nuevo.")
    } finally {
      setSavingGoals(false)
    }
  }

  async function resetWeek(): Promise<void> {
    if (
      !window.confirm(
        "¿Reiniciar el progreso de esta semana? Se borrarán las misiones y el XP de la semana actual.",
      )
    ) {
      return
    }
    try {
      const response = await fetch("/api/daily-records", { method: "DELETE" })
      if (!response.ok) throw new Error("reset-week")
      await loadDashboard()
    } catch {
      setError("No se pudo reiniciar la semana. Inténtalo de nuevo.")
    }
  }

  function updateGoal(field: keyof typeof goals, rawValue: string): void {
    const value = Number(rawValue)
    setGoals((current) => ({ ...current, [field]: Number.isNaN(value) ? 0 : value }))
  }

  function mealNameFor(type: MealType): string {
    return meals.find((meal) => meal.mealType === type)?.name ?? defaultMeals[type]
  }

  async function substituteMeal(type: MealType, name: string): Promise<void> {
    if (!dashboard || savingMeal) return
    setSavingMeal(true)
    try {
      const response = await fetch("/api/meals", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mealDate: selectedDate, mealType: type, name }),
      })
      if (!response.ok) throw new Error("substitute-meal")
      const nextMeals = meals
        .filter((meal) => meal.mealType !== type)
        .concat({ mealType: type, name })
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
      setError("No se pudo actualizar la comida. Inténtalo de nuevo.")
    } finally {
      setSavingMeal(false)
    }
  }

  const loadChallenges = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/challenges", { cache: "no-store" })
      if (!response.ok) throw new Error("challenges")
      const data = (await response.json()) as { challenges: readonly ChallengeItem[] }
      setChallenges(data.challenges)
    } catch {
      setError("No se pudieron cargar los retos.")
    }
  }, [])

  useEffect(() => {
    void loadChallenges()
  }, [loadChallenges])

  const loadSessions = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/training-sessions", { cache: "no-store" })
      if (!response.ok) throw new Error("sessions")
      const data = (await response.json()) as { sessions: readonly TrainingSessionItem[] }
      setSessions(data.sessions)
    } catch {
      setError("No se pudieron cargar las sesiones de entrenamiento.")
    }
  }, [])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  const loadInsights = useCallback(async (): Promise<void> => {
    setLoadingInsights(true)
    setCoachError("")
    try {
      const params = new URLSearchParams({ model: aiModel })
      const response = await fetch(`/api/ai/insights?${params.toString()}`, { cache: "no-store" })
      if (!response.ok) throw new Error("insights")
      const data = (await response.json()) as {
        source: string
        insights: readonly InsightItem[]
        anomalies: readonly AnomalyItem[]
      }
      setInsights(data.insights)
      setAnomalies(data.anomalies)
      setInsightSource(data.source)
    } catch {
      setCoachError("No se pudieron generar los insights. Revisa la conexión e inténtalo de nuevo.")
    } finally {
      setLoadingInsights(false)
    }
  }, [aiModel])

  const loadAiStatus = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/ai/status", { cache: "no-store" })
      if (!response.ok) throw new Error("ai-status")
      setAiStatus((await response.json()) as AiStatus)
    } catch {
      setAiStatus(null)
    }
  }, [])

  useEffect(() => {
    const stored = window.localStorage.getItem("vitaquest:ai:model")
    if (stored && aiModelOptions.some((option) => option.value === stored)) {
      setAiModel(stored)
    }
  }, [])

  useEffect(() => {
    void loadAiStatus()
  }, [loadAiStatus])

  useEffect(() => {
    if (activeTab === "coach" && insights.length === 0 && !loadingInsights) {
      void loadInsights()
    }
  }, [activeTab, insights.length, loadingInsights, loadInsights])

  function updateAiModel(model: string): void {
    setAiModel(model)
    try {
      window.localStorage.setItem("vitaquest:ai:model", model)
    } catch {
      // Almacenamiento no disponible; se mantiene el modelo en memoria.
    }
  }

  async function sendChat(): Promise<void> {
    const question = chatInput.trim()
    if (!question || sendingChat) return
    const history = chatMessages.slice(-10).map(({ role, content }) => ({ role, content }))
    setChatMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: question },
    ])
    setChatInput("")
    setSendingChat(true)
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, model: aiModel, history }),
      })
      if (!response.ok) throw new Error("chat")
      const data = (await response.json()) as { answer: string }
      setChatMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: data.answer },
      ])
    } catch {
      setChatMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "No he podido conectar con el asistente. Inténtalo de nuevo en unos segundos.",
        },
      ])
    } finally {
      setSendingChat(false)
    }
  }

  async function testAiConnection(): Promise<void> {
    if (testingAi) return
    setTestingAi(true)
    setAiTestResult("")
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: "Responde únicamente con la palabra: conectado",
          model: aiModel,
        }),
      })
      if (!response.ok) throw new Error("test-ai")
      setAiTestResult("ok")
    } catch {
      setAiTestResult("error")
    } finally {
      setTestingAi(false)
    }
  }

  async function addChallenge(): Promise<void> {
    const title = newChallengeTitle.trim()
    if (!title || addingChallenge) return
    setAddingChallenge(true)
    try {
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title }),
      })
      if (!response.ok) throw new Error("add-challenge")
      const data = (await response.json()) as { challenge: ChallengeItem }
      setChallenges((current) => [...current, data.challenge])
      setNewChallengeTitle("")
    } catch {
      setError("No se pudo añadir el reto. Inténtalo de nuevo.")
    } finally {
      setAddingChallenge(false)
    }
  }

  async function toggleChallenge(id: string, currentCompleted: boolean): Promise<void> {
    if (savingChallenge) return
    setSavingChallenge(true)
    try {
      const response = await fetch("/api/challenges", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, completed: !currentCompleted }),
      })
      if (!response.ok) throw new Error("toggle-challenge")
      const data = (await response.json()) as { challenge: ChallengeItem }
      setChallenges((current) =>
        current.map((item) => (item.id === data.challenge.id ? data.challenge : item)),
      )
    } catch {
      setError("No se pudo actualizar el reto. Inténtalo de nuevo.")
    } finally {
      setSavingChallenge(false)
    }
  }

  async function addMetric(): Promise<void> {
    const raw = metricValue.trim().replace(",", ".")
    if (!metricMarker || raw === "" || savingMetric) return
    const value = Number(raw)
    if (Number.isNaN(value)) return
    const definition = metricDefinitions.find((item) => item.type === metricMarker)
    setSavingMetric(true)
    try {
      const response = await fetch("/api/metabolic-markers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          marker: metricMarker,
          value,
          unit: definition?.unit ?? "",
          measuredAt: metricDate || new Date().toISOString().slice(0, 10),
          notes: metricNotes.trim() || undefined,
        }),
      })
      if (!response.ok) throw new Error("add-metric")
      setMetricValue("")
      setMetricNotes("")
      await loadDashboard()
    } catch {
      setError("No se pudo guardar la analítica. Inténtalo de nuevo.")
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
    setDraftExercises((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  function updateExerciseName(index: number, name: string): void {
    setDraftExercises((current) =>
      current.map((exercise, itemIndex) =>
        itemIndex === index ? { ...exercise, name } : exercise,
      ),
    )
  }

  function addSet(exerciseIndex: number): void {
    setDraftExercises((current) =>
      current.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              sets: [...exercise.sets, { id: crypto.randomUUID(), reps: "", weight: "" }],
            }
          : exercise,
      ),
    )
  }

  function removeSet(exerciseIndex: number, setIndex: number): void {
    setDraftExercises((current) =>
      current.map((exercise, index) =>
        index === exerciseIndex
          ? { ...exercise, sets: exercise.sets.filter((_, itemIndex) => itemIndex !== setIndex) }
          : exercise,
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
      current.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, itemIndex) =>
                itemIndex === setIndex ? { ...set, [field]: value } : set,
              ),
            }
          : exercise,
      ),
    )
  }

  async function saveSession(): Promise<void> {
    const duration = Number(draftDuration)
    if (Number.isNaN(duration) || duration <= 0 || savingSession) return
    const exercises = draftExercises
      .map((exercise) => ({
        exerciseName: exercise.name.trim(),
        sets: exercise.sets
          .filter((set) => set.reps.trim() !== "")
          .map((set) => {
            const weight = set.weight.trim().replace(",", ".")
            return {
              reps: Number(set.reps),
              weight: weight === "" ? undefined : Number(weight),
              weightUnit: "kg",
            }
          }),
      }))
      .filter((exercise) => exercise.exerciseName !== "" && exercise.sets.length > 0)
    if (exercises.length === 0) return
    setSavingSession(true)
    try {
      const response = await fetch("/api/training-sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionDate: draftDate,
          workoutType: draftType,
          durationMinutes: duration,
          rpe: draftRpe.trim() === "" ? undefined : Number(draftRpe),
          feeling: draftFeeling || undefined,
          notes: draftNotes.trim() || undefined,
          exercises,
        }),
      })
      if (!response.ok) throw new Error("save-session")
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
      await completeMovementMission()
    } catch {
      setError("No se pudo guardar la sesión. Inténtalo de nuevo.")
    } finally {
      setSavingSession(false)
    }
  }

  async function completeMovementMission(): Promise<void> {
    const dayDetail = dashboard?.days[draftDate]
    if (!dayDetail) return
    const hasPendingMovement = dayDetail.actions.some(
      (action) => action.slug === "daily-movement" && !action.completed,
    )
    if (!hasPendingMovement) return
    const updatedActions = dayDetail.actions.map((action) =>
      action.slug === "daily-movement" ? { ...action, completed: true } : action,
    )
    const response = await fetch("/api/dashboard", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ recordDate: draftDate, actions: updatedActions }),
    })
    if (response.ok) {
      await loadDashboard()
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

  function exportData(): void {
    if (!dashboard) return
    const json = createExportJson(
      {
        selectedDate: todayDate,
        xp: totalXp,
        streakDays,
        actions: actions.map((action) => ({
          label: action.label,
          completed: action.completed,
        })),
        week: weekRecords.map((record) => ({
          date: record.date,
          completedActions: record.completedActions,
          totalActions: record.totalActions,
        })),
        metrics: metrics.map((metric) => ({
          label: metric.label,
          unit: metric.unit,
          history: metric.history,
        })),
        training: sessions.map((session) => ({
          sessionDate: session.sessionDate,
          workoutType: session.workoutType,
          durationMinutes: session.durationMinutes,
          rpe: session.rpe,
          feeling: session.feeling,
          notes: session.notes,
          exercises: session.exercises.map((exercise) => ({
            exerciseName: exercise.exerciseName,
            sets: exercise.sets.map((set) => ({
              reps: set.reps,
              weight: set.weight,
            })),
          })),
        })),
      },
      new Date().toISOString(),
    )
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `vitaquest-${todayDate}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>

      {!online ? (
        <div className="offline-banner" role="status" aria-live="polite">
          Sin conexión. Puedes seguir marcando misiones; los cambios se guardarán al recuperar la
          conexión.
        </div>
      ) : null}

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
            <h3>Error de conexión</h3>
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
                      onChange={(event) => setDraftType(event.target.value)}
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
                      onChange={(event) => setDraftDate(event.target.value)}
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
                      onChange={(event) => setDraftDuration(event.target.value)}
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
                      onChange={(event) => setDraftRpe(event.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label htmlFor="session-feeling">Sensación</label>
                    <select
                      id="session-feeling"
                      value={draftFeeling}
                      onChange={(event) => setDraftFeeling(event.target.value)}
                    >
                      <option value="">—</option>
                      {feelingOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.icon} {option.label}
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
                      onChange={(event) => setDraftNotes(event.target.value)}
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
                        onChange={(event) => updateExerciseName(exerciseIndex, event.target.value)}
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
                          onChange={(event) =>
                            updateSet(exerciseIndex, setIndex, "reps", event.target.value)
                          }
                          aria-label={`Serie ${setIndex + 1} repeticiones`}
                        />
                        <input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          placeholder="Peso (kg)"
                          value={set.weight}
                          onChange={(event) =>
                            updateSet(exerciseIndex, setIndex, "weight", event.target.value)
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
                      {personalRecords.map((record) => (
                        <li key={record.name}>
                          {record.name}: {formatMetricValue(record.value, 1)} kg
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
                                  {set.weight === null ? "—" : formatMetricValue(set.weight, 1)} kg
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
                  onChange={(event) => setNewChallengeTitle(event.target.value)}
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
                  {adaptiveChallenges.map((challenge) => (
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
                {metrics.filter((metric) => metric.history.length >= 2).length === 0 ? (
                  <p className="metrics-evolution-note">
                    Registra al menos dos lecturas de una métrica para ver su evolución.
                  </p>
                ) : (
                  metrics
                    .filter((metric) => metric.history.length >= 2)
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
                      onChange={(event) => setMetricMarker(event.target.value)}
                    >
                      {metricDefinitions.map((definition) => (
                        <option key={definition.type} value={definition.type}>
                          {definition.label}
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
                      onChange={(event) => setMetricValue(event.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label htmlFor="metric-date">Fecha</label>
                    <input
                      id="metric-date"
                      type="date"
                      value={metricDate}
                      onChange={(event) => setMetricDate(event.target.value)}
                    />
                  </div>
                  <div className="setting-field">
                    <label htmlFor="metric-notes">Notas</label>
                    <input
                      id="metric-notes"
                      type="text"
                      placeholder="Opcional"
                      value={metricNotes}
                      onChange={(event) => setMetricNotes(event.target.value)}
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
                {insightSource === "ai" ? "Generado con IA" : "Generado con reglas locales"} ·{" "}
                {HEALTH_DISCLAIMER}
              </div>

              <div className="coach-insights">
                <div className="coach-block-header">
                  <h3>Insights de la semana</h3>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => void loadInsights()}
                    disabled={loadingInsights}
                  >
                    {loadingInsights ? "Generando…" : "Regenerar"}
                  </button>
                </div>

                {coachError ? (
                  <p className="coach-error" role="alert">
                    {coachError}
                  </p>
                ) : null}

                {anomalies.length > 0 ? (
                  <div className="anomaly-list">
                    {anomalies.map((anomaly) => (
                      <div
                        key={`${anomaly.type}-${anomaly.title}`}
                        className={`anomaly-card severity-${anomaly.severity}`}
                      >
                        <div className="anomaly-title">{anomaly.title}</div>
                        <div className="anomaly-detail">{anomaly.detail}</div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {insights.length === 0 && !loadingInsights ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">✦</div>
                    <h3>Sin insights todavía</h3>
                    <p>
                      Registra misiones, entrenamientos y analíticas para que el coach tenga datos
                      que analizar.
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

              <div className="chat-panel">
                <h3>Chat de salud</h3>
                <div className="chat-messages" aria-live="polite">
                  {chatMessages.length === 0 ? (
                    <p className="chat-empty">
                      Pregúntame por tu racha, tu adherencia, tus entrenamientos o la tendencia de
                      tus analíticas.
                    </p>
                  ) : (
                    chatMessages.map((message) => (
                      <div key={message.id} className={`chat-message ${message.role}`}>
                        <div className="chat-message-content">{message.content}</div>
                      </div>
                    ))
                  )}
                  {sendingChat ? (
                    <div className="chat-message assistant">
                      <div className="chat-message-content">Escribiendo…</div>
                    </div>
                  ) : null}
                </div>
                <form
                  className="chat-input-row"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void sendChat()
                  }}
                >
                  <label className="visually-hidden" htmlFor="chat-input">
                    Escribe tu pregunta
                  </label>
                  <input
                    id="chat-input"
                    className="chat-input"
                    type="text"
                    placeholder="Pregunta sobre tus datos…"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                  />
                  <button
                    className="chat-send-btn"
                    type="submit"
                    disabled={sendingChat || !chatInput.trim()}
                  >
                    {sendingChat ? "…" : "Enviar"}
                  </button>
                </form>
              </div>
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
                      onChange={(event) => updateGoal("stepsGoal", event.target.value)}
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
                      onChange={(event) => updateGoal("fiberGoal", event.target.value)}
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
                      onChange={(event) => updateGoal("strengthGoal", event.target.value)}
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
                      onChange={(event) => updateGoal("cardioGoal", event.target.value)}
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
                      onChange={(event) => updateGoal("walksGoal", event.target.value)}
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
                <p>
                  Descarga una copia portable de tu progreso (hábitos, racha y analíticas) en
                  formato JSON.
                </p>
                <div className="settings-actions">
                  <button className="btn-secondary" type="button" onClick={() => exportData()}>
                    Exportar datos (JSON)
                  </button>
                </div>
              </div>

              <div className="settings-form" style={{ marginTop: "32px" }}>
                <h3>Función inteligente (IA)</h3>
                <p>
                  El coach usa un modelo compatible con OpenAI a través de un endpoint público. Tus
                  datos se tratan como información de salud y la IA nunca da diagnósticos.
                </p>
                <div className="settings-grid">
                  <div className="setting-field">
                    <label htmlFor="ai-model">Modelo</label>
                    <select
                      id="ai-model"
                      value={aiModel}
                      onChange={(event) => updateAiModel(event.target.value)}
                    >
                      {aiModelOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="setting-field">
                    <span className="ai-status-label">Estado</span>
                    <div className="ai-status-line">
                      <span
                        className={`ai-status-dot ${aiStatus?.configured ? "ok" : "off"}`}
                        aria-hidden="true"
                      />
                      <span>
                        {aiStatus === null
                          ? "Sin información"
                          : aiStatus.configured
                            ? "Configurado"
                            : "Sin clave de API"}
                      </span>
                    </div>
                  </div>
                </div>
                {aiStatus ? (
                  <p className="ai-config-note">
                    Endpoint: {aiStatus.endpoint} · temperatura:{" "}
                    {aiStatus.temperature.toString().replace(".", ",")}
                  </p>
                ) : null}
                <div className="settings-actions">
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => void testAiConnection()}
                    disabled={testingAi}
                  >
                    {testingAi ? "Probando…" : "Probar conexión"}
                  </button>
                </div>
                {aiTestResult === "ok" ? (
                  <p className="settings-saved">Conexión con la IA correcta.</p>
                ) : null}
                {aiTestResult === "error" ? (
                  <p className="ai-test-error" role="alert">
                    No se pudo conectar con el modelo. Revisa la configuración y vuelve a
                    intentarlo.
                  </p>
                ) : null}
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
