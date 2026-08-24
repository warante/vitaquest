# Resumen Ejecutivo - Plan VitaQuest

## Decisiones confirmadas (2026-08-23)

1. **Nombre del producto**: VitaQuest (se mantiene, no se renombra a "Metabolic Quest")
2. **Alcance**: Uso personal (no multi-usuario)
3. **IA**: Modelo local compatible con API OpenAI (configuración pendiente)
4. **APIs de salud**: Ninguna disponible de momento → Fase 9 pospuesta

## Estado actual vs. Diseño propuesto

### Lo que ya existe (Fases 0-4 completadas)
✅ Dashboard diario "Hoy" con acciones interactivas
✅ Navegación entre 6 secciones (Hoy, Plan, Retos, Progreso, Analíticas, Perfil)
✅ Persistencia PostgreSQL + Drizzle (2 migraciones)
✅ Autenticación por clave de acceso
✅ PWA instalable con service worker
✅ Gamificación básica (XP, rachas, insignias)
✅ Programa de 12 semanas
✅ Recordatorios locales
✅ Exportación JSON
✅ 15 tests pasando

### Lo que falta (del diseño propuesto)
❌ Rediseño visual completo (dark mode, verde esmeralda)
 Anillo de progreso circular en header
❌ Tarjetas de métricas de salud en header
❌ Navegación consolidada a 5 tabs
❌ Selector de día de la semana (pills)
 Sistema de misiones con checkboxes y XP
❌ Comidas del día con botón "Cambiar"
 Mapa semanal con scroll horizontal
❌ Regla visual del plato
❌ Retos semanales con botón "Conseguido"
❌ Logros visuales con iconos
❌ Resumen semanal con barras de progreso
❌ Pantalla de Ajustes con objetivos personalizables
❌ Footer legal con disclaimer médico

### Lo que se propone añadir (mejoras adicionales)
💡 Diario de entrenamiento completo (ejercicios, series, reps, pesos)
💡 Función inteligente con IA local (insights, chat, detección de patrones)
💡 Gamificación avanzada (niveles, retos adaptativos, rachas por categoría)
💡 Registro de ánimo, energía y sueño
💡 Banco de recetas y lista de la compra
💡 Informe mensual PDF para el médico
💡 Y 20+ mejoras más detalladas en MEJORAS-SUGERIDAS.md

### ⚠️ Pos puesto (sin APIs disponibles)
⏸️ Integraciones con wearables (Garmin, Fitbit, Health Connect)
⏸️ Sync automático de analíticas desde laboratorios
⏸️ Integraciones con apps de nutrición

---

## Plan de fases resumido

| Fase | Nombre | Duración estimada | Prioridad |
|------|--------|-------------------|-----------|
| **5** | Rediseño visual completo | 3-4 semanas | 🔴 Alta |
| **6** | Métricas de salud metabólica | 2-3 semanas | 🔴 Alta |
| **7** | Diario de entrenamiento | 3-4 semanas | 🔴 Alta |
| **8** | Función inteligente (IA local) | 2-3 semanas | 🟡 Media |
| **9** | Integraciones externas | **POSPUESTO** | ⚪ Baja |
| **10** | Gamificación avanzada | 2-3 semanas | 🟡 Media |
| **11** | Mejoras UX/UI móvil | 3-4 semanas | 🔴 Alta |
| **12** | DevOps e infraestructura | 1-2 semanas | 🟡 Media |

**Total estimado: 16-23 semanas (4-5.5 meses)** - Fase 9 excluida

---

## Decisiones confirmadas ✅

1. **Nombre del producto**: VitaQuest (se mantiene)
2. **Alcance de usuarios**: Personal (no multi-usuario)
3. **Proveedor de IA**: Modelo local compatible con API OpenAI (configuración pendiente)
4. **APIs disponibles**: Ninguna de momento → Fase 9 pospuesta
5. **Presupuesto**: $0/mes en APIs (modelo local + infraestructura existente)
6. **Gamificación**: Pendiente de decidir (ver Fase 10.7)

---

## Riesgos principales

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Limitaciones de PWA para APIs de salud nativas | Media | Medio | Investigar TWA/Capacitor cuando haya APIs disponibles |
| Hardware para modelo local | Media | Medio | Requiere GPU/CPU potente, pero ya lo tiene el usuario |
| Calidad del modelo local | Media | Alto | Fallback rule-based si el modelo no da buenos resultados |
| Privacidad de datos de salud | Baja | Alto | Modelo local = datos nunca salen del entorno |
| Scope creep (añadir demasiadas funcionalidades) | Alta | Medio | Priorización estricta, MVP por fase |

---

## Primeros pasos recomendados

1. **Reunión de alineación** (1h): Revisar este plan con el PO, resolver decisiones pendientes
2. **Fase 5 - Rediseño** (3-4 semanas): Es la base visual sobre la que se construye todo
3. **Fase 6 - Métricas** (2-3 semanas): Paralelizable con el final de la Fase 5
4. **Fase 7 - Diario** (3-4 semanas): Independiente, se puede empezar pronto
5. **Fase 11 - UX Móvil** (paralelo): Mejoras de UX se pueden ir haciendo incrementalmente

---

## Documentos del plan

- [README.md](./README.md) - Visión general y índice
- [FASE-5-redesign.md](./FASE-5-redesign.md) - Rediseño visual completo
- [FASE-6-metricas-salud.md](./FASE-6-metricas-salud.md) - Métricas de salud metabólica
- [FASE-7-diario-entrenamiento.md](./FASE-7-diario-entrenamiento.md) - Diario de entrenamiento
- [FASE-8-ia-insights.md](./FASE-8-ia-insights.md) - Función inteligente IA
- [FASE-9-integraciones.md](./FASE-9-integraciones.md) - Integraciones externas
- [FASE-10-gamificacion-avanzada.md](./FASE-10-gamificacion-avanzada.md) - Gamificación avanzada
- [FASE-11-mejoras-ux.md](./FASE-11-mejoras-ux.md) - Mejoras UX/UI móvil
- [FASE-12-devops-infra.md](./FASE-12-devops-infra.md) - DevOps e infraestructura
- [MEJORAS-SUGERIDAS.md](./MEJORAS-SUGERIDAS.md) - Mejuras y sugerencias adicionales
- [ROLES-RESPONSABILIDADES.md](./ROLES-RESPONSABILIDADES.md) - Desglose por roles

---

## Nota sobre APIs de datos de salud

**Estado actual**: El usuario confirmó que no tiene APIs de datos de salud disponibles de momento.

**Implicaciones**:
- Fase 9 (Integraciones) queda **POSPUESTA** hasta que haya APIs disponibles
- El registro de métricas de salud será manual (Fase 6)
- La IA local trabajará con los datos registrados manualmente (Fase 8)
- Cuando el usuario tenga APIs disponibles, se reactivará la Fase 9

**Configuración pendiente para Fase 8 (IA)**:
- URL del endpoint del modelo local
- API key (si aplica)
- Nombre del modelo
- Capacidades (context window, etc.)

El usuario facilitará esta configuración cuando se vaya a implementar la Fase 8.
