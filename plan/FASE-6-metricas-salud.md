# Fase 6: Métricas de Salud Metabólica

## Objetivo

Implementar el sistema de tarjetas de analíticas en el header principal, con valores, unidades, contexto interpretativo y tendencias temporales.

## Análisis

El diseño muestra 4 tarjetas de métricas de salud en la parte superior:
- **Triglicéridos**: 169 mg/dL · objetivo práctico: tendencia descendente
- **Resistencia Insulínica**: 9,1 · Ligeramente por encima del rango del laboratorio
- **Índice Hígado Graso**: 57,7 · Zona de posible riesgo, no diagnóstico
- **ALT / GPT**: 37 U/L · mejor que 52 en mayo

Cada tarjeta tiene: nombre de la métrica, valor numérico grande, unidad y texto de contexto.

## Tareas

### 6.1 Modelo de datos para métricas metabólicas

- [ ] **6.1.1** Crear tabla `metabolic_markers` en Drizzle:
  - `id` (uuid PK)
  - `profileId` (FK → profiles)
  - `markerType` (enum: triglycerides, insulin_resistance, fatty_liver_index, alt_gpt, custom)
  - `value` (numeric 12,4)
  - `unit` (text)
  - `measuredAt` (timestamp)
  - `referenceRange` (text, nullable)
  - `contextNote` (text, nullable)
  - `trend` (enum: improving, stable, worsening, unknown)
- [ ] **6.1.2** Crear migración Drizzle para la nueva tabla
- [ ] **6.1.3** Crear schema Zod de validación para entradas de métricas
- [ ] **6.1.4** Crear endpoint `/api/metabolic-markers` (GET, POST)

**Rol:** Backend Dev + DBA
**Estimación:** 1-2 días
**Dependencias:** Esquema DB existente
**Riesgo:** Bajo

### 6.2 Componente de tarjeta de métrica

- [ ] **6.2.1** Crear componente `MetricCard`:
  - Label uppercase small (nombre de la métrica)
  - Valor numérico grande y bold
  - Unidad y texto de contexto en línea
  - Borde sutil, fondo superficie oscura
- [ ] **6.2.2** Variantes de estado: normal, alerta (borde naranja), crítico (borde rojo)
- [ ] **6.2.3** Tooltip o expandible con histórico de la métrica (mini gráfico sparkline)
- [ ] **6.2.4** Layout responsive: 4 columnas en desktop, 2x2 en tablet, scroll horizontal en móvil

**Rol:** Frontend Dev + UX/UI Designer
**Estimación:** 2 días
**Dependencias:** 6.1, 5.1 (tokens de diseño)
**Riesgo:** Bajo

### 6.3 Histórico y tendencias

- [ ] **6.3.1** Implementar cálculo de tendencia automática (comparar último valor vs media de los 3 anteriores)
- [ ] **6.3.2** Mostrar indicador visual de tendencia: flecha arriba/abajo/estable
- [ ] **6.3.3** Mini gráfico sparkline en cada tarjeta (últimos 6 valores)
- [ ] **6.3.4** Al hacer click en una tarjeta, abrir modal con histórico completo y gráfico de línea

**Rol:** Frontend Dev + Data Analyst
**Estimación:** 2-3 días
**Dependencias:** 6.1, 6.2
**Riesgo:** Medio (gráficos requieren librería o SVG custom)

### 6.4 Registro de nuevas métricas

- [ ] **6.4.1** Crear formulario de registro de métricas metabólicas
- [ ] **6.4.2** Campos: tipo de métrica, valor, unidad, fecha, notas
- [ ] **6.4.3** Validación de rangos razonables (alertar si el valor es extremadamente alto/bajo)
- [ ] **6.4.4** Integrar con la pantalla de Ajustes o crear sección dedicada

**Rol:** Frontend Dev + BA
**Estimación:** 1-2 días
**Dependencias:** 6.1
**Riesgo:** Bajo

### 6.5 Contexto interpretativo

- [ ] **6.5.1** Crear sistema de reglas de contexto por tipo de métrica:
  - Triglicéridos: < 150 óptimo, 150-199 límite alto, ≥ 200 alto
  - Resistencia insulínica (HOMA-IR): < 2.5 normal, 2.5-4.5 resistencia leve, > 4.5 resistencia significativa
  - Índice hígado graso (FLI): < 30 bajo riesgo, 30-60 posible riesgo, ≥ 60 alto riesgo
  - ALT/GPT: varía por sexo, generalmente < 40 U/L normal
- [ ] **6.5.2** Los textos de contexto se generan automáticamente según el valor y los rangos
- [ ] **6.5.3** IMPORTANTE: todos los textos deben incluir "no diagnóstico" o similar
- [ ] **6.5.4** Permitir al usuario personalizar los textos de contexto (en Ajustes)

**Rol:** BA + Medical Advisor (consulta) + Frontend Dev
**Estimación:** 2 días
**Dependencias:** 6.2
**Riesgo:** Alto (responsabilidad médica, requiere revisión cuidadosa)

### 6.6 Integración con pantalla de Progreso

- [ ] **6.6.1** Mostrar evolución de métricas en la pantalla de Progreso
- [ ] **6.6.2** Gráfico de línea multi-métrica con eje temporal
- [ ] **6.6.3** Posibilidad de comparar métricas con objetivos personales
- [ ] **6.6.4** Exportar histórico de métricas en la exportación JSON

**Rol:** Frontend Dev
**Estimación:** 2 días
**Dependencias:** 6.3, 5.12
**Riesgo:** Bajo

## Criterios de aceptación

- [ ] Las 4 tarjetas de métricas se muestran en el header con valores correctos
- [ ] El contexto interpretativo se genera automáticamente según el valor
- [ ] Las tendencias se calculan y muestran correctamente
- [ ] Se pueden registrar nuevas métricas desde la interfaz
- [ ] El histórico se visualiza en gráfico de línea
- [ ] Todos los textos incluyen disclaimer de no-diagnóstico
- [ ] Los rangos de referencia son configurables

## Consideraciones de seguridad y privacidad

- Las métricas de salud son datos sensibles
- No se deben compartir ni exportar sin consentimiento explícito
- Los textos interpretativos nunca deben sonar a diagnóstico médico
- Considerar cifrado de datos de salud en reposo (fase posterior)
