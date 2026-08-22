"use client"

import { useMemo, useState } from "react"
import { Eyebrow } from "./components"
import {
  defaultReminders,
  type GoalFocus,
  getAchievements,
  getProgramProgress,
  getProgramWeek,
  goalFocuses,
  type Reminder,
} from "./domain/evolution"
import type { DailyRecord, WeekSummary } from "./domain/gamification"

type EvolutionPanelProps = Readonly<{
  records: readonly DailyRecord[]
  summary: WeekSummary
  streakDays: number
}>

const PROGRAM_START = "2026-08-17"
const CURRENT_DATE = "2026-08-21"

export function EvolutionPanel({
  records,
  summary,
  streakDays,
}: EvolutionPanelProps): React.ReactElement {
  const [focus, setFocus] = useState<GoalFocus>(goalFocuses[0])
  const [reminders, setReminders] = useState<readonly Reminder[]>(defaultReminders)
  const programWeek = getProgramWeek(PROGRAM_START, CURRENT_DATE)
  const goalProgress = getProgramProgress(summary)
  const achievements = useMemo(
    () => getAchievements(records, summary, streakDays),
    [records, summary, streakDays],
  )

  function updateReminder(id: Reminder["id"], update: Partial<Reminder>): void {
    setReminders((current) =>
      current.map((reminder) => (reminder.id === id ? { ...reminder, ...update } : reminder)),
    )
  }

  return (
    <section className="evolution-section" aria-labelledby="evolution-title">
      <div className="section-heading evolution-heading">
        <div>
          <Eyebrow>Fase 4 · Evolución</Eyebrow>
          <h3 id="evolution-title">Tu siguiente capítulo</h3>
        </div>
        <span className="trend">Semana {programWeek} de 12</span>
      </div>
      <div className="evolution-grid">
        <article className="panel goal-panel">
          <div className="panel-title">
            <div>
              <Eyebrow>Objetivo de 12 semanas</Eyebrow>
              <h3>{focus}</h3>
            </div>
            <strong className="goal-percent">{goalProgress}%</strong>
          </div>
          <p className="evolution-copy">
            Una ruta flexible para acumular semanas suficientemente buenas, sin castigar los días
            imperfectos.
          </p>
          <fieldset className="focus-switcher">
            <legend className="visually-hidden">Enfoque del objetivo</legend>
            {goalFocuses.map((option) => (
              <button
                className={focus === option ? "focus-option selected" : "focus-option"}
                type="button"
                aria-pressed={focus === option}
                key={option}
                onClick={() => setFocus(option)}
              >
                {option}
              </button>
            ))}
          </fieldset>
          <div
            className="goal-track"
            aria-label={`Progreso del objetivo: ${goalProgress}%`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={goalProgress}
          >
            <span style={{ width: `${goalProgress}%` }} />
          </div>
          <ol className="goal-steps" aria-label="Semanas del programa">
            {Array.from({ length: 12 }, (_, index) => index + 1).map((week) => (
              <li className={week <= programWeek ? "goal-step reached" : "goal-step"} key={week}>
                {week}
              </li>
            ))}
          </ol>
        </article>
        <article className="panel reminder-panel">
          <div className="panel-title">
            <div>
              <Eyebrow>Recordatorios</Eyebrow>
              <h3>A tu ritmo</h3>
            </div>
            <span className="trend">Solo en este dispositivo</span>
          </div>
          <div className="reminder-list">
            {reminders.map((reminder) => (
              <label className="reminder-row" key={reminder.id}>
                <span>
                  <strong>{reminder.label}</strong>
                  <small>{reminder.enabled ? "Activo" : "Pausado"}</small>
                </span>
                <input
                  type="time"
                  value={reminder.time}
                  disabled={!reminder.enabled}
                  aria-label={`Hora: ${reminder.label}`}
                  onChange={(event) => updateReminder(reminder.id, { time: event.target.value })}
                />
                <input
                  className="reminder-toggle"
                  type="checkbox"
                  checked={reminder.enabled}
                  aria-label={`${reminder.enabled ? "Pausar" : "Activar"}: ${reminder.label}`}
                  onChange={(event) =>
                    updateReminder(reminder.id, { enabled: event.target.checked })
                  }
                />
              </label>
            ))}
          </div>
        </article>
      </div>
      <ul className="achievement-list" aria-label="Logros">
        {achievements.map((achievement) => (
          <li
            className={achievement.unlocked ? "achievement-card unlocked" : "achievement-card"}
            key={achievement.key}
          >
            <span className="achievement-mark" aria-hidden="true">
              {achievement.unlocked ? "✓" : "·"}
            </span>
            <div>
              <strong>{achievement.label}</strong>
              <p>{achievement.detail}</p>
              <small>{achievement.progress}</small>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
