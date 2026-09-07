import { useState } from "react"
import type { MetricPoint } from "./domain/metabolic-markers"
import { formatMetricValue, formatShortDate } from "./format"

export function MetricSparkline({
  points,
}: {
  points: readonly MetricPoint[]
}): React.ReactElement | null {
  if (points.length < 2) return null
  const values = points.map((point) => point.value)
  const width = 100
  const height = 28
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const line = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / range) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(" ")
  return (
    <svg
      className="metric-sparkline"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <polyline points={line} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export function MetricLineChart({
  label,
  points,
  unit,
  decimals,
}: {
  label: string
  points: readonly MetricPoint[]
  unit: string
  decimals: number
}): React.ReactElement | null {
  if (points.length < 2) return null
  const width = 320
  const height = 140
  const paddingLeft = 40
  const paddingRight = 12
  const paddingTop = 12
  const paddingBottom = 24
  const values = points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom
  const xFor = (index: number): number => paddingLeft + (index / (points.length - 1)) * chartWidth
  const yFor = (value: number): number =>
    paddingTop + chartHeight - ((value - min) / range) * chartHeight
  const line = points.map((point, index) => `${xFor(index)},${yFor(point.value)}`).join(" ")
  const firstDate = formatShortDate(points[0]?.date ?? "")
  const lastDate = formatShortDate(points[points.length - 1]?.date ?? "")
  return (
    <div className="metric-chart">
      <div className="metric-chart-header">
        <span className="metric-chart-title">{label}</span>
        <span className="metric-chart-range">
          {formatMetricValue(min, decimals)} – {formatMetricValue(max, decimals)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <svg
        className="metric-chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Evolución de ${label}`}
      >
        <line
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={width - paddingRight}
          y2={paddingTop + chartHeight}
          className="metric-chart-axis"
        />
        <polyline points={line} fill="none" className="metric-chart-line" strokeWidth="2" />
      </svg>
      <div className="metric-chart-dates">
        <span>{firstDate}</span>
        <span>{lastDate}</span>
      </div>
    </div>
  )
}

const weekdayLabels = ["L", "M", "X", "J", "V", "S", "D"]

export function WorkoutCalendar({
  sessionDates,
}: {
  sessionDates: ReadonlySet<string>
}): React.ReactElement {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const monthLabel = new Date(year, month, 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  })
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = (firstWeekday + 6) % 7
  const cells: { key: string; day: number | null }[] = []
  for (let index = 0; index < offset; index++) cells.push({ key: `pad-${index}`, day: null })
  for (let day = 1; day <= daysInMonth; day++) cells.push({ key: `day-${day}`, day })

  function changeMonth(delta: number): void {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  function isoDay(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  return (
    <div className="workout-calendar">
      <div className="workout-calendar-header">
        <button
          className="calendar-nav-btn"
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <span className="workout-calendar-month">{monthLabel}</span>
        <button
          className="calendar-nav-btn"
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>
      <div className="workout-calendar-grid">
        {weekdayLabels.map((label) => (
          <div key={label} className="workout-calendar-weekday">
            {label}
          </div>
        ))}
        {cells.map((cell) =>
          cell.day === null ? (
            <div key={cell.key} className="workout-calendar-cell empty" />
          ) : (
            <div
              key={cell.key}
              className={`workout-calendar-cell ${sessionDates.has(isoDay(cell.day)) ? "trained" : ""}`}
            >
              {cell.day}
            </div>
          ),
        )}
      </div>
    </div>
  )
}
