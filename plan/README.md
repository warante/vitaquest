# Plan de Evolución VitaQuest

## Visión

Evolucionar VitaQuest de un tracker de hábitos a una aplicación móvil-first de seguimiento de salud metabólica con gamificación, diario de entrenamiento, insights inteligentes (IA local) e integraciones con wearables (futuro).

## Contexto

El proyecto actual tiene las fases 0-4 completadas: dashboard diario, navegación, persistencia PostgreSQL + Drizzle, autenticación por clave, PWA, gamificación básica (XP, rachas, insignias), programa de 12 semanas, recordatorios locales y exportación JSON.

El nuevo diseño propone un rebranding a "Metabolic Quest" con foco en salud metabólica, tarjetas de analíticas en el header, anillo de progreso circular, sistema de misiones diarias, comidas editables con botón "Cambiar", mapa semanal, retos semanales con logros, resumen de progreso y personalización de objetivos.

## Fases planificadas

| Fase | Nombre | Descripción | Prioridad |
|------|--------|-------------|-----------|
| 5 | Rediseño visual completo | Migrar al nuevo diseño (manteniendo nombre VitaQuest) | Alta |
| 6 | Métricas de salud metabólica | Tarjetas de analíticas con contexto | Alta |
| 7 | Diario de entrenamiento | Registro de ejercicios, series, reps y pesos | Alta |
| 8 | Función inteligente (IA local) | Insights con modelo local compatible OpenAI | Media |
| 9 | Integraciones externas | **POSPUESTO** - Sin APIs disponibles de momento | Baja |
| 10 | Gamificación avanzada | Retos, logros, niveles | Media |
| 11 | Mejoras UX/UI móvil | Optimización mobile-first | Alta |
| 12 | DevOps e infraestructura | CI/CD, monitoring, backups | Media |

## Documentos del plan

- [FASE-5 Rediseño visual](./FASE-5-redesign.md)
- [FASE-6 Métricas de salud](./FASE-6-metricas-salud.md)
- [FASE-7 Diario de entrenamiento](./FASE-7-diario-entrenamiento.md)
- [FASE-8 Función inteligente IA](./FASE-8-ia-insights.md)
- [FASE-9 Integraciones externas](./FASE-9-integraciones.md)
- [FASE-10 Gamificación avanzada](./FASE-10-gamificacion-avanzada.md)
- [FASE-11 Mejoras UX/UI móvil](./FASE-11-mejoras-ux.md)
- [FASE-12 DevOps e infraestructura](./FASE-12-devops-infra.md)
- [Mejoras y sugerencias adicionales](./MEJORAS-SUGERIDAS.md)
- [Desglose por roles del equipo](./ROLES-RESPONSABILIDADES.md)

## Criterios de éxito globales

- La app funciona fluidamente en móvil (375px+) con navegación táctil intuitiva
- El usuario puede registrar analíticas, entrenamientos y comidas en < 30 segundos
- El sistema de gamificación motiva sin generar ansiedad por la perfección
- Los datos de salud se tratan con privacidad y sin interpretaciones clínicas
- La app es instalable como PWA y funciona offline para consulta básica
