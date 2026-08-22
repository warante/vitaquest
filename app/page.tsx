"use client"

import { useMemo, useState } from "react"
import {
  type Action,
  ActionCard,
  CalendarStrip,
  ExportButton,
  Eyebrow,
  ProgressBar,
  WeeklyBars,
} from "./components"
import { createExportJson } from "./domain/export"
import {
  calculateStreak,
  calculateXp,
  type DailyRecord,
  getBadgeForStreak,
  summarizeWeek,
} from "./domain/gamification"

const initialActions: readonly Action[] = [
  { label: "Desayuno equilibrado", detail: "Proteína + fruta", icon: "🍳", completed: true },
  { label: "Caminar 30 minutos", detail: "Movimiento suave", icon: "🚶", completed: false },
  { label: "Beber agua", detail: "5 de 8 vasos", icon: "💧", completed: false },
  { label: "Cena ligera", detail: "Planificada para las 20:30", icon: "🥗", completed: false },
  { label: "Dormir a buena hora", detail: "Preparar descanso", icon: "🌙", completed: false },
]

const navigation = [
  { label: "Hoy", target: "today", icon: "⌂" },
  { label: "Plan", target: "plan", icon: "◫" },
  { label: "Retos", target: "retos", icon: "✦" },
  { label: "Progreso", target: "progreso", icon: "↗" },
  { label: "Analíticas", target: "analiticas", icon: "⌁" },
  { label: "Perfil", target: "perfil", icon: "○" },
] as const

const TODAY_DATE = "2026-08-21"

const localWeek = [
  { date: "2026-08-17", label: "L", number: "17", completedActions: 3, totalActions: 5 },
  { date: "2026-08-18", label: "M", number: "18", completedActions: 5, totalActions: 5 },
  { date: "2026-08-19", label: "X", number: "19", completedActions: 4, totalActions: 5 },
  { date: "2026-08-20", label: "J", number: "20", completedActions: 5, totalActions: 5 },
  { date: "2026-08-21", label: "V", number: "21", completedActions: 1, totalActions: 5 },
  { date: "2026-08-22", label: "S", number: "22", completedActions: 4, totalActions: 5 },
  { date: "2026-08-23", label: "D", number: "23", completedActions: 2, totalActions: 5 },
] as const

export default function Home(): React.ReactElement {
  const [actions, setActions] = useState<readonly Action[]>(initialActions)
  const [selectedDate, setSelectedDate] = useState("2026-08-21")
  const completedCount = useMemo(
    () => actions.filter((action) => action.completed).length,
    [actions],
  )
  const progress = Math.round((completedCount / actions.length) * 100)
  const weekRecords = useMemo(
    () =>
      localWeek.map((day) =>
        day.date === TODAY_DATE ? { ...day, completedActions: completedCount } : day,
      ),
    [completedCount],
  )
  const weekSummary = summarizeWeek(weekRecords satisfies readonly DailyRecord[])
  const streakDays = calculateStreak(weekRecords satisfies readonly DailyRecord[], selectedDate)
  const xp = calculateXp(completedCount, actions.length, streakDays)
  const badge = getBadgeForStreak(streakDays)
  const selectedDay = weekRecords.find((day) => day.date === selectedDate) ?? {
    date: "",
    label: "",
    number: "",
    completedActions: 0,
    totalActions: 0,
  }

  function toggleAction(label: string): void {
    setActions((current) =>
      current.map((action) =>
        action.label === label ? { ...action, completed: !action.completed } : action,
      ),
    )
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <main className="shell" id="main-content">
        <aside className="sidebar">
          <div className="brand-mark">VQ</div>
          <div>
            <Eyebrow>Tu compañero de progreso</Eyebrow>
            <h1>VitaQuest</h1>
          </div>
          <nav aria-label="Navegación principal">
            {navigation.map((item, index) => (
              <a
                className={index === 0 ? "nav-item active" : "nav-item"}
                href={`#${item.target}`}
                key={item.label}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="sidebar-footer">
            <span className="avatar">JL</span>
            <div>
              <strong>Tu espacio</strong>
              <small>Fase 1 · Construir constancia</small>
            </div>
          </div>
        </aside>

        <section className="content" id="today">
          <header className="topbar">
            <div>
              <Eyebrow>Jueves, 21 de agosto</Eyebrow>
              <h2>Buenos días, Javier</h2>
            </div>
            <div className="streak">
              <span aria-hidden="true">🔥</span>
              <strong>{streakDays}</strong>
              <span>días de racha</span>
            </div>
          </header>

          <section className="hero-card" id="plan">
            <div>
              <Eyebrow>Tu misión de hoy</Eyebrow>
              <h3>Pequeños pasos. Cambios que se quedan.</h3>
              <p>Completa tus acciones de hoy para sumar experiencia y mantener tu ritmo.</p>
            </div>
            <div className="level-badge">
              <strong>Nivel 4</strong>
              <span>{badge.label}</span>
            </div>
          </section>

          <div className="section-heading">
            <div>
              <Eyebrow>Hoy</Eyebrow>
              <h3>Tus acciones</h3>
            </div>
            <span className="progress-label">
              {completedCount} de {actions.length} completadas
            </span>
          </div>
          <ProgressBar value={progress} />

          <section className="action-list" id="retos" aria-label="Acciones diarias">
            {actions.map((action) => (
              <ActionCard
                action={action}
                key={action.label}
                onToggle={() => toggleAction(action.label)}
              />
            ))}
          </section>

          <section className="calendar-panel" aria-labelledby="calendar-title">
            <div className="panel-title">
              <div>
                <Eyebrow>Calendario local</Eyebrow>
                <h3 id="calendar-title">Tu semana en contexto</h3>
              </div>
              <span className="trend">{weekSummary.averageCompletion}% medio</span>
            </div>
            <CalendarStrip
              days={weekRecords}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />
            <p className="calendar-summary">
              {selectedDay.label} {selectedDay.number}: {selectedDay.completedActions} de{" "}
              {selectedDay.totalActions} acciones · Mejor día: {weekSummary.bestDate.slice(-2)}
            </p>
          </section>

          <section className="lower-grid" id="progreso">
            <article className="panel insight-panel" id="analiticas">
              <div className="panel-title">
                <div>
                  <Eyebrow>Tu semana</Eyebrow>
                  <h3>Vas ganando impulso</h3>
                </div>
                <span className="trend">{weekSummary.averageCompletion}%</span>
              </div>
              <WeeklyBars />
            </article>
            <article className="panel xp-panel" id="perfil">
              <Eyebrow>Siguiente recompensa</Eyebrow>
              <h3>Ritmo sostenido</h3>
              <p>Completa acciones para ganar experiencia y desbloquear insignias.</p>
              <div className="xp-row">
                <span>{xp} / 600 XP</span>
                <strong>{Math.round((xp / 600) * 100)}%</strong>
              </div>
              <div className="xp-track">
                <span style={{ width: `${Math.min((xp / 600) * 100, 100)}%` }} />
              </div>
              <ExportButton
                onExport={() => {
                  const content = createExportJson(
                    {
                      selectedDate,
                      xp,
                      streakDays,
                      actions: actions.map(({ label, completed }) => ({ label, completed })),
                      week: weekRecords,
                    },
                    new Date().toISOString(),
                  )
                  const url = URL.createObjectURL(new Blob([content], { type: "application/json" }))
                  const link = document.createElement("a")
                  link.href = url
                  link.download = `vitaquest-${selectedDate}.json`
                  link.click()
                  URL.revokeObjectURL(url)
                }}
              />
            </article>
          </section>
        </section>
      </main>
    </>
  )
}
