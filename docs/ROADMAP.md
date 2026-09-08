# Roadmap

## Fase 0: base del proyecto

- [x] Crear repositorio y contexto persistente.
- [x] Crear panel inicial `Hoy`.
- [x] Añadir health check.
- [x] Añadir configuración estricta y documentación de despliegue.

## Fase 1: experiencia local

- [x] Convertir acciones del día en estado interactivo.
- [x] Añadir navegación entre Hoy, Plan, Retos, Progreso, Analíticas y Perfil.
- [x] Añadir calendario visual y resumen semanal con datos locales.
- [x] Añadir pruebas de las reglas de XP, rachas e insignias.

## Fase 2: persistencia

- [x] Crear PostgreSQL.
- [x] Definir esquema Drizzle y migraciones.
- [x] Preparar endpoints para guardar acciones, comidas, entrenamientos y analíticas.
- [x] Autenticación de acceso privado (uso personal; sin multi-usuario).

## Fase 3: producto móvil

- [x] Convertir la aplicación en PWA.
- [x] Mejorar estados vacíos, accesibilidad y responsive.
- [x] Añadir exportación de datos.

## Fase 4: evolución

- [x] Recordatorios configurables en el dispositivo.
- [x] Objetivos por fases de 12 semanas.
- [x] Más logros y visualizaciones de progreso.

## Fase 5: rediseño visual

- [x] Migrar al nuevo diseño visual (dark mode, verde esmeralda)
- [x] Anillo de progreso circular en header
- [x] Tarjetas de métricas de salud en header (con datos reales de la Fase 6)
- [x] Navegación consolidada a 5 tabs (Hoy, Semana, Retos, Progreso, Ajustes)
- [x] Selector de día de la semana (pills Lun-Dom)
- [x] Sistema de misiones con checkboxes y XP
- [x] Comidas del día con botón "Cambiar"
- [x] Mapa semanal con scroll horizontal
- [x] Regla visual del plato
- [x] Retos semanales con botón "Conseguido"
- [x] Logros visuales con iconos
- [x] Resumen semanal con barras de progreso
- [x] Pantalla de Ajustes con objetivos personalizables
- [x] Footer legal con disclaimer médico

## Fase 6: métricas de salud metabólica

- [x] Almacenamiento en la tabla existente `lab_records` (sin tabla nueva)
- [x] Componente `MetricCard` con contexto interpretativo
- [x] Histórico y tendencias con sparklines
- [x] Registro de nuevas métricas
- [x] Integración con pantalla de Progreso (gráficos de evolución + exportación JSON)

## Fase 7: diario de entrenamiento

- [x] Tablas `training_sessions`, `exercise_entries`, `exercise_sets`
- [x] Biblioteca de ejercicios con autocomplete (constante, sin tabla)
- [x] Formulario de registro de sesión (ejercicios, series, reps, pesos)
- [x] Histórico de progresión por ejercicio (gráfico de línea + indicador de avance)
- [x] Cálculo de PRs (1RM estimado, fórmula de Epley)
- [x] Integración con plan semanal (registrar desde el mapa, prefill y sugerencias)
- [x] Sensaciones y notas post-entrenamiento
- [x] Resumen semanal de entrenamiento y exportación JSON

## Fase 8: función inteligente (IA local)

- [x] Cliente OpenAI compatible con modelo local
- [x] Sistema de prompts para insights de salud
- [x] Insights automáticos semanales
- [x] Chat de salud (Q&A sobre datos del usuario)
- [x] Detección de anomalías
- [x] Sistema rule-based de fallback
- [x] Configuración de modelo local en Ajustes

## Fase 9: integraciones externas ⚠️ POSPUESTO

- [ ] (Pendiente de APIs disponibles)
- [ ] Garmin Connect, Fitbit, Health Connect
- [ ] APIs de laboratorios/analíticas
- [ ] Integración con calendario

## Fase 10: gamificación avanzada

- [x] Sistema de niveles expandido con curva de progresión
- [x] Misión especial del día (bonus XP, rotatoria)
- [x] Multiplicador de XP por racha (x1 → x2,5)
- [x] Logros expandidos con rareza
- [x] Temas cosméticos por nivel (verde/azul/púrpura/dorado)
- [x] Rachas por categoría (pasos, fuerza, fibra)
- [x] Eventos temporales y retos adaptativos completos

## Fase 11: mejoras UX/UI móvil

- [x] Bottom navigation bar en móvil
- [x] Interacciones táctiles optimizadas (≥44px targets)
- [x] Formularios mobile-first (teclado numérico, date pickers)
- [x] Rendimiento: code splitting, lazy loading, <3s en 4G
- [x] Offline: cache de datos esenciales, queue de acciones
- [x] Accesibilidad: Lighthouse score ≥95, screen readers
- [x] Animaciones y microinteracciones sutiles

## Fase 12: DevOps e infraestructura

- [x] CI/CD con GitHub Actions
- [x] Backups automáticos de PostgreSQL (script SQLite/`pg_dump`)
- [x] Monitoring y alertas (UptimeRobot, documentado)
- [x] Headers de seguridad y rate limiting
- [x] Entorno de staging
- [x] Documentación técnica actualizada

## Fase 13: Migración a local-first

- [x] Migrar de Next.js a Vite + React SPA
- [x] Reemplazar PostgreSQL/Drizzle con Dexie.js (IndexedDB)
- [x] Eliminar API routes, autenticación y servidor
- [x] Configurar PWA con vite-plugin-pwa
- [x] Implementar import/export JSON completo de datos
- [x] Configurar deploy a GitHub Pages con GitHub Actions
- [x] Limpieza de código heredado (Drizzle, middleware, scripts de backup)
- [x] Actualizar documentación técnica
