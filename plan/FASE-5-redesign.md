# Fase 5: Rediseño Visual Completo → Metabolic Quest

## Objetivo

Migrar la interfaz actual al diseño mostrado en las 6 imágenes de referencia, manteniendo el nombre **VitaQuest**. Esto implica cambios visuales profundos y reestructuración de la navegación.

## Análisis: Diseño vs. Implementación actual

| Elemento | Diseño propuesto | Estado actual |
|----------|-----------------|---------------|
| Nombre | "VitaQuest" (se mantiene) | "VitaQuest" |
| Header | Banner verde con título + descripción + anillo circular XP | Simple con título |
| Métricas salud | 4 tarjetas (Triglicéridos, Resistencia Insulínica, Índice Hígado Graso, ALT/GPT) | No existen en header |
| Navegación | 5 tabs: Hoy, Semana, Retos, Progreso, Ajustes | 6 tabs: Hoy, Plan, Retos, Progreso, Analíticas, Perfil |
| Selector día | Pills Lun-Dom con día activo resaltado | CalendarStrip horizontal |
| Misiones | Checkboxes con XP (+10 XP), subtítulo descriptivo | ActionCards con botón toggle |
| Comidas | 4 bloques (Desayuno, Comida, Merienda, Cena) + botón "Cambiar" | No existe en pantalla Hoy |
| Actividad del día | Bloque destacado (Cardio Z2, Descanso activo) | Integrado en acciones |
| Mapa semanal | Scroll horizontal con tarjetas por día | No existe |
| Regla del plato | Visual ½ verduras, ¼ proteína, ¼ hidrato | No existe |
| Retos semanales | Lista con botón "Conseguido" + retos propios | Retos estáticos |
| Logros | Grid de insignias con iconos | Lista de achievements |
| Resumen semanal | Barras de progreso por categoría | WeeklyBars simple |
| Objetivo 12 semanas | 3 fases con descripción | EvolutionPanel básico |
| Ajustes | Formulario de objetivos personalizables | No existe pantalla dedicada |
| Footer legal | Disclaimer médico en todas las pantallas | No existe |
| Tema visual | Dark mode con verde esmeralda | Light mode con verde menta |

## Tareas

### 5.1 Sistema de diseño y tokens

- [ ] **5.1.1** Crear nuevo sistema de tokens CSS para dark mode
  - Fondo principal: `#0d1117` o similar (dark)
  - Superficies: `#161b22`, `#1c2333`
  - Verde primario: `#2d6a4f` → `#40916c` (gradiente esmeralda)
  - Verde acento: `#52b788`
  - Texto primario: `#e6edf3`
  - Texto secundario: `#8b949e`
  - Bordes: `#30363d`
  - Naranja recompensa: `#f0883e`
  - Rojo alerta: `#f85149`
- [ ] **5.1.2** Definir tipografía: títulos bold, cuerpo regular, etiquetas uppercase small
- [ ] **5.1.3** Crear sistema de radios: cards 16px, pills 24px, botones 12px
- [ ] **5.1.4** Definir espaciado mobile-first: base 8px, gaps 12-16px
- [ ] **5.1.5** Crear sistema de iconos (emoji o SVG inline para mantener ligereza)

**Rol:** UX/UI Designer + Frontend Dev
**Estimación:** 2-3 días
**Dependencias:** Ninguna
**Riesgo:** Bajo

### 5.2 Header y banner principal

- [ ] **5.2.1** Crear componente `QuestBanner`: fondo verde gradiente, título "Metabolic Quest", subtítulo descriptivo, etiqueta "12 SEMANAS · SALUD METABÓLICA"
- [ ] **5.2.2** Crear componente `ProgressRing`: anillo circular SVG con porcentaje de semana completada, XP y nivel
- [ ] **5.2.3** Integrar banner + ring en layout principal (stacked en móvil, side-by-side en desktop)
- [ ] **5.2.4** Animar el ring al cargar (transición suave del 0% al valor real)

**Rol:** Frontend Dev + UX/UI Designer
**Estimación:** 2 días
**Dependencias:** 5.1
**Riesgo:** Bajo

### 5.3 Reestructuración de navegación

- [ ] **5.3.1** Consolidar navegación a 5 tabs: Hoy, Semana, Retos, Progreso, Ajustes
- [ ] **5.3.2** Migrar contenido de "Analíticas" → integrado en header de Hoy
- [ ] **5.3.3** Migrar contenido de "Perfil" → integrado en "Ajustes"
- [ ] **5.3.4** Migrar contenido de "Plan" → integrado en "Semana"
- [ ] **5.3.5** Crear componente `TabNav` con estilo pill (tab activo con fondo verde)
- [ ] **5.3.6** Implementar navegación cliente-side sin recarga (ya existe, adaptar estilos)

**Rol:** Frontend Dev + BA
**Estimación:** 2 días
**Dependencias:** 5.1
**Riesgo:** Medio (refactor de rutas existentes)

### 5.4 Selector de día de la semana

- [ ] **5.4.1** Crear componente `DaySelector`: 7 pills (Lun-Dom) con día actual resaltado
- [ ] **5.4.2** Implementar navegación entre días: al seleccionar un día, cambiar el contenido de misiones y comidas
- [ ] **5.4.3** Persistir el día seleccionado en estado local (no en URL para mantener simplicidad)
- [ ] **5.4.4** Scroll horizontal automático al día actual en móvil

**Rol:** Frontend Dev
**Estimación:** 1 día
**Dependencias:** 5.3
**Riesgo:** Bajo

### 5.5 Pantalla "Hoy" - Misiones

- [ ] **5.5.1** Renombrar "Acciones" → "Misiones" en toda la app
- [ ] **5.5.2** Rediseñar `ActionCard` → `MissionCard`: checkbox + título + subtítulo + XP badge
- [ ] **5.5.3** Implementar check/uncheck con animación de feedback (confetti sutil o shake)
- [ ] **5.5.4** Mostrar contador de misiones completadas/total en el header de la sección
- [ ] **5.5.5** Adaptar las 17 acciones starter al nuevo formato de misiones

**Rol:** Frontend Dev + UX/UI Designer
**Estimación:** 2 días
**Dependencias:** 5.1, 5.4
**Riesgo:** Medio (cambio de modelo de datos de acciones)

### 5.6 Pantalla "Hoy" - Comidas del día

- [ ] **5.6.1** Crear componente `MealBlock`: etiqueta tipo (Desayuno/Comida/Merienda/Cena) + nombre + botón "Cambiar"
- [ ] **5.6.2** Implementar modal/drawer de sustitución de comidas al pulsar "Cambiar"
- [ ] **5.6.3** Crear banco de sustituciones por tipo de comida (mínimo 5 opciones por tipo)
- [ ] **5.6.4** Persistir sustituciones en la tabla `meals` existente
- [ ] **5.6.5** Mostrar nota general: "Sin contar calorías: proteína + mucha verdura + hidrato rico en fibra + grasa saludable"

**Rol:** Frontend Dev + BA
**Estimación:** 3 días
**Dependencias:** 5.4, esquema DB existente
**Riesgo:** Medio (nueva interacción de sustitución)

### 5.7 Pantalla "Hoy" - Actividad del día

- [ ] **5.7.1** Crear componente `DailyActivity`: bloque destacado con icono, título y detalles
- [ ] **5.7.2** Tipos de actividad: Cardio Z2, Fuerza A/B/C, Recuperación activa, Descanso activo
- [ ] **5.7.3** Integrar con el plan semanal para mostrar la actividad correspondiente al día seleccionado
- [ ] **5.7.4** Mostrar detalles específicos (duración, intensidad, notas)

**Rol:** Frontend Dev
**Estimación:** 1 día
**Dependencias:** 5.4, 5.8
**Riesgo:** Bajo

### 5.8 Pantalla "Semana" - Mapa semanal

- [ ] **5.8.1** Crear componente `WeeklyMap`: scroll horizontal con 7 tarjetas de día
- [ ] **5.8.2** Cada tarjeta muestra: nombre del día, tipo de entrenamiento (badge de color), comidas (comida + cena)
- [ ] **5.8.3** Badges de entrenamiento con colores: Fuerza (verde), Cardio (azul), Recuperación (gris)
- [ ] **5.8.4** Scroll snap en móvil para centrar tarjetas
- [ ] **5.8.5** Indicador visual del día actual en el mapa

**Rol:** Frontend Dev + UX/UI Designer
**Estimación:** 2 días
**Dependencias:** 5.1
**Riesgo:** Bajo

### 5.9 Pantalla "Semana" - Regla del plato y reglas de alto impacto

- [ ] **5.9.1** Crear componente `PlateRule`: visual con 3 secciones (½ verduras, ¼ proteína, ¼ hidrato)
- [ ] **5.9.2** Crear componente `HighImpactRules`: lista de reglas con iconos (bebidas azucaradas, alcohol, paseo post-comida)
- [ ] **5.9.3** Layout: dos columnas en desktop, stacked en móvil
- [ ] **5.9.4** Hacer las reglas editables desde Ajustes (fase posterior)

**Rol:** Frontend Dev + UX/UI Designer
**Estimación:** 1-2 días
**Dependencias:** 5.1
**Riesgo:** Bajo

### 5.10 Pantalla "Retos"

- [ ] **5.10.1** Rediseñar pantalla de retos: lista de retos semanales con botón "Conseguido"
- [ ] **5.10.2** Cada reto muestra: icono diana, título, descripción, estado
- [ ] **5.10.3** Implementar campo "Añadir reto propio..." con botón "Añadir"
- [ ] **5.10.4** Persistir retos personalizados en DB (nueva tabla `custom_challenges`)
- [ ] **5.10.5** Los retos valen 40 XP cada uno (vs 10 XP de misiones diarias)

**Rol:** Frontend Dev + BA
**Estimación:** 2 días
**Dependencias:** 5.3, nueva tabla DB
**Riesgo:** Medio

### 5.11 Pantalla "Retos" - Logros

- [ ] **5.11.1** Crear componente `AchievementGrid`: grid de tarjetas de logros
- [ ] **5.11.2** Cada logro: icono, nombre, requisito, estado (bloqueado/desbloqueado)
- [ ] **5.11.3** Logros iniciales: Primer paso (100 XP), En racha (3 días ≥70%), Constancia (20 hábitos), Nivel oro (400 XP)
- [ ] **5.11.4** Animación de desbloqueo cuando se consigue un logro
- [ ] **5.11.5** Integrar con sistema de gamificación existente

**Rol:** Frontend Dev
**Estimación:** 2 días
**Dependencias:** 5.10, sistema de gamificación existente
**Riesgo:** Bajo

### 5.12 Pantalla "Progreso"

- [ ] **5.12.1** Crear componente `WeeklySummary`: barras de progreso por categoría (Hábitos, Pasos, Paseos, Comida/fibra, Fuerza)
- [ ] **5.12.2** Crear componente `TwelveWeekGoal`: 3 fases (Construir rutina, Consolidar, Mantener) con descripción
- [ ] **5.12.3** Añadir sección de notas/observaciones (ej: vitaminas, comentarios médicos)
- [ ] **5.12.4** Las barras muestran porcentaje de cumplimiento semanal por categoría

**Rol:** Frontend Dev
**Estimación:** 2 días
**Dependencias:** 5.3
**Riesgo:** Bajo

### 5.13 Pantalla "Ajustes"

- [ ] **5.13.1** Crear formulario de personalización de objetivos: pasos diarios, fibra, fuerza/semana, cardio/semana, caminatas postcomida/semana
- [ ] **5.13.2** Botones "Guardar objetivos" y "Reiniciar semana"
- [ ] **5.13.3** Persistir objetivos en tabla `profiles` (campos existentes o nuevos)
- [ ] **5.13.4** Los valores modifican las etiquetas del tracker y las misiones diarias
- [ ] **5.13.5** Nota informativa: "Empieza conservador y sube cuando resulte fácil de mantener"

**Rol:** Frontend Dev + BA
**Estimación:** 2 días
**Dependencias:** 5.3, esquema DB
**Riesgo:** Bajo

### 5.14 Footer legal

- [ ] **5.14.1** Crear componente `LegalFooter`: disclaimer médico fijo en la parte inferior
- [ ] **5.14.2** Texto: "Este plan es una herramienta de hábitos y no sustituye valoración médica..."
- [ ] **5.14.3** Visible en todas las pantallas principales (Hoy, Semana, Retos, Progreso)
- [ ] **5.14.4** Estilo: texto pequeño, color muted, fondo ligeramente diferente

**Rol:** Frontend Dev
**Estimación:** 0.5 días
**Dependencias:** 5.1
**Riesgo:** Bajo

### 5.15 Actualización de marca (sin cambio de nombre)

- [ ] **5.15.1** Mantener nombre "VitaQuest" en toda la app (decisión confirmada)
- [ ] **5.15.2** Actualizar manifest.json PWA con nuevos iconos si es necesario
- [ ] **5.15.3** Actualizar meta tags, título de página, favicon si cambia el diseño
- [ ] **5.15.4** Actualizar documentación para reflejar el nuevo diseño visual

**Rol:** PO + Frontend Dev
**Estimación:** 0.5 días
**Dependencias:** Ninguna
**Riesgo:** Bajo

## Criterios de aceptación

- [ ] La app se ve idéntica al diseño en viewport 375px (móvil) y 1440px (desktop)
- [ ] Todas las 5 tabs son navegables y muestran contenido correcto
- [ ] El selector de día cambia el contenido de misiones y comidas
- [ ] Las misiones se pueden marcar/desmarcar con feedback visual
- [ ] Las comidas se pueden sustituir con el botón "Cambiar"
- [ ] El mapa semanal muestra los 7 días con scroll horizontal
- [ ] Los retos se pueden marcar como conseguidos y añadir personalizados
- [ ] Los logros se desbloquean automáticamente según el progreso
- [ ] El resumen semanal muestra barras de progreso por categoría
- [ ] Los objetivos personalizables se guardan y afectan al tracker
- [ ] El footer legal es visible en todas las pantallas principales
- [ ] typecheck, lint y tests pasan sin errores

## Métricas de validación

- Lighthouse mobile score ≥ 90
- Tiempo de carga inicial < 2s en 4G
- Interacciones táctiles sin delay perceptible
- 0 errores de consola en navegación completa
