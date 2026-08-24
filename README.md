# VitaQuest

VitaQuest es una aplicación personal para convertir objetivos de salud en acciones diarias visibles: hábitos, comidas, entrenamiento, progreso, analíticas y recompensas.

La primera entrega incluye un panel inicial navegable y la base técnica para desplegar en Railway. La persistencia, autenticación y el histórico real se incorporarán por fases.

## Inicio local

Requisitos: Node.js 20+, pnpm 9+ y PostgreSQL (la persistencia es PostgreSQL en todos los entornos).

```bash
pnpm install
cp .env.example .env.local   # rellena DATABASE_URL y el resto de variables
pnpm db:migrate              # crea las tablas
pnpm dev
```

Abre `http://localhost:3000`.

Si no tienes un PostgreSQL local, puedes apuntar al de Railway con `railway run pnpm dev` (ejecuta en local con las variables del servicio remoto).

## Validación

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Despliegue en Railway

1. Crea un repositorio Git para esta carpeta y súbelo a GitHub.
2. En Railway, crea un proyecto nuevo desde ese repositorio.
3. Railway detectará Next.js y usará los scripts de `package.json`.
4. Configura las variables de entorno siguiendo `.env.example` cuando añadamos persistencia.
5. Verifica que el health check responde en `/api/health`.

Desde Codex, el despliegue autorizado se podrá hacer desde esta carpeta con `railway up`. Antes de ejecutarlo hay que confirmar el proyecto y el entorno de destino.

## Cómo continuar con Codex sin perder contexto

Empieza cada sesión pidiendo a Codex que lea `AGENTS.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` y `docs/ROADMAP.md`. Después describe una única tarea concreta y pide que actualice `docs/DECISIONS.md` si cambia una decisión de producto o arquitectura.

Ejemplo:

```text
Lee AGENTS.md y la documentación de docs/. Implementa la siguiente tarea del roadmap: guardar el primer hábito diario en PostgreSQL. Mantén el alcance, actualiza las decisiones si hace falta y valida tipos, lint y build.
```

## Documentación del proyecto

- [Producto](docs/PRODUCT.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Decisiones](docs/DECISIONS.md)
- [Roadmap](docs/ROADMAP.md)
- [Operaciones](docs/OPS.md)
