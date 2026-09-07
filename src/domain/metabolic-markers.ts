export const metricTypes = [
  "triglycerides",
  "insulin_resistance",
  "fatty_liver_index",
  "alt_gpt",
] as const
export type MetricType = (typeof metricTypes)[number]

export type MetricStatus = "normal" | "alert" | "critical"
export type Trend = "improving" | "stable" | "worsening" | "unknown"

export type MetricDefinition = Readonly<{
  type: MetricType
  label: string
  unit: string
  decimals: number
}>

export const metricDefinitions: readonly MetricDefinition[] = [
  { type: "triglycerides", label: "Triglicéridos", unit: "mg/dL", decimals: 0 },
  { type: "insulin_resistance", label: "Resistencia Insulínica", unit: "", decimals: 1 },
  { type: "fatty_liver_index", label: "Índice Hígado Graso", unit: "", decimals: 1 },
  { type: "alt_gpt", label: "ALT / GPT", unit: "U/L", decimals: 0 },
]

export function contextFor(
  type: MetricType,
  value: number,
): Readonly<{ text: string; status: MetricStatus }> {
  switch (type) {
    case "triglycerides":
      if (value < 150) {
        return { text: "Dentro del rango deseable. No diagnóstico.", status: "normal" }
      }
      if (value < 200) {
        return { text: "Límite alto: tendencia a vigilar. No diagnóstico.", status: "alert" }
      }
      return { text: "Valor alto según rangos orientativos. No diagnóstico.", status: "critical" }
    case "insulin_resistance":
      if (value < 2.5) {
        return { text: "Dentro del rango habitual. No diagnóstico.", status: "normal" }
      }
      if (value <= 4.5) {
        return { text: "Resistencia leve según HOMA-IR. No diagnóstico.", status: "alert" }
      }
      return {
        text: "Resistencia significativa según HOMA-IR. No diagnóstico.",
        status: "critical",
      }
    case "fatty_liver_index":
      if (value < 30) {
        return { text: "Riesgo bajo según FLI. No diagnóstico.", status: "normal" }
      }
      if (value < 60) {
        return { text: "Zona de posible riesgo, no diagnóstico.", status: "alert" }
      }
      return { text: "Riesgo alto según FLI, no diagnóstico.", status: "critical" }
    case "alt_gpt":
      if (value < 40) {
        return { text: "Dentro del rango habitual. No diagnóstico.", status: "normal" }
      }
      if (value < 80) {
        return { text: "Levemente elevada. No diagnóstico.", status: "alert" }
      }
      return {
        text: "Valor elevado según rangos orientativos. No diagnóstico.",
        status: "critical",
      }
  }
}

export function calculateTrend(values: readonly number[]): Trend {
  if (values.length < 2) return "unknown"
  const latest = values[values.length - 1]
  const previous = values.slice(0, -1).slice(-3)
  if (latest === undefined || previous.length === 0) return "unknown"
  const baseline = previous.reduce((total, value) => total + value, 0) / previous.length
  if (baseline === 0) return "stable"
  const relativeChange = (latest - baseline) / Math.abs(baseline)
  if (Math.abs(relativeChange) < 0.03) return "stable"
  return relativeChange < 0 ? "improving" : "worsening"
}

export type MetricReading = Readonly<{
  marker: string
  value: number
  date: string
}>

export type MetricPoint = Readonly<{
  date: string
  value: number
}>

export type MetricSummary = Readonly<{
  type: MetricType
  label: string
  unit: string
  decimals: number
  value: number | null
  status: MetricStatus | null
  context: string
  trend: Trend
  history: readonly MetricPoint[]
}>

export function summarizeMetrics(readings: readonly MetricReading[]): readonly MetricSummary[] {
  const byMarker = new Map<string, MetricPoint[]>()
  for (const reading of readings) {
    const points = byMarker.get(reading.marker) ?? []
    points.push({ date: reading.date, value: reading.value })
    byMarker.set(reading.marker, points)
  }
  return metricDefinitions.map((definition) => {
    const points = byMarker.get(definition.type) ?? []
    const latest = points[points.length - 1]
    const value = latest?.value ?? null
    const context = value === null ? null : contextFor(definition.type, value)
    return {
      type: definition.type,
      label: definition.label,
      unit: definition.unit,
      decimals: definition.decimals,
      value,
      status: context?.status ?? null,
      context: context?.text ?? "",
      trend: calculateTrend(points.map((point) => point.value)),
      history: points,
    }
  })
}
