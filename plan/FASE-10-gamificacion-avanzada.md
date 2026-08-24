# Fase 10: Gamificación Avanzada

## Objetivo

Expandir el sistema de gamificación actual (XP, rachas, insignias básicas) con mecánicas más profundas que mantengan la motivación a largo plazo sin generar ansiedad por la perfección.

## Análisis

El sistema actual tiene:
- XP por acción (60/acción, +120 día completo, +10/día racha)
- Rachas (días consecutivos con ≥70% completado)
- Insignias básicas (FirstStep, OnFire, Consistent, GoldenLevel)

El diseño propuesto añade:
- Retos semanales (40 XP cada uno)
- Logros visuales con iconos
- Niveles (actualmente solo Nivel 1)

Mejoras propuestas para gamificación a largo plazo.

## Tareas

### 10.1 Sistema de niveles expandido

- [ ] **10.1.1** Definir curva de progresión de niveles:
  - Nivel 1: 0-100 XP
  - Nivel 2: 100-300 XP
  - Nivel 3: 300-600 XP
  - Nivel 4: 600-1000 XP
  - Nivel 5: 1000-1500 XP
  - ... (cada nivel requiere más XP, curva suave)
  - Fórmula: XP_necesario = 100 * nivel^1.5
- [ ] **10.1.2** Cada nivel desbloquea:
  - Nuevo título (Novato → Explorador → Guerrero → Veterano → Maestro → Leyenda)
  - Nuevos retos disponibles
  - Nuevas opciones de personalización (colores de tema, iconos)
  - Acceso a funciones avanzadas (ej: análisis de patrones IA)
- [ ] **10.1.3** Mostrar progreso al siguiente nivel en el ring del header
- [ ] **10.1.4** Animación de subida de nivel con celebración

**Rol:** Game Designer + Frontend Dev + Backend Dev
**Estimación:** 2-3 días
**Dependencias:** Sistema de XP existente
**Riesgo:** Bajo

### 10.2 Retos dinámicos y adaptativos

- [ ] **10.2.1** Sistema de retos que se adaptan al nivel y progreso del usuario:
  - Retos fáciles (principiante): 3 días de caminata post-comida
  - Retos medios: 7 días consecutivos con ≥80% de misiones
  - Retos difíciles: 4 semanas con adherencia > 85%
  - Retos especiales: completar los 3 tipos de fuerza en una semana
- [ ] **10.2.2** Retos diarios aleatorios (1 al día, bonus XP):
  - "Hoy prueba a añadir una verdura extra en la cena"
  - "Haz 10 min de movilidad antes de dormir"
  - "Camina 1000 pasos más de tu objetivo"
- [ ] **10.2.3** Retos de temporada (cada 12 semanas, coincidiendo con las fases):
  - "Completa las 12 semanas del programa Metabolic Quest"
  - Logro especial al finalizar cada fase
- [ ] **10.2.4** Los retos se generan automáticamente según el historial del usuario

**Rol:** Game Designer + Backend Dev
**Estimación:** 3-4 días
**Dependencias:** 5.10 (sistema de retos básico)
**Riesgo:** Medio

### 10.3 Sistema de rachas mejorado

- [ ] **10.3.1** Rachas por categoría (no solo general):
  - Racha de pasos: días consecutivos con ≥8000 pasos
  - Racha de fuerza: semanas consecutivas con 3 sesiones
  - Racha de fibra: días consecutivos con ≥30g fibra
  - Racha de caminatas: días consecutivos con paseo post-comida
- [ ] **10.3.2** Multiplicador de XP por racha:
  - 1-3 días: x1
  - 4-7 días: x1.2
  - 8-14 días: x1.5
  - 15-30 días: x2
  - 30+ días: x2.5
- [ ] **10.3.3** "Racha congelada": 1 uso por semana que permite fallar un día sin perder la racha
  - Se gana automáticamente cada 7 días de racha
  - Máximo 3 congeladas acumuladas
- [ ] **10.3.4** Visualización de rachas en el perfil con fuego/llamas animadas

**Rol:** Game Designer + Backend Dev + Frontend Dev
**Estimación:** 3 días
**Dependencias:** Sistema de rachas existente
**Riesgo:** Bajo

### 10.4 Logros y coleccionismo

- [ ] **10.4.1** Expandir sistema de logros con categorías:
  - **Primeros pasos**: Primera misión, primera sesión, primera métrica registrada
  - **Rachas**: 7 días, 30 días, 100 días de racha
  - **Fuerza**: Primer PR, 10 sesiones de fuerza, 50 sesiones de fuerza
  - **Cardio**: Primer Z2 completado, 10 sesiones cardio, 100km caminados
  - **Nutrición**: 7 días con verdura en 2+ comidas, 30 días de fibra objetivo
  - **Analíticas**: Primera métrica registrada, 3 métricas con tendencia positiva
  - **Social**: (futuro) compartir un logro, invitar a un amigo
- [ ] **10.4.2** Cada logro tiene:
  - Icono único (emoji o SVG)
  - Nombre y descripción
  - Requisito claro
  - XP de recompensa
  - Rareza (común, poco común, raro, épico, legendario)
- [ ] **10.4.3** Colección de logros visible en pantalla de Retos/Progreso
- [ ] **10.4.4** Logros secretos (no se muestran hasta que se desbloquean)

**Rol:** Game Designer + Frontend Dev
**Estimación:** 3-4 días
**Dependencias:** 5.11 (logros básicos)
**Riesgo:** Bajo

### 10.5 Misiones especiales y eventos

- [ ] **10.5.1** Misiones de fin de semana (bonus XP):
  - "Prepara 3 comidas de la semana próxima" (+20 XP)
  - "Haz una ruta de senderismo de 60+ min" (+30 XP)
  - "Prueba una receta nueva con legumbres" (+15 XP)
- [ ] **10.5.2** Eventos temporales (cada mes):
  - "Reto de enero: 31 días de movimiento diario"
  - "Semana de la verdura: verdura en cada comida principal"
  - "Desafío de fuerza: 4 sesiones esta semana"
- [ ] **10.5.3** Misiones de recuperación (después de un día fallido):
  - "Vuelve al camino: completa 3 misiones hoy" (+15 XP, no cuenta para racha pero da XP)
  - Mensaje de ánimo: "Un día malo no define tu progreso"

**Rol:** Game Designer + BA
**Estimación:** 2 días
**Dependencias:** 5.5 (sistema de misiones)
**Riesgo:** Bajo

### 10.6 Personalización y recompensas cosméticas

- [ ] **10.6.1** Desbloquear temas de color al subir de nivel:
  - Nivel 1-3: Verde esmeralda (default)
  - Nivel 4-6: Azul océano
  - Nivel 7-9: Púrpura amanecer
  - Nivel 10+: Dorado legendario
- [ ] **10.6.2** Desbloquear iconos de perfil:
  - Por logros específicos (ej: icono de pesa por 50 sesiones de fuerza)
  - Por rachas (ej: icono de fuego por 30 días de racha)
- [ ] **10.6.3** Desbloquear fondos de pantalla para la app
- [ ] **10.6.4** Todas las recompensas son cosméticas, no afectan funcionalidad

**Rol:** UX/UI Designer + Frontend Dev
**Estimación:** 2-3 días
**Dependencias:** 10.1 (sistema de niveles)
**Riesgo:** Bajo

### 10.7 Sistema de "vida" o energía (opcional, controversial)

- [ ] **10.7.1** Evaluar si implementar sistema de energía/vida:
  - PRO: añade capa de estrategia, previene burnout
  - CONTRA: puede generar ansiedad, va contra el principio de "no castigar días fallidos"
- [ ] **10.7.2** Si se implementa, que sea muy generoso:
  - 3 "vidas" por semana (puedes fallar 3 días sin consecuencias)
  - Se regeneran cada semana
  - No se pierden XP ni rachas por usar una vida
- [ ] **10.7.3** Alternativa más suave: "días de descanso planificados"
  - El usuario puede marcar 1-2 días por semana como "descanso intencional"
  - No cuentan como fallo de racha
  - Se muestran como parte del plan, no como excepción

**Rol:** Game Designer + PO
**Estimación:** 1 día (decisión) + 2 días (implementación si se aprueba)
**Dependencias:** Decisión de PO
**Riesgo:** Alto (puede ir contra los principios del producto)

## Criterios de aceptación

- [ ] El sistema de niveles motiva sin generar presión excesiva
- [ ] Los retos se adaptan al progreso del usuario
- [ ] Las rachas por categoría dan feedback granular
- [ ] Los logros son variados y cubren todas las áreas de la app
- [ ] Las misiones especiales añaden variedad sin saturar
- [ ] La personalización cosmética recompensa la constancia
- [ ] El principio de "no castigar días fallidos" se mantiene

## Principios de gamificación

1. **Premiar la constancia, no la perfección**: XP por completar, no por ser perfecto
2. **Progresión visible**: el usuario siempre sabe cuánto le falta para el siguiente hito
3. **Variedad sin saturación**: retos y misiones especiales opcionales
4. **Recuperación siempre posible**: días de descanso, rachas congeladas, misiones de recuperación
5. **Cosmético, no pay-to-win**: todas las recompensas son visuales, no funcionales
