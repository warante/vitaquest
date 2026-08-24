# Desglose por Roles del Equipo

## Visión general de roles necesarios

Para ejecutar el plan completo de Metabolic Quest, se necesitan las siguientes competencias. En un equipo personal/unipersonal, una persona puede asumir múltiples roles.

---

## Product Owner (PO)

### Responsabilidades
- Definir visión y objetivos del producto
- Priorizar backlog de funcionalidades
- Decidir qué se incluye en cada fase
- Validar que el producto cumple los principios (no clínico, no castiga, motiva)
- Gestionar el alcance vs. tiempo disponible

### Decisiones clave pendientes
1. ¿Se renombra el producto a "Metabolic Quest" o se mantiene "VitaQuest"?
2. ¿Se abre a más usuarios o sigue siendo personal?
3. ¿Qué proveedor de IA se usa para insights?
4. ¿Qué APIs de salud tiene disponibles el usuario?
5. ¿Se implementa sistema de energía/vida en gamificación?
6. ¿Cuál es el presupuesto mensual máximo para infraestructura + APIs?

### Entregables
- Roadmap priorizado (este documento)
- Criterios de aceptación por fase
- Decisiones documentadas en `docs/DECISIONS.md`

---

## Business Analyst (BA)

### Responsabilidades
- Traducir requisitos de negocio en especificaciones técnicas
- Definir reglas de negocio (cálculo de XP, rachas, tendencias)
- Documentar flujos de usuario
- Validar que las funcionalidades cumplen los principios del producto
- Gestionar el banco de sustituciones de comidas y recetas

### Tareas específicas
- Definir reglas de contexto para métricas de salud (Fase 6.5)
- Diseñar flujos de sustitución de comidas (Fase 5.6)
- Especificar reglas de generación de retos adaptativos (Fase 10.2)
- Documentar flujos de integración con APIs externas (Fase 9)
- Crear contenido de recetas y banco de alimentos (Mejora B.1)

### Entregables
- Especificaciones funcionales por tarea
- Reglas de negocio documentadas
- Flujos de usuario (pueden ser diagramas simples)

---

## Project Manager (PM)

### Responsabilidades
- Planificar sprints y entregas
- Gestionar dependencias entre tareas
- Trackear progreso y bloqueos
- Coordinar roles (si hay más de una persona)
- Gestionar riesgos y mitigaciones

### Plan de fases sugerido

| Sprint | Duración | Fases | Objetivo |
|--------|----------|-------|----------|
| 1 | 2 semanas | 5 (Rediseño) | Nueva interfaz Metabolic Quest |
| 2 | 2 semanas | 6 (Métricas) + 7 (Diario) | Analíticas + entrenamiento |
| 3 | 2 semanas | 8 (IA) + 10 (Gamificación) | Insights + motivación |
| 4 | 2 semanas | 9 (Integraciones) + 11 (UX) | Conectores + móvil |
| 5 | 1 semana | 12 (DevOps) | Infraestructura profesional |
| 6+ | Continuo | Mejoras sugeridas | Iteración basada en uso |

### Entregables
- Plan de sprints
- Reporte de progreso semanal
- Gestión de riesgos actualizada

---

## Frontend Developer

### Responsabilidades
- Implementar componentes React/Next.js
- Sistema de diseño y tokens CSS
- Navegación y routing
- Formularios y validación cliente
- Animaciones y microinteracciones
- PWA y service worker
- Accesibilidad

### Habilidades necesarias
- React 19, Next.js App Router
- TypeScript estricto
- CSS custom properties, responsive design
- SVG para gráficos y anillos de progreso
- PWA, service workers, offline
- Testing con Playwright

### Tareas principales
- Fases 5, 7.3-7.7, 8.4, 10.3-10.6, 11 (completa)
- Componentes: QuestBanner, ProgressRing, MetricCard, MissionCard, MealBlock, WeeklyMap, etc.

---

## Backend Developer

### Responsabilidades
- Esquema de base de datos y migraciones
- Endpoints API REST
- Validación con Zod
- Integración con servicios externos (IA, wearables)
- Lógica de negocio (gamificación, tendencias, insights)

### Habilidades necesarias
- PostgreSQL, Drizzle ORM
- Node.js, Next.js API routes
- Zod validation
- OAuth 2.0 (para integraciones)
- APIs de IA (OpenAI, Anthropic, etc.)

### Tareas principales
- Fases 6.1, 7.1-7.2, 8.1-8.3, 8.5-8.6, 9 (completa)
- Tablas: metabolic_markers, training_sessions, exercise_entries, exercise_sets, exercise_library, custom_challenges

---

## UX/UI Designer

### Responsabilidades
- Sistema de diseño (tokens, componentes, patrones)
- Diseño de pantallas y flujos
- Prototipos interactivos (si es necesario)
- Validación de usabilidad
- Accesibilidad visual

### Habilidades necesarias
- Diseño mobile-first
- Sistemas de diseño escalables
- Conocimiento de HIG (Apple) y Material Design (Google)
- Herramientas: Figma, o directamente en CSS

### Tareas principales
- Fase 5.1 (tokens), 5.2 (banner), 5.8-5.9 (semana), 10.6 (personalización), 11.1-11.2 (navegación móvil)
- Diseño de iconos para logros y métricas
- Animaciones y transiciones

---

## QA Engineer

### Responsabilidades
- Plan de tests por fase
- Tests E2E con Playwright
- Testing de accesibilidad
- Performance testing móvil
- Regression testing
- QA de integraciones externas

### Habilidades necesarias
- Playwright
- Lighthouse CI
- Testing en dispositivos reales (BrowserStack o físicos)
- Accessibility auditing (axe, WAVE)

### Tareas principales
- Tests E2E para cada fase
- QA calendar script existente → expandir
- Performance budgets
- Accessibility audits
- Cross-browser testing

---

## DevOps Engineer

### Responsabilidades
- CI/CD pipelines
- Infraestructura Railway
- Backups y disaster recovery
- Monitoring y alertas
- Seguridad (headers, rate limiting, CORS)
- Gestión de costes

### Habilidades necesarias
- GitHub Actions
- Railway platform
- PostgreSQL administration
- Docker (si aplica)
- Security best practices

### Tareas principales
- Fase 12 (completa)
- Configuración de Railway para nuevos servicios
- Backups automatizados
- Monitoring setup

---

## AI Engineer (rol especializado)

### Responsabilidades
- Integración con APIs de IA
- Diseño de prompts y contextos
- Sistema de insights automáticos
- Detección de patrones y anomalías
- Evaluación de calidad de respuestas

### Habilidades necesarias
- APIs de LLMs (OpenAI, Anthropic, Google)
- Prompt engineering
- RAG (Retrieval Augmented Generation) si aplica
- Evaluación de modelos
- Ética de IA en salud

### Tareas principales
- Fase 8 (completa)
- System prompts y templates de contexto
- Sistema de fallback rule-based
- Evaluación y mejora continua de respuestas

---

## Data Analyst

### Responsabilidades
- Cálculo de tendencias y correlaciones
- Visualización de datos (gráficos, sparklines)
- Modelos de predicción simples
- Informes y dashboards

### Habilidades necesarias
- Estadística descriptiva
- Visualización de datos (D3, Chart.js, o SVG custom)
- SQL para queries analíticos
- Python/R para análisis (si se necesita fuera de la app)

### Tareas principales
- Fase 6.3 (tendencias), 6.6 (gráficos), 7.4 (progresión), D.1 (correlaciones)
- Sparklines en tarjetas de métricas
- Gráficos de progresión de entrenamiento
- Resumen semanal con barras de progreso

---

## Medical Advisor (consulta externa)

### Responsabilidades
- Revisar textos interpretativos de métricas de salud
- Validar que no se dan diagnósticos ni recomendaciones clínicas
- Revisar rangos de referencia usados
- Aprobar disclaimers legales

### Habilidades necesarias
- Conocimiento de salud metabólica
- Experiencia en comunicación de salud al público general
- Conocimiento de regulaciones (GDPR, LOPDGDD para datos de salud)

### Tareas principales
- Revisión de Fase 6.5 (contexto interpretativo)
- Revisión de Fase 8.2 (prompts de IA)
- Revisión de disclaimers legales
- Consulta puntual en dudas de contenido de salud

---

## Resumen de asignación por fase

| Fase | Roles principales | Roles secundarios |
|------|------------------|-------------------|
| 5. Rediseño | Frontend, UX/UI | BA, QA |
| 6. Métricas | Backend, Frontend, Data Analyst | Medical Advisor, BA |
| 7. Diario | Backend, Frontend | BA, UX/UI |
| 8. IA | AI Engineer, Backend | Frontend, Medical Advisor, Legal |
| 9. Integraciones | Backend, DevOps | BA, QA |
| 10. Gamificación | Game Designer, Backend, Frontend | BA, UX/UI |
| 11. UX Móvil | Frontend, UX/UI | QA, DevOps |
| 12. DevOps | DevOps | Backend, DBA |

---

## Equipo mínimo viable (unipersonal)

Si una sola persona ejecuta todo el plan, el orden de prioridad de habilidades es:

1. **Frontend Dev** (la mayor parte del trabajo es UI)
2. **Backend Dev** (APIs, DB, integraciones)
3. **UX/UI Designer** (diseño mobile-first)
4. **DevOps** (CI/CD, infraestructura)
5. **QA** (testing, accesibilidad)
6. **AI Engineer** (solo para Fase 8)
7. **Medical Advisor** (consulta puntual, no dedicada)
