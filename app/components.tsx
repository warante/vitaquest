import type { ReactNode } from "react"

export type Action = Readonly<{
  slug: string
  label: string
  detail: string
  icon: string
  completed: boolean
}>

export type CalendarDay = Readonly<{
  date: string
  label: string
  number: string
  completedActions: number
  totalActions: number
}>

export function Eyebrow({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  return <p className="eyebrow">{children}</p>
}

export function ActionCard({
  action,
  onToggle,
}: Readonly<{ action: Action; onToggle: () => void }>): ReactNode {
  return (
    <button
      className={action.completed ? "action-card completed" : "action-card"}
      type="button"
      aria-pressed={action.completed}
      onClick={onToggle}
    >
      <span className="action-icon" aria-hidden="true">
        {action.icon}
      </span>
      <span className="action-copy">
        <strong>{action.label}</strong>
        <span>{action.detail}</span>
      </span>
      <span className={action.completed ? "check done" : "check"} aria-hidden="true">
        {action.completed ? "✓" : ""}
      </span>
    </button>
  )
}

export function ProgressBar({ value }: Readonly<{ value: number }>): ReactNode {
  return (
    <div
      className="progress-track"
      aria-label={`Progreso del día: ${value}%`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  )
}

export function ExportButton({ onExport }: Readonly<{ onExport: () => void }>): ReactNode {
  return (
    <button className="export-button" type="button" onClick={onExport}>
      Exportar resumen
    </button>
  )
}

export function CalendarStrip({
  days,
  selectedDate,
  onSelect,
}: Readonly<{
  days: readonly CalendarDay[]
  selectedDate: string
  onSelect: (date: string) => void
}>): ReactNode {
  return (
    <section className="calendar-strip" aria-label="Calendario semanal">
      {days.map((day) => {
        const hasRecord = day.totalActions > 0
        const completion = hasRecord
          ? Math.round((day.completedActions / day.totalActions) * 100)
          : 0
        const isSelected = day.date === selectedDate

        return (
          <button
            className={isSelected ? "calendar-day selected" : "calendar-day"}
            type="button"
            aria-label={`${day.label} ${day.number}: ${hasRecord ? `${completion}% completado` : "sin registro"}`}
            aria-pressed={isSelected}
            key={day.date}
            onClick={() => onSelect(day.date)}
          >
            <span>{day.label}</span>
            <strong>{day.number}</strong>
            <small>{hasRecord ? `${completion}%` : "—"}</small>
          </button>
        )
      })}
    </section>
  )
}

export function WeeklyBars({ records }: Readonly<{ records: readonly CalendarDay[] }>): ReactNode {
  const activity = records.map((record) => ({
    label: record.label,
    height:
      record.totalActions === 0
        ? 0
        : Math.max(8, Math.round((record.completedActions / record.totalActions) * 100)),
  }))

  return (
    <div className="bars" role="img" aria-label="Resumen de actividad de la semana">
      {activity.map((day) => (
        <div className="bar-column" key={day.label}>
          <div className="bar" style={{ height: `${day.height}%` }} />
          <small>{day.label}</small>
        </div>
      ))}
    </div>
  )
}

export function EmptyDayState({
  onCreate,
  loading,
}: Readonly<{ onCreate: () => void; loading: boolean }>): ReactNode {
  return (
    <section className="empty-day" aria-live="polite">
      <span className="empty-day-icon" aria-hidden="true">
        ✦
      </span>
      <div>
        <h3>Aún no tienes un día creado</h3>
        <p>Empieza con un plan base editable. Nada se guarda hasta que tú lo decidas.</p>
      </div>
      <button className="primary-button" type="button" onClick={onCreate} disabled={loading}>
        {loading ? "Creando…" : "Crear mi primer día"}
      </button>
    </section>
  )
}
