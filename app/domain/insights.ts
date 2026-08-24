export type MetricStatus = "normal" | "alert" | "critical"
export type Trend = "improving" | "stable" | "worsening" | "unknown"
export type InsightTone = "positive" | "neutral" | "encouraging"
export type AnomalySeverity = "info" | "warning" | "critical"

export type MetricSnapshot = Readonly<{
  marker: string
  label: string
  unit: string
  value: number | null
  status: MetricStatus | null
  trend: Trend
  history: readonly Readonly<{ date: string; value: number }>[]
}>

export type HealthSnapshot = Readonly<{
  goals: Readonly<{
    strengthGoal: number
    cardioGoal: number
  }>
  week: Readonly<{
    completedActions: number
    totalActions: number
    averageCompletion: number
  }>
  streakDays: number
  strengthSessionsWeek: number
  cardioSessionsWeek: number
  sessionsWeek: number
  avgRpe: number | null
  metrics: readonly MetricSnapshot[]
}>

export type Anomaly = Readonly<{
  type: string
  severity: AnomalySeverity
  title: string
  detail: string
}>

export type WeeklyInsight = Readonly<{
  title: string
  detail: string
  tone: InsightTone
}>

export const HEALTH_DISCLAIMER =
  "Estos datos son orientativos y no sustituyen la valoración de un profesional sanitario."

const METRIC_SPIKE_RATIO = 0.2
const HIGH_RPE_THRESHOLD = 8.5

export function trendLabel(trend: Trend): string {
  switch (trend) {
    case "improving":
      return "mejorando"
    case "stable":
      return "estable"
    case "worsening":
      return "empeorando"
    case "unknown":
      return "sin suficiente historial"
  }
}

function formatValue(value: number): string {
  const rounded = Math.round(value * 10) / 10
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return text.replace(".", ",")
}

export function detectAnomalies(snapshot: HealthSnapshot): readonly Anomaly[] {
  const anomalies: Anomaly[] = []

  for (const metric of snapshot.metrics) {
    if (metric.value !== null && metric.status === "critical") {
      anomalies.push({
        type: "metric_out_of_range",
        severity: "critical",
        title: `${metric.label} fuera de rango`,
        detail: `Tu última lectura de ${metric.label} (${formatValue(metric.value)} ${metric.unit.trim()}) está fuera del rango orientativo. No es un diagnóstico; consulta con un profesional si persiste.`,
      })
    } else if (metric.value !== null && metric.status === "alert") {
      anomalies.push({
        type: "metric_out_of_range",
        severity: "warning",
        title: `${metric.label} en el límite`,
        detail: `Tu última lectura de ${metric.label} (${formatValue(metric.value)} ${metric.unit.trim()}) está en zona a vigilar. No es un diagnóstico; observa la tendencia y consulta si persiste.`,
      })
    }

    if (metric.history.length >= 2) {
      const latest = metric.history[metric.history.length - 1]?.value
      const previous = metric.history.slice(0, -1).slice(-3)
      if (latest !== undefined && previous.length > 0) {
        const baseline = previous.reduce((total, point) => total + point.value, 0) / previous.length
        if (baseline !== 0) {
          const change = (latest - baseline) / Math.abs(baseline)
          if (Math.abs(change) > METRIC_SPIKE_RATIO) {
            const direction = change > 0 ? "subida" : "bajada"
            anomalies.push({
              type: "metric_spike",
              severity: "warning",
              title: `Cambio marcado en ${metric.label}`,
              detail: `${metric.label} registró una ${direction} del ${Math.round(Math.abs(change) * 100)}% respecto a las lecturas anteriores. Observa la tendencia y consulta con un profesional si persiste.`,
            })
          }
        }
      }
    }
  }

  if (snapshot.week.totalActions > 0 && snapshot.week.averageCompletion < 40) {
    anomalies.push({
      type: "adherence_low",
      severity: "warning",
      title: "Adherencia baja esta semana",
      detail: `Esta semana completaste ${snapshot.week.completedActions} de ${snapshot.week.totalActions} acciones (${snapshot.week.averageCompletion}%). No pasa nada: un día imperfecto no rompe el plan.`,
    })
  }

  if (snapshot.week.totalActions === 0) {
    anomalies.push({
      type: "no_data",
      severity: "info",
      title: "Todavía sin datos esta semana",
      detail:
        "No hay acciones registradas esta semana. Marca tus misiones de hoy para empezar a ver patrones.",
    })
  }

  if (snapshot.sessionsWeek === 0 && snapshot.week.totalActions > 0) {
    anomalies.push({
      type: "training_break",
      severity: "info",
      title: "Sin entrenamiento esta semana",
      detail:
        "No has registrado sesiones de entrenamiento esta semana. Un paseo suave también cuenta.",
    })
  }

  if (snapshot.avgRpe !== null && snapshot.avgRpe >= HIGH_RPE_THRESHOLD) {
    anomalies.push({
      type: "high_rpe",
      severity: "warning",
      title: "Esfuerzo medio muy alto",
      detail: `El esfuerzo medio reportado esta semana es de ${formatValue(snapshot.avgRpe)} sobre 10. Vigila el descanso para evitar sobrecarga.`,
    })
  }

  return anomalies
}

export function ruleBasedInsights(snapshot: HealthSnapshot): readonly WeeklyInsight[] {
  const insights: WeeklyInsight[] = []

  if (snapshot.week.totalActions === 0) {
    insights.push({
      title: "Semana por estrenar",
      detail:
        "Aún no hay acciones registradas. Empieza por tus misiones de hoy: cada una suma 10 XP y cuenta para tu racha.",
      tone: "encouraging",
    })
  } else if (snapshot.week.averageCompletion >= 80) {
    insights.push({
      title: "Gran adherencia",
      detail: `Completaste el ${snapshot.week.averageCompletion}% de tus misiones esta semana. La constancia vale más que la perfección.`,
      tone: "positive",
    })
  } else if (snapshot.week.averageCompletion >= 40) {
    insights.push({
      title: "Buen ritmo, sigue",
      detail: `Vas al ${snapshot.week.averageCompletion}% esta semana. Céntrate en la siguiente acción útil en vez de en lo que falte.`,
      tone: "neutral",
    })
  } else {
    insights.push({
      title: "Una semana, no un veredicto",
      detail: `Llevas el ${snapshot.week.averageCompletion}% de adherencia. No te castigues: elige una sola misión fácil y ciérrala hoy.`,
      tone: "encouraging",
    })
  }

  if (snapshot.streakDays >= 7) {
    insights.push({
      title: `Racha de ${snapshot.streakDays} días`,
      detail: "Llevas una racha sólida. Mantén el ritmo y cuida también los días de descanso.",
      tone: "positive",
    })
  }

  if (snapshot.strengthSessionsWeek >= snapshot.goals.strengthGoal) {
    insights.push({
      title: "Objetivo de fuerza cumplido",
      detail: `Has completado ${snapshot.strengthSessionsWeek} sesiones de fuerza esta semana (objetivo: ${snapshot.goals.strengthGoal}).`,
      tone: "positive",
    })
  } else if (snapshot.goals.strengthGoal > 0 && snapshot.week.totalActions > 0) {
    insights.push({
      title: "Fuerza por completar",
      detail: `Llevas ${snapshot.strengthSessionsWeek} de ${snapshot.goals.strengthGoal} sesiones de fuerza esta semana.`,
      tone: "neutral",
    })
  }

  for (const metric of snapshot.metrics) {
    if (metric.trend === "improving") {
      insights.push({
        title: `${metric.label} con buena tendencia`,
        detail: `Tu ${metric.label} está mejorando en las últimas lecturas. Es una señal alentadora; mantén el patrón.`,
        tone: "positive",
      })
    } else if (metric.trend === "worsening") {
      insights.push({
        title: `${metric.label} a vigilar`,
        detail: `La tendencia de ${metric.label} ha empeorado en las últimas lecturas. Obsérvala y consulta con un profesional si persiste.`,
        tone: "encouraging",
      })
    }
  }

  return insights
}

export function answerFromData(snapshot: HealthSnapshot, question: string): string {
  const normalized = question.toLowerCase()
  const metric = snapshot.metrics.find(
    (item) =>
      normalized.includes(item.label.toLowerCase()) ||
      normalized.includes(item.marker.toLowerCase()),
  )

  if (metric) {
    if (metric.value === null) {
      return `Todavía no hay ninguna lectura registrada de ${metric.label}. Añádela desde la pestaña Progreso para poder seguir su evolución.`
    }
    return `Tu última lectura de ${metric.label} es ${formatValue(metric.value)} ${metric.unit.trim()} (tendencia ${trendLabel(metric.trend)}). ${HEALTH_DISCLAIMER}`
  }

  if (normalized.includes("racha")) {
    return `Llevas ${snapshot.streakDays} días de racha. ${HEALTH_DISCLAIMER}`
  }

  if (
    normalized.includes("entren") ||
    normalized.includes("fuerza") ||
    normalized.includes("sesión") ||
    normalized.includes("sesion") ||
    normalized.includes("cardio")
  ) {
    return `Esta semana has registrado ${snapshot.sessionsWeek} sesiones (${snapshot.strengthSessionsWeek} de fuerza y ${snapshot.cardioSessionsWeek} de cardio). ${HEALTH_DISCLAIMER}`
  }

  if (
    normalized.includes("adheren") ||
    normalized.includes("semana") ||
    normalized.includes("hábito") ||
    normalized.includes("habito") ||
    normalized.includes("progreso")
  ) {
    return `Esta semana llevas un ${snapshot.week.averageCompletion}% de adherencia (${snapshot.week.completedActions} de ${snapshot.week.totalActions} acciones). ${HEALTH_DISCLAIMER}`
  }

  return `Puedo ayudarte con preguntas sobre tu racha, tu adherencia semanal, tus sesiones de entrenamiento y tus analíticas. ${HEALTH_DISCLAIMER}`
}
