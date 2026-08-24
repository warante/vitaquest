# Fase 12: DevOps e Infraestructura

## Objetivo

Profesionalizar la infraestructura, CI/CD, monitoring y seguridad de Metabolic Quest para soportar el crecimiento de funcionalidades y garantizar disponibilidad y privacidad de los datos de salud.

## Análisis

Actualmente el proyecto está preparado para Railway con:
- `railway.json` con build Nixpacks y healthcheck
- Migraciones Drizzle pre-deploy
- Variable `DATABASE_URL` para PostgreSQL
- Autenticación por clave de acceso

Necesidades futuras:
- CI/CD automatizado con GitHub Actions
- Backups de base de datos
- Monitoring y alertas
- Seguridad reforzada para datos de salud
- Escalabilidad si se abre a más usuarios

## Tareas

### 12.1 CI/CD con GitHub Actions

- [ ] **12.1.1** Crear workflow de CI en `.github/workflows/ci.yml`:
  - Trigger: push a main, PRs a main
  - Jobs:
    - `lint`: `pnpm lint`
    - `typecheck`: `pnpm typecheck`
    - `test`: `pnpm test`
    - `build`: `pnpm build`
    - `qa:calendar`: `pnpm qa:calendar` (si hay navegador disponible)
  - Fail fast: si cualquier job falla, el resto se cancela
- [ ] **12.1.2** Crear workflow de deploy en `.github/workflows/deploy.yml`:
  - Trigger: push a main (solo si CI pasa)
  - Deploy a Railway vía `railway up` o API de Railway
  - Health check post-deploy
  - Rollback automático si health check falla
- [ ] **12.1.3** Crear workflow de migraciones en `.github/workflows/migrate.yml`:
  - Trigger: manual o al detectar cambios en `drizzle/`
  - Ejecuta `pnpm db:migrate` en entorno de staging primero
  - Requiere aprobación manual para producción
- [ ] **12.1.4** Badges de CI en README.md
- [ ] **12.1.5** Protección de rama main: requerir CI passing antes de merge

**Rol:** DevOps
**Estimación:** 2-3 días
**Dependencias:** Proyecto GitHub existente
**Riesgo:** Bajo

### 12.2 Backups de base de datos

- [ ] **12.2.1** Configurar backups automáticos de PostgreSQL en Railway:
  - Railway ofrece backups automáticos (ver plan)
  - Si no, configurar pg_dump cron job
- [ ] **12.2.2** Backup diario a almacenamiento externo (S3, Backblaze B2):
  - Script de backup: `pg_dump` → compress → upload
  - Retención: 30 días de backups diarios, 12 meses de backups mensuales
- [ ] **12.2.3** Procedimiento de restore documentado:
  - Cómo restaurar desde backup
  - Tiempo estimado de restore (RTO)
  - Punto de recuperación (RPO): máximo 24h de pérdida de datos
- [ ] **12.2.4** Test de restore trimestral (verificar que los backups son válidos)
- [ ] **12.2.5** Alerta si un backup falla (email o notificación)

**Rol:** DevOps + DBA
**Estimación:** 2 días
**Dependencias:** Acceso a Railway, cuenta de almacenamiento
**Riesgo:** Bajo

### 12.3 Monitoring y alertas

- [ ] **12.3.1** Health check endpoint existente (`/api/health`) → integrar con monitoring:
  - UptimeRobot (gratis, 50 monitors)
  - Better Stack (alternativa)
  - Railway tiene monitoring básico incluido
- [ ] **12.3.2** Logs centralizados:
  - Railway tiene logs en tiempo real
  - Considerar servicio externo (Logtail, Better Stack) para retención larga
- [ ] **12.3.3** Métricas de aplicación:
  - Tiempo de respuesta de endpoints
  - Tasa de errores (5xx, 4xx)
  - Uso de base de datos (conexiones, queries lentas)
- [ ] **12.3.4** Alertas configuradas:
  - Downtime > 1 minuto
  - Error rate > 5% en 5 minutos
  - Base de datos no disponible
  - Disco lleno (si aplica)
- [ ] **12.3.5** Dashboard de monitoring accesible (Grafana si se usa stack completo)

**Rol:** DevOps
**Estimación:** 2-3 días
**Dependencias:** Servicio de monitoring elegido
**Riesgo:** Bajo

### 12.4 Seguridad reforzada

- [ ] **12.4.1** HTTPS forzado (Railway lo hace automáticamente)
- [ ] **12.4.2** Headers de seguridad:
  - `Strict-Transport-Security` (HSTS)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy` (restrictivo para PWA)
  - `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] **12.4.3** Rate limiting en endpoints de API:
  - `/api/dashboard`: 60 req/min
  - `/api/meals`, `/api/workouts`, `/api/labs`: 30 req/min
  - `/api/auth/login`: 5 req/min (prevenir brute force)
- [ ] **12.4.4** Sanitización de inputs: ya se hace con Zod, verificar que cubre todos los endpoints
- [ ] **12.4.5** CORS restrictivo: solo permitir origen de la app
- [ ] **12.4.6** Variables de entorno sensibles nunca en logs ni errores
- [ ] **12.4.7** Dependencias: `pnpm audit` en CI, actualizaciones de seguridad automáticas (Dependabot)
- [ ] **12.4.8** Cifrado de datos de salud en reposo (fase posterior, requiere cambio de DB o column-level encryption)

**Rol:** DevOps + Security Engineer
**Estimación:** 2-3 días
**Dependencias:** Next.js middleware existente
**Riesgo:** Bajo

### 12.5 Entornos (staging + production)

- [ ] **12.5.1** Crear entorno de staging en Railway:
  - Proyecto separado o servicio separado
  - Base de datos de staging (datos de prueba)
  - Variables de entorno de staging
- [ ] **12.5.2** Workflow de deploy:
  - PR → deploy automático a staging
  - Merge a main → deploy a production (con aprobación)
- [ ] **12.5.3** Datos de prueba realistas en staging:
  - Script de seed con datos de ejemplo
  - Perfil de prueba con métricas, entrenamientos, comidas
- [ ] **12.5.4** Feature flags para desplegar funcionalidades gradualmente:
  - Sistema simple con variables de entorno
  - Ej: `ENABLE_AI_INSIGHTS=true/false`

**Rol:** DevOps
**Estimación:** 2 días
**Dependencias:** Cuenta Railway con capacidad para múltiples servicios
**Riesgo:** Bajo

### 12.6 Escalabilidad (preparación para multi-usuario)

- [ ] **12.6.1** Revisar arquitectura actual para identificar cuellos de botella:
  - Base de datos: índices, queries lentas
  - API: estado compartido, rate limits
  - Frontend: bundle size, code splitting
- [ ] **12.6.2** Preparar autenticación multi-usuario (actualmente es perfil único con clave):
  - Sistema de usuarios con email/password o OAuth
  - Sesiones JWT o cookies seguras
  - Aislamiento de datos por usuario (row-level security en PostgreSQL)
- [ ] **12.6.3** Plan de escalado de base de datos:
  - Connection pooling (PgBouncer)
  - Read replicas si el tráfico lo requiere
  - Archiving de datos antiguos (métricas > 2 años)
- [ ] **12.6.4** CDN para assets estáticos (Next.js ya lo hace con Vercel/Railway)

**Rol:** DevOps + Backend Dev + DBA
**Estimación:** 3-5 días
**Dependencias:** Decisión de abrir a más usuarios
**Riesgo:** Medio

### 12.7 Documentación técnica

- [ ] **12.7.1** Documentación de arquitectura actualizada (ARCHITECTURE.md)
- [ ] **12.7.2** Runbook de operaciones:
  - Cómo hacer deploy manual
  - Cómo hacer rollback
  - Cómo restaurar backup
  - Cómo escalar recursos
- [ ] **12.7.3** Documentación de API (endpoints, schemas, ejemplos)
- [ ] **12.7.4** Diagrama de arquitectura (puede ser simple, en docs/)
- [ ] **12.7.5** Changelog mantenido (CHANGELOG.md o releases de GitHub)

**Rol:** DevOps + Technical Writer
**Estimación:** 1-2 días
**Dependencias:** Ninguna
**Riesgo:** Bajo

### 12.8 Costes y optimización

- [ ] **12.8.1** Revisar costes actuales de Railway:
  - Servicio web: ~$5/mes (plan Hobby)
  - PostgreSQL: ~$5/mes (plan Hobby)
  - Total actual: ~$10/mes
- [ ] **12.8.2** Proyección de costes con nuevas funcionalidades:
  - IA API: ~$5/mes (uso personal)
  - Backups storage: ~$1/mes
  - Monitoring: gratis (UptimeRobot free tier)
  - Total estimado: ~$16-20/mes
- [ ] **12.8.3** Optimizaciones para reducir costes:
  - Cache de respuestas de IA
  - Sleep de servicios en horas de no uso (si Railway lo permite)
  - Plan anual si hay descuento

**Rol:** DevOps + PO
**Estimación:** 0.5 días
**Dependencias:** Acceso a facturas de Railway
**Riesgo:** Bajo

## Criterios de aceptación

- [ ] CI pasa en cada push y PR
- [ ] Deploy a production es automático tras merge a main
- [ ] Backups se ejecutan diariamente y se verifican trimestralmente
- [ ] Monitoring alerta de downtime en < 2 minutos
- [ ] Headers de seguridad están configurados
- [ ] Rate limiting protege los endpoints
- [ ] Entorno de staging existe y tiene datos de prueba
- [ ] Documentación de operaciones está actualizada
- [ ] Costes mensuales son predecibles y < $25/mes
