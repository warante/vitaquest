# Fase 9: Integraciones Externas

## ⚠️ ESTADO: POSPUESTO

**Decisión del usuario (2026-08-23)**: No hay APIs de datos de salud disponibles de momento.

Esta fase queda en standby hasta que el usuario confirme qué APIs tiene disponibles. Mientras tanto, el registro de datos será manual.

---

## Objetivo (cuando se active)

Conectar VitaQuest con servicios externos para automatizar la captura de datos de actividad, nutrición y salud, reduciendo la fricción de registro manual.

## Análisis (cuando se active)

Para una app de seguimiento de salud móvil, las integraciones clave serán:
- Wearables y plataformas de actividad (pasos, cardio, sueño)
- Apps de nutrición (calorías, macros, aunque no sea el foco principal)
- APIs de laboratorios/analíticas (si el usuario tiene acceso en el futuro)
- Calendario (recordatorios de entrenamiento)

## Tareas

### 9.1 Google Health Connect / Apple HealthKit

- [ ] **9.1.1** Investigar viabilidad de integración con Health Connect (Android) y HealthKit (iOS) desde PWA
  - Nota: PWA tiene acceso limitado a APIs nativas de salud
  - Opción A: Usar APIs web si están disponibles
  - Opción B: Wrapper nativo mínimo (Capacitor/TWA) para acceder a Health APIs
  - Opción C: Importación manual de datos exportados desde Google Fit / Apple Salud
- [ ] **9.1.2** Si viabilidad confirmada, implementar sync de:
  - Pasos diarios (actualizar misión de pasos automáticamente)
  - Distancia caminada
  - Minutos de actividad moderada/vigorosa
  - Frecuencia cardíaca en reposo y en ejercicio
  - Horas de sueño
- [ ] **9.1.3** Botón de "Sincronizar con Google Fit / Apple Salud" en Ajustes
- [ ] **9.1.4** Last sync timestamp y estado de conexión visible
- [ ] **9.1.5** Mapeo de datos externos a misiones internas (ej: 8000 pasos de Google Fit → misión de pasos completada)

**Rol:** Mobile Dev + Backend Dev
**Estimación:** 5-7 días (depende de viabilidad PWA)
**Dependencias:** Investigación de viabilidad, posible necesidad de wrapper nativo
**Riesgo:** Alto (limitaciones de PWA para APIs de salud nativas)

### 9.2 Garmin Connect API

- [ ] **9.2.1** Investigar Garmin Connect API (no oficial pero ampliamente usada):
  - OAuth flow para autenticación
  - Endpoints disponibles: actividades, pasos, sueño, HR, HRV
- [ ] **9.2.2** Implementar conexión con Garmin:
  - Botón "Conectar Garmin" en Ajustes
  - OAuth flow (redirect a Garmin, callback con token)
  - Sync diario de datos (cron job o manual)
- [ ] **9.2.3** Mapear datos de Garmin a misiones:
  - Pasos → misión de 8000 pasos
  - Actividades de cardio → misión de cardio Z2
  - Minutos de actividad → resumen semanal
- [ ] **9.2.4** Cache de datos de Garmin para evitar rate limits
- [ ] **9.2.5** Manejo de errores y reconexión automática

**Rol:** Backend Dev + DevOps
**Estimación:** 4-5 días
**Dependencias:** 9.1 (decisión de arquitectura de integraciones)
**Riesgo:** Medio (API no oficial puede cambiar)

### 9.3 Fitbit API

- [ ] **9.3.1** Investigar Fitbit Web API (oficial, con OAuth 2.0):
  - Registro de app en dev.fitbit.com
  - Scopes necesarios: activity, heart_rate, sleep, profile
- [ ] **9.3.2** Implementar conexión similar a Garmin
- [ ] **9.3.3** Sync de datos: pasos, actividad, sueño, FC
- [ ] **9.3.4** Webhooks de Fitbit para actualizaciones en tiempo real (opcional)

**Rol:** Backend Dev
**Estimación:** 3-4 días
**Dependencias:** 9.2 (patrón similar)
**Riesgo:** Bajo (API oficial y estable)

### 9.4 APIs de nutrición (opcional)

- [ ] **9.4.1** Evaluar integración con MyFitnessPal o Cronometer:
  - MyFitnessPal: API no oficial, scraping frágil
  - Cronometer: tiene API pública (cronometer.com/api)
  - Open Food Facts: API libre para información nutricional de alimentos
- [ ] **9.4.2** Si se integra, usar solo para:
  - Verificar que las comidas registradas son equilibradas
  - Sugerir sustituciones basadas en perfil nutricional
  - NO contar calorías (no es el enfoque del producto)
- [ ] **9.4.3** Integración con Open Food Facts para base de datos de alimentos (si se quiere ampliar el banco de sustituciones)

**Rol:** Backend Dev + BA
**Estimación:** 3-5 días (depende de la API elegida)
**Dependencias:** Decisión de PO sobre alcance nutricional
**Riesgo:** Medio

### 9.5 APIs de analíticas/laboratorio

- [ ] **9.5.1** El usuario mencionó que puede facilitar datos de APIs para consultar analíticas
- [ ] **9.5.2** Investigar qué APIs de laboratorio están disponibles:
  - APIs de laboratorios privados españoles (Synlab, Cerba, etc.)
  - APIs de servicios de salud pública (varía por comunidad autónoma)
  - Exportación manual de resultados en PDF/CSV
- [ ] **9.5.3** Implementar integración según APIs disponibles:
  - OAuth o API key para autenticación
  - Parseo de resultados de analíticas
  - Mapeo automático a métricas metabólicas (triglicéridos, ALT, etc.)
- [ ] **9.5.4** Si no hay API disponible, implementar upload de PDF/CSV con parseo automático (OCR o parsing estructurado)

**Rol:** Backend Dev + BA
**Estimación:** 3-7 días (depende mucho de la API disponible)
**Dependencias:** El usuario debe confirmar qué APIs tiene disponibles
**Riesgo:** Alto (depende de factores externos)

### 9.6 Integración con calendario

- [ ] **9.6.1** Exportar sesiones de entrenamiento planificadas al calendario del dispositivo
- [ ] **9.6.2** Formato iCal (.ics) para compatibilidad universal
- [ ] **9.6.3** Opción de suscripción al calendario de entrenamientos (actualización automática)
- [ ] **9.6.4** Recordatorios del calendario como backup de los recordatorios internos

**Rol:** Frontend Dev + Backend Dev
**Estimación:** 1-2 días
**Dependencias:** 5.8 (mapa semanal con plan de entrenamientos)
**Riesgo:** Bajo

### 9.7 Webhooks y automatizaciones

- [ ] **9.7.1** Sistema de webhooks interno para eventos:
  - `session.completed` → actualizar misiones, XP, racha
  - `metric.recorded` → recalcular tendencias, generar insights
  - `streak.broken` → mensaje de ánimo
  - `achievement.unlocked` → notificación de logro
- [ ] **9.7.2** Posibilidad de conectar con Zapier/Make/n8n para automatizaciones externas:
  - Enviar resumen semanal por email
  - Publicar logros en redes sociales (opcional)
  - Sincronizar con Google Sheets para análisis personalizado
- [ ] **9.7.3** API webhook configurable en Ajustes (URL + eventos suscritos)

**Rol:** Backend Dev + DevOps
**Estimación:** 2-3 días
**Dependencias:** Arquitectura de eventos interna
**Riesgo:** Bajo

## Criterios de aceptación

- [ ] Al menos una integración con plataforma de actividad funciona (Garmin, Fitbit o Health Connect)
- [ ] Los datos de pasos se sincronizan automáticamente con la misión de pasos
- [ ] Las analíticas se pueden importar automáticamente (vía API o upload)
- [ ] El usuario puede conectar/desconectar integraciones en Ajustes
- [ ] Los errores de sync se manejan gracefully con reintentos
- [ ] Los datos de integraciones externas se almacenan con la misma privacidad que los datos manuales

## Consideraciones de arquitectura

- Cada integración debe ser un módulo independiente (patrón adapter)
- Los tokens de OAuth se almacenan cifrados en DB
- Rate limiting para no saturar APIs externas
- Sistema de reintentos con exponential backoff
- Logs de sync para debugging
- Los datos externos pasan por el mismo sistema de validación que los manuales
