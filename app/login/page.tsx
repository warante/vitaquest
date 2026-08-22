"use client"

import { useState } from "react"

export default function LoginPage(): React.ReactElement {
  const [accessKey, setAccessKey] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessKey }),
      })
      if (!response.ok) {
        setError("La clave no es correcta.")
        return
      }
      const next = new URLSearchParams(window.location.search).get("next") ?? "/"
      window.location.assign(next.startsWith("/") ? next : "/")
    } catch {
      setError("No se pudo conectar. Inténtalo de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark">VQ</div>
        <p className="eyebrow">Tu espacio privado</p>
        <h1 id="login-title">VitaQuest</h1>
        <p className="login-copy">Introduce tu clave para continuar con tu progreso.</p>
        <form method="post" onSubmit={(event) => void submit(event)}>
          <label htmlFor="access-key">Clave de acceso</label>
          <input
            id="access-key"
            name="accessKey"
            type="password"
            autoComplete="current-password"
            value={accessKey}
            onChange={(event) => setAccessKey(event.target.value)}
            required
          />
          {error ? (
            <p className="login-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="primary-button login-button" type="submit" disabled={submitting}>
            {submitting ? "Comprobando…" : "Entrar"}
          </button>
        </form>
        <small className="login-note">La sesión se conserva 30 días en este dispositivo.</small>
      </section>
    </main>
  )
}
