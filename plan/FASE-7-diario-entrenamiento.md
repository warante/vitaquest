# Fase 7: Diario de Entrenamiento

## Objetivo

Implementar un diario de entrenamiento completo donde el usuario pueda registrar ejercicios, series, repeticiones, pesos y sensaciones, con seguimiento de progresión temporal.

## Análisis

El usuario mencionó específicamente: "un diario donde anotar mis ejercicios y el avance de pesos". Esto requiere:
- Registro de sesiones de entrenamiento
- Detalle de ejercicios con series, reps y peso
- Histórico de progresión por ejercicio
- Visualización de PRs (personal records)
- Sensaciones y notas post-entrenamiento

## Tareas

### 7.1 Modelo de datos para diario de entrenamiento

- [ ] **7.1.1** Crear tabla `training_sessions`:
  - `id` (uuid PK)
  - `profileId` (FK → profiles)
  - `sessionDate` (date)
  - `workoutType` (enum: fuerza_a, fuerza_b, fuerza_c, cardio_z2, movilidad, descanso_activo, custom)
  - `duration` (integer, minutos)
  - `rpe` (integer 1-10, esfuerzo percibido, nullable)
  - `notes` (text, nullable)
  - `completedAt` (timestamp)
- [ ] **7.1.2** Crear tabla `exercise_entries`:
  - `id` (uuid PK)
  - `sessionId` (FK → training_sessions, cascade delete)
  - `exerciseName` (text)
  - `order` (integer, orden dentro de la sesión)
  - `notes` (text, nullable)
- [ ] **7.1.3** Crear tabla `exercise_sets`:
  - `id` (uuid PK)
  - `entryId` (FK → exercise_entries, cascade delete)
  - `setNumber` (integer)
  - `reps` (integer)
  - `weight` (numeric 8,2, nullable - para ejercicios de peso corporal)
  - `weightUnit` (text, default 'kg')
  - `completed` (boolean, default true)
  - `rpe` (integer 1-10, nullable)
- [ ] **7.1.4** Crear tabla `exercise_library`:
  - `id` (uuid PK)
  - `name` (text, unique)
  - `category` (enum: empuje_horizontal, empuje_vertical, traccion_horizontal, traccion_vertical, piernas_dominante_rodilla, piernas_dominante_cadera, core, cardio, movilidad)
  - `muscleGroups` (text array)
  - `equipment` (enum: barra, mancuernas, maquina, peso_corporal, banda_elastica, kettlebell, ninguno)
- [ ] **7.1.5** Crear migraciones Drizzle para todas las tablas
- [ ] **7.1.6** Crear schemas Zod de validación
- [ ] **7.1.7** Crear endpoints `/api/training-sessions` (GET, POST, PUT, DELETE) y `/api/exercise-library` (GET)

**Rol:** Backend Dev + DBA
**Estimación:** 3-4 días
**Dependencias:** Esquema DB existente
**Riesgo:** Bajo

### 7.2 Biblioteca de ejercicios

- [ ] **7.2.1** Población inicial de la biblioteca con ejercicios comunes:
  - Empuje horizontal: press banca, flexiones, press mancuernas
  - Empuje vertical: press militar, dominadas, jalón al pecho
  - Tracción horizontal: remo con barra, remo mancuerna, face pull
  - Tracción vertical: dominadas, jalón al pecho, pull-ups
  - Piernas (rodilla): sentadilla, zancadas, prensa, extensión de cuádriceps
  - Piernas (cadera): peso muerto, hip thrust, curl femoral, puente de glúteos
  - Core: plank, crunch, russian twist, pallof press
  - Cardio: cinta, bici, elíptica, remar
  - Movilidad: estiramientos específicos
- [ ] **7.2.2** Permitir al usuario añadir ejercicios personalizados a su biblioteca
- [ ] **7.2.3** Búsqueda y filtrado por categoría y equipamiento

**Rol:** BA + Backend Dev
**Estimación:** 2 días
**Dependencias:** 7.1
**Riesgo:** Bajo

### 7.3 Registro de sesión de entrenamiento

- [ ] **7.3.1** Crear componente `TrainingSessionForm`:
  - Selector de tipo de entrenamiento
  - Selector de fecha (default: hoy)
  - Campo de duración
  - Campo de RPE (slider 1-10)
  - Campo de notas
- [ ] **7.3.2** Crear componente `ExerciseEntryRow`:
  - Selector de ejercicio (autocomplete desde biblioteca)
  - Botón para añadir series
  - Campo de notas por ejercicio
- [ ] **7.3.3** Crear componente `SetRow`:
  - Número de serie (auto-incremental)
  - Input de repeticiones
  - Input de peso (con unidad)
  - Checkbox de completada
  - Input de RPE por serie (opcional)
- [ ] **7.3.4** Botón "Añadir ejercicio" y "Añadir serie"
- [ ] **7.3.5** Botón "Guardar sesión" que persiste todo en DB
- [ ] **7.3.6** Validación: al menos un ejercicio con una serie para guardar

**Rol:** Frontend Dev + UX/UI Designer
**Estimación:** 3-4 días
**Dependencias:** 7.1, 7.2
**Riesgo:** Medio (formulario complejo en móvil)

### 7.4 Histórico de progresión

- [ ] **7.4.1** Crear componente `ExerciseProgressChart`: gráfico de línea mostrando evolución de peso/reps por ejercicio
- [ ] **7.4.2** Calcular 1RM estimado (fórmula de Epley: weight * (1 + reps/30))
- [ ] **7.4.3** Mostrar PRs (personal records) por ejercicio: máximo peso, máximo volumen (peso × reps × series)
- [ ] **7.4.4** Indicador de progresión: "↑ 5kg desde la última sesión" o "→ mismo peso"
- [ ] **7.4.5** Vista de calendario de entrenamientos: días con sesión marcada en verde

**Rol:** Frontend Dev + Data Analyst
**Estimación:** 3 días
**Dependencias:** 7.3
**Riesgo:** Medio (cálculos y visualizaciones)

### 7.5 Integración con el plan semanal

- [ ] **7.5.1** Al seleccionar un día en el mapa semanal que tenga entrenamiento planificado, mostrar botón "Registrar entrenamiento"
- [ ] **7.5.2** Pre-rellenar el tipo de entrenamiento según el plan (Fuerza A, Cardio Z2, etc.)
- [ ] **7.5.3** Sugerir ejercicios basados en el tipo de entrenamiento:
  - Fuerza A: empuje horizontal + piernas dominante rodilla + core
  - Fuerza B: tracción vertical + piernas dominante cadera + core
  - Fuerza C: empuje vertical + tracción horizontal + piernas accesorio
- [ ] **7.5.4** Al completar una sesión, marcar la misión correspondiente como completada

**Rol:** Frontend Dev + BA
**Estimación:** 2 días
**Dependencias:** 7.3, 5.8 (mapa semanal)
**Riesgo:** Bajo

### 7.6 Sensaciones y notas post-entrenamiento

- [ ] **7.6.1** Campo de sensaciones post-entrenamiento (emoji selector: 💪 fuerte, 😐 normal, 😫 agotado, 🤕 dolorido)
- [ ] **7.6.2** Campo de notas libres (dolor, molestias, observaciones)
- [ ] **7.6.3** Registro de sueño y energía pre-entrenamiento (opcional)
- [ ] **7.6.4** Correlación entre sensaciones y rendimiento (fase IA posterior)

**Rol:** Frontend Dev
**Estimación:** 1 día
**Dependencias:** 7.3
**Riesgo:** Bajo

### 7.7 Vista de resumen de entrenamiento

- [ ] **7.7.1** Crear pantalla de resumen semanal de entrenamiento:
  - Sesiones completadas vs planificadas
  - Volumen total por grupo muscular
  - Ejercicio con mayor progresión de la semana
  - RPE medio de la semana
- [ ] **7.7.2** Integrar con la pantalla de Progreso existente
- [ ] **7.7.3** Exportar datos de entrenamiento en JSON

**Rol:** Frontend Dev
**Estimación:** 2 días
**Dependencias:** 7.4, 5.12
**Riesgo:** Bajo

## Criterios de aceptación

- [ ] Se puede registrar una sesión completa con múltiples ejercicios y series
- [ ] La biblioteca de ejercicios permite búsqueda y filtrado
- [ ] El histórico muestra la progresión de peso/reps por ejercicio
- [ ] Los PRs se calculan y muestran correctamente
- [ ] El plan semanal sugiere ejercicios según el tipo de entrenamiento
- [ ] Las sensaciones post-entrenamiento se registran
- [ ] El resumen semanal de entrenamiento es preciso
- [ ] La interfaz es usable en móvil (inputs táctiles, scroll, etc.)

## Consideraciones UX móvil

- Los inputs numéricos deben usar teclado numérico en móvil
- Las series se deben poder añadir con un solo tap
- El formulario de sesión debe ser scrollable sin perder contexto
- Considerar modo "quick add" para registrar series rápidamente durante el entrenamiento
- Los pesos deben aceptar decimales (ej: 12.5 kg)
