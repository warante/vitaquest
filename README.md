# VitaQuest

VitaQuest es una aplicación personal para convertir objetivos de salud en acciones diarias visibles: hábitos, comidas, entrenamiento, progreso, analíticas y recompensas.

La primera entrega incluye un panel inicial navegable y la base técnica para desplegar en Railway. La persistencia, autenticación y el histórico real se incorporarán por fases.

## Inicio local

Requisitos: Node.js 20+ y pnpm 9+.

```bash
pnpm install
pnpm dev
```

Abre `http://localhost:3000`.

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
