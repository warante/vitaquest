# Decisiones

## 2026-09-07 — Migración a local-first (Vite + Dexie + GitHub Pages)

**Contexto:** VitaQuest era una app Next.js full-stack con PostgreSQL. El usuario quería desplegarla en GitHub Pages como PWA instalable en Android, con datos locales en el dispositivo (sin servidor).

**Decisión:** Migrar a Vite + React + Dexie.js (IndexedDB). Eliminar PostgreSQL, Drizzle, API routes y autenticación. Añadir import/export JSON para portabilidad de datos.

**Razonamiento:**
- GitHub Pages solo sirve archivos estáticos, así que se necesita una SPA sin servidor.
- Dexie.js proporciona una capa de datos robusta sobre IndexedDB con migraciones.
- La PWA con service worker permite funcionamiento offline completo.
- Import/export JSON resuelve la portabilidad entre dispositivos sin necesidad de sincronización en la nube.
- Vite es más ligero y rápido que Next.js para una SPA estática.

**Consecuencias:**
- Se eliminó: Next.js, PostgreSQL, Drizzle, API routes, auth, offline queue.
- Se añadió: Vite, Dexie.js, vite-plugin-pwa, GitHub Actions para Pages.
- La lógica de dominio (XP, rachas, insignias, etc.) se mantuvo intacta.
- La UI se mantuvo esencialmente igual.
- Las funciones de IA (coach) se simplificaron (sin proxy de servidor).
