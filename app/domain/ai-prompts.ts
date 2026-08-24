import { HEALTH_DISCLAIMER, type HealthSnapshot, trendLabel } from "./insights"

export function systemPrompt(): string {
  return [
    "Eres VitaQuest, un asistente de hábitos de salud integrado en una app personal.",
    "Analizas datos de alimentación, movimiento, entrenamiento y analíticas registradas manualmente.",
    "",
    "Reglas estrictas:",
    "1. Nunca des diagnósticos médicos ni interpretaciones clínicas.",
    "2. Nunca recomiendes cambios en medicación ni suplementos.",
    "3. Solo describe patrones observables en los datos facilitados.",
    "4. Solo sugiere cambios generales de hábitos (más verdura, más movimiento, etc.).",
    "5. Ante cualquier valor preocupante, sugiere consultar con un profesional sanitario sin alarmar.",
    "6. Usa lenguaje sencillo y no clínico.",
    "7. Responde en español.",
    "8. Si faltan datos, dilo con claridad en lugar de inventar.",
    `9. Incluye un recordatorio breve de no-diagnóstico cuando corresponda: "${HEALTH_DISCLAIMER}"`,
  ].join("\n")
}

export function healthSnapshotText(snapshot: HealthSnapshot): string {
  const lines: string[] = []
  lines.push("## Contexto del usuario (datos registrados)")
  lines.push(
    `- Adherencia de la semana: ${snapshot.week.averageCompletion}% (${snapshot.week.completedActions} de ${snapshot.week.totalActions} acciones).`,
  )
  lines.push(`- Racha actual: ${snapshot.streakDays} días.`)
  lines.push(
    `- Entrenamiento esta semana: ${snapshot.sessionsWeek} sesiones (fuerza: ${snapshot.strengthSessionsWeek}, cardio: ${snapshot.cardioSessionsWeek}).`,
  )
  if (snapshot.avgRpe !== null) {
    lines.push(`- Esfuerzo medio reportado (RPE): ${snapshot.avgRpe.toFixed(1)} sobre 10.`)
  }
  lines.push(
    `- Objetivos: ${snapshot.goals.strengthGoal} sesiones de fuerza/semana, ${snapshot.goals.cardioGoal} min de cardio/semana.`,
  )
  lines.push("")
  lines.push("## Métricas de salud (analíticas)")
  if (snapshot.metrics.length === 0) {
    lines.push("- Sin analíticas registradas.")
  } else {
    for (const metric of snapshot.metrics) {
      const value =
        metric.value === null ? "sin dato" : `${metric.value} ${metric.unit.trim()}`.trim()
      lines.push(`- ${metric.label}: ${value} · tendencia ${trendLabel(metric.trend)}.`)
    }
  }
  return lines.join("\n")
}

export function insightsUserPrompt(snapshot: HealthSnapshot): string {
  return [
    healthSnapshotText(snapshot),
    "",
    "Genera de 3 a 5 insights semanales breves sobre los hábitos de salud del usuario.",
    "Cada insight debe incluir una observación de patrón y una sugerencia de hábito concreta y realista.",
    "No repitas texto literal del contexto; interpreta y resume.",
    "Devuelve SOLO JSON con el siguiente formato, sin texto adicional:",
    '{"insights":[{"title":"...","detail":"..."}]}',
  ].join("\n")
}

export function chatUserPrompt(snapshot: HealthSnapshot, question: string): string {
  return [
    healthSnapshotText(snapshot),
    "",
    `Pregunta del usuario: ${question}`,
    "",
    "Responde de forma breve, amable y basándote solo en los datos facilitados.",
  ].join("\n")
}

export function parseInsightsJson(
  text: string,
): readonly Readonly<{ title: string; detail: string }>[] {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced?.[1] ?? trimmed).trim()

  const parse = (source: string): unknown => {
    try {
      return JSON.parse(source)
    } catch {
      return undefined
    }
  }

  let parsed = parse(candidate)
  if (parsed === undefined) {
    const start = candidate.search(/[[{]/)
    const end = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"))
    if (start !== -1 && end !== -1 && end >= start) {
      parsed = parse(candidate.slice(start, end + 1))
    }
  }
  if (typeof parsed !== "object" || parsed === null) return []

  const list: unknown[] = Array.isArray((parsed as { insights?: unknown }).insights)
    ? (parsed as { insights: unknown[] }).insights
    : Array.isArray(parsed)
      ? parsed
      : []

  return list.flatMap((item) => {
    if (typeof item !== "object" || item === null) return []
    const title = (item as { title?: unknown }).title
    const detail = (item as { detail?: unknown }).detail
    if (typeof title !== "string" || typeof detail !== "string") return []
    const cleanTitle = title.trim()
    const cleanDetail = detail.trim()
    if (cleanTitle === "" || cleanDetail === "") return []
    return [{ title: cleanTitle, detail: cleanDetail }]
  })
}
