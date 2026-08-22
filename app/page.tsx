"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  type Action,
  ActionCard,
  CalendarStrip,
  EmptyDayState,
  ExportButton,
  Eyebrow,
  ProgressBar,
  WeeklyBars,
} from "./components"
import type { DashboardResponse } from "./dashboard-types"
import { createExportJson } from "./domain/export"
import {
  calculateStreak,
  calculateXp,
  getBadgeForStreak,
  summarizeWeek,
} from "./domain/gamification"
import { EvolutionPanel } from "./evolution-panel"

const navigation = [
  { label: "Hoy", target: "today", icon: "⌂" },
  { label: "Plan", target: "plan", icon: "◫" },
  { label: "Retos", target: "retos", icon: "✦" },
  { label: "Progreso", target: "progreso", icon: "↗" },
  { label: "Analíticas", target: "analiticas", icon: "⌁" },
  { label: "Perfil", target: "perfil", icon: "○" },
] as const

export default function Home(): React.ReactElement {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const actions: readonly Action[] = dashboard?.today.actions ?? []
  const weekRecords = dashboard?.week ?? []
  const todayDate = dashboard?.today.date ?? ""
  const completedCount = useMemo(
    () => actions.filter((action) => action.completed).length,
    [actions],
  )
  const progress = actions.length === 0 ? 0 : Math.round((completedCount / actions.length) * 100)
  const weekSummary = useMemo(() => summarizeWeek(weekRecords), [weekRecords])
  const streakDays = useMemo(
    () => (selectedDate || todayDate ? calculateStreak(weekRecords, selectedDate || todayDate) : 0),
    [selectedDate, todayDate, weekRecords],
  )
  const xp = calculateXp(completedCount, actions.length, streakDays)
  const badge = getBadgeForStreak(streakDays)
  const selectedDay = weekRecords.find((day) => day.date === selectedDate) ?? {
    date: "",
    label: "",
    number: "",
    completedActions: 0,
    totalActions: 0,
  }

  const loadDashboard = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" })
      if (!response.ok) throw new Error("dashboard")
      const data = (await response.json()) as DashboardResponse
      setDashboard(data)
      setSelectedDate((current) => current || data.today.date)
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

  async function createFirstDay(): Promise<void> {
    setCreating(true)
    try {
      const response = await fetch("/api/dashboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recordDate: todayDate }),
      })
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
      current ? { ...current, today: { ...current.today, actions: nextActions } } : current,
    )
    try {
      const response = await fetch("/api/dashboard", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recordDate: todayDate, actions: nextActions }),
      })
      if (!response.ok) throw new Error("save")
      setDashboard((await response.json()) as DashboardResponse)
    } catch {
      setError("No se pudo guardar el cambio. Recargando el último estado guardado.")
      await loadDashboard()
    } finally {
      setSaving(false)
    }
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
            <span className="avatar">
              {(dashboard?.profile.displayName ?? "David").slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>Tu espacio</strong>
              <small>Fase 4 · Evolución</small>
            </div>
          </div>
        </aside>

        <section className="content" id="today">
          {loading ? (
            <section className="loading-card" aria-live="polite">
              Cargando tu espacio…
            </section>
          ) : null}
          {error ? (
            <section className="error-card" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => void loadDashboard()}>
                Reintentar
              </button>
            </section>
          ) : null}
          <header className="topbar">
            <div>
              <Eyebrow>Tu espacio personal</Eyebrow>
              <h2>Buenos días, {dashboard?.profile.displayName ?? "David"}</h2>
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
              <p>
                {dashboard?.profile.goalSummary ??
                  "Completa tus acciones de hoy para sumar experiencia y mantener tu ritmo."}
              </p>
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
              {actions.length === 0
                ? "Sin acciones creadas"
                : `${completedCount} de ${actions.length} completadas`}
            </span>
          </div>
          <ProgressBar value={progress} />

          {actions.length === 0 ? (
            <EmptyDayState onCreate={() => void createFirstDay()} loading={creating} />
          ) : (
            <section className="action-list" id="retos" aria-label="Acciones diarias">
              {actions.map((action) => (
                <ActionCard
                  action={action}
                  key={action.slug}
                  onToggle={() => void toggleAction(action.slug)}
                />
              ))}
            </section>
          )}

          <section className="calendar-panel" aria-labelledby="calendar-title">
            <div className="panel-title">
              <div>
                <Eyebrow>Calendario local</Eyebrow>
                <h3 id="calendar-title">Tu semana en contexto</h3>
              </div>
              <span className="trend">
                {weekSummary.totalActions === 0
                  ? "Sin registros"
                  : `${weekSummary.averageCompletion}% medio`}
              </span>
            </div>
            <CalendarStrip
              days={weekRecords}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />
            <p className="calendar-summary">
              {selectedDay?.totalActions
                ? `${selectedDay.label} ${selectedDay.number}: ${selectedDay.completedActions} de ${selectedDay.totalActions} acciones`
                : "Los días aparecerán aquí cuando los registres."}
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
              <WeeklyBars records={weekRecords} />
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
          {dashboard ? (
            <EvolutionPanel
              records={weekRecords}
              summary={weekSummary}
              streakDays={streakDays}
              currentDate={todayDate}
            />
          ) : null}
        </section>
      </main>
    </>
  )
}
