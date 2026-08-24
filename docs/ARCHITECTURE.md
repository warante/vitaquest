# Arquitectura inicial

## Stack

- Next.js con App Router para una aplicación full-stack sencilla.
- React y TypeScript estricto.
- CSS propio en la primera iteración para mantener el producto ligero.
- PostgreSQL gestionado por Railway cuando llegue la persistencia.
- Drizzle como ORM previsto para la capa de datos.
- Railway como plataforma de despliegue.

## Capas previstas

```text
app/                 interfaz y rutas HTTP de Next.js
app/domain/          reglas de producto puras
db/                  esquema, cliente y validación de persistencia
drizzle/             migraciones de PostgreSQL
docs/                contexto persistente del proyecto
```

La fase 2 ya define `db/` y la migración inicial. La base de datos remota queda pendiente de enlazar a un proyecto Railway confirmado.

## Datos iniciales previstos

- `UserProfile`: objetivos, preferencias y configuración.
- `DailyAction`: acción planificada, estado, fecha y experiencia obtenida.
- `MealPlanItem`: comida editable y sustituciones.
- `WorkoutSession`: entrenamiento realizado.
- `HealthMetric`: marcador, valor, unidad y fecha de medición.
- `Achievement`: insignias desbloqueadas.

## Persistencia de la fase 2

- `profiles` representa el espacio personal de la primera instalación.
- `daily_records` y `daily_actions` guardan el resumen diario y el detalle de acciones.
- `meals`, `workouts` y `lab_records` permiten registrar los datos introducidos manualmente.
- Las rutas `/api/daily-records`, `/api/meals`, `/api/workouts` y `/api/labs` validan entradas con Zod y escriben mediante Drizzle.
- `DATABASE_URL` se lee solo en tiempo de ejecución; sin ella las rutas responden `503` y la interfaz local sigue funcionando.

## Despliegue

Railway ejecutará la compilación de Next.js y arrancará el servidor con `pnpm start`. `/api/health` sirve como comprobación de disponibilidad. La base de datos se añadirá como servicio PostgreSQL en el mismo proyecto Railway cuando el usuario confirme el proyecto de destino.

## Seguridad y privacidad

- No guardar secretos en el repositorio.
- Mantener `.env.example` sin valores reales.
- Minimizar los datos personales.
- Añadir autenticación antes de exponer datos a más de un usuario.
- Revisar exportación y borrado de datos antes de abrir el producto a terceros.
- Cabeceras de seguridad y rate limiting configurados en `next.config.ts`, `middleware.ts` y `app/rate-limit.ts`.

## DevOps e infraestructura

- CI en `.github/workflows/ci.yml` (typecheck, lint, test, build) en cada push y PR.
- Despliegue manual a `staging`/`production` en `.github/workflows/deploy.yml` (Railway CLI).
- Copias de seguridad con `pnpm backup` (`scripts/backup-db.mjs`).
- Detalles operativos (monitorización, staging, backups, secretos) en `docs/OPS.md`.
