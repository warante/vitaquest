# Operaciones e infraestructura (Fase 12)

Guía operativa de VitaQuest. Cubre CI/CD, seguridad, copias de seguridad, monitorización y entorno de staging.

## CI/CD

El workflow `.github/workflows/ci.yml` se ejecuta en cada push a `main` y en cada pull request:

1. Instala dependencias con pnpm (`--frozen-lockfile`).
2. Ejecuta `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build`.

El workflow de despliegue `.github/workflows/deploy.yml` es manual (`workflow_dispatch`) y permite elegir entre `staging` y `production`. Usa el CLI de Railway y requiere el secreto `RAILWAY_TOKEN` (token de proyecto con alcance de entorno).

## Seguridad

### Cabeceras

`next.config.ts` añade cabeceras de endurecimiento a todas las respuestas:

- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `X-DNS-Prefetch-Control`.
- En producción además: `Content-Security-Policy` (solo `'self'` + `'unsafe-inline'` para scripts/estilos que requiere Next.js) y `Strict-Transport-Security`.

El CSP actual permite `'unsafe-inline'` para scripts/estilos porque Next.js inyecta scripts de arranque en línea. Si en el futuro se quiere un CSP estricto sin `'unsafe-inline'`, hay que añadir nonces en la generación de HTML (fuera del alcance de esta fase).

### Rate limiting

`app/rate-limit.ts` implementa un limitador en memoria (ventana fija). Se aplica en tres puntos:

- **Login** (`/api/auth/login`): 10 intentos / 10 min por IP (protección contra fuerza bruta).
- **API general** (middleware): 300 peticiones / minuto por IP.
- **IA** (`/api/ai/*`): 20 peticiones / minuto por IP (protección de coste del modelo).

Cuando se supera el límite se responde `429` con cabecera `Retry-After`.

**Limitación conocida**: el estado vive en memoria de la instancia. Con varias instancias (o reinicios en frío) el límite se aplica por instancia, no globalmente. Para una app personal de una sola instancia es suficiente; un límite distribuido requeriría Redis.

## Copias de seguridad

`pnpm backup` ejecuta `scripts/backup-db.mjs`, que crea una copia con marca de tiempo en `backups/` y conserva los últimos 14 (configurable con `BACKUP_KEEP`).

- **PostgreSQL**: con `DATABASE_URL` definido, ejecuta `pg_dump --no-owner --clean`. Requiere el binario `pg_dump` disponible.

Estrategia recomendada en Railway:

1. Usar los backups nativos de Railway para el servicio PostgreSQL (Point-in-Time Recovery).
2. O bien programar `pnpm backup` como tarea programada (Scheduled Job) en Railway y guardar el artefacto en un volumen o bucket.

## Monitorización y alertas

`/api/health` devuelve `{ "status": "ok", "service": "vitaquest" }` y es el endpoint que Railway usa como health check.

Para detección de caídas se recomienda **UptimeRobot**:

1. Crear un monitor HTTP(s) apuntando a la URL pública + `/api/health`.
2. Configurar un intervalo de 5 minutos y alerta por correo/telegram.

La ruta `/api/health` está exenta de autenticación y de rate limiting (ver `middleware.ts`), de modo que el monitor no consume cupo ni falla por la cookie de sesión.

## Entorno de staging

Railway separa entornos del mismo proyecto:

```bash
railway environment create staging
railway up --environment staging
```

Recomendaciones:

- Mantener bases de datos y secretos independientes entre `staging` y `production`.
- Desplegar staging solo por `workflow_dispatch` (deploy.yml), nunca automáticamente desde `main`.
- Verificar en staging antes de promover a producción.

## Secretos necesarios

- `VITAQUEST_ACCESS_KEY`, `VITAQUEST_PROFILE_ID`, `VITAQUEST_DISPLAY_NAME`.
- `VITAQUEST_AI_API_KEY` y `VITAQUEST_AI_MODEL` (para la función inteligente).
- `DATABASE_URL` (PostgreSQL, en todos los entornos).
- `RAILWAY_TOKEN` (solo en el repositorio, para el workflow de despliegue).
