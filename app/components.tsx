import type { ReactNode } from "react"

export type Action = Readonly<{
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
        const completion = Math.round((day.completedActions / day.totalActions) * 100)
        const isSelected = day.date === selectedDate

        return (
          <button
            className={isSelected ? "calendar-day selected" : "calendar-day"}
            type="button"
            aria-label={`${day.label} ${day.number}: ${completion}% completado`}
            aria-pressed={isSelected}
            key={day.date}
            onClick={() => onSelect(day.date)}
          >
            <span>{day.label}</span>
            <strong>{day.number}</strong>
            <small>{completion}%</small>
          </button>
        )
      })}
    </section>
  )
}

export function WeeklyBars(): ReactNode {
  const activity = [
    { label: "L", height: 58 },
    { label: "M", height: 72 },
    { label: "X", height: 48 },
    { label: "J", height: 86 },
    { label: "V", height: 64 },
    { label: "S", height: 78 },
    { label: "D", height: 38 },
  ] as const

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
