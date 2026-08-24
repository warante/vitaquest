# Fase 8: Función Inteligente (IA Local) - Insights de Salud

## Objetivo

Implementar una función inteligente que analice los datos de analíticas, entrenamiento, alimentación y hábitos del usuario para generar insights personalizados, recomendaciones de hábitos y detección de patrones, usando un **modelo local compatible con API OpenAI**.

## Análisis

El usuario confirmó:
- Tiene un modelo local accesible vía API
- Es compatible con el formato de API de OpenAI
- La configuración se facilitará cuando se necesite
- La app es de uso personal (sin costes de API externos)

**Ventajas del modelo local:**
- Sin costes de API (uso personal)
- Privacidad total (los datos de salud no salen del entorno local)
- Latencia controlable
- Sin dependencia de servicios externos

**IMPORTANTE**: La IA nunca debe dar diagnósticos médicos ni recomendaciones clínicas. Solo patrones observables y sugerencias de hábitos.

## Tareas

### 8.1 Arquitectura de integración con IA (configuración confirmada)

**Configuración recibida del usuario**:
- Local: `http://127.0.0.1:18080/v1`
- Público: `https://llm.cerotenedores.com/v1`
- API Key: `sk-local-xxxxxxxxxxxxxxxx`
- Modelo: `qwen2.5-coder-32k:latest`
- Temperatura: 0.2

- [ ] **8.1.1** Instalar dependencia `openai` (SDK compatible con endpoints custom)
- [ ] **8.1.2** Configurar variables de entorno en `.env.local`:
  ```env
  AI_BASE_URL=http://127.0.0.1:18080/v1
  AI_PUBLIC_URL=https://llm.cerotenedores.com/v1
  AI_API_KEY=sk-local-xxxxxxxxxxxxxxxx
  AI_MODEL=qwen2.5-coder-32k:latest
  AI_TEMPERATURE=0.2
  AI_MAX_TOKENS=2048
  ```
- [ ] **8.1.3** Crear módulo de servicio de IA en `app/domain/ai-service.ts`:
  - Cliente OpenAI con `baseURL` dinámico (local en dev, público en producción)
  - Función `generateInsights(data: HealthData): Promise<Insight[]>`
  - Función `answerHealthQuestion(question: string, context: HealthData): Promise<string>`
  - Función `detectPatterns(history: TimeSeriesData): Promise<Pattern[]>`
  - Función `isAIAvailable(): Promise<boolean>` (check local + público)
- [ ] **8.1.4** Implementar estrategia de endpoints:
  - Desarrollo: usar `AI_BASE_URL` (local)
  - Producción: usar `AI_PUBLIC_URL` (público)
  - Fallback: si local falla, intentar público
- [ ] **8.1.5** Implementar cache de respuestas (evitar llamadas repetitivas)
- [ ] **8.1.6** Crear endpoint `/api/ai/insights` (POST) que recibe datos y devuelve insights
- [ ] **8.1.7** Sistema de fallback: si ningún endpoint está disponible, mostrar insights rule-based básicos
- [ ] **8.1.8** Tests de integración con el modelo real

**Rol:** Backend Dev
**Estimación:** 2-3 días
**Dependencias:** Configuración confirmada ✅
**Riesgo:** Bajo (configuración completa recibida)

### 8.2 Sistema de prompts y contexto

- [ ] **8.2.1** Diseñar system prompt estricto con reglas:
  - NUNCA dar diagnósticos médicos
  - NUNCA recomendar cambios en medicación
  - SIEMPRE sugerir consultar con profesional sanitario para interpretaciones clínicas
  - SOLO describir patrones observables en los datos
  - SOLO sugerir cambios de hábitos generales (más verduras, más movimiento, etc.)
  - Usar lenguaje sencillo y no clínico
  - Responder en español
- [ ] **8.2.2** Crear template de contexto que incluye:
  - Últimas métricas de salud con tendencias
  - Adherencia semanal de hábitos
  - Resumen de entrenamientos de la semana
  - Objetivos personales del usuario
  - Historial de 4-8 semanas para detectar patrones
- [ ] **8.2.3** Implementar sanitización de datos antes de enviar a la IA (no enviar datos identificativos)
- [ ] **8.2.4** Sistema de versionado de prompts para poder iterar sin romper producción

**Rol:** AI Engineer + BA + Medical Advisor (revisión)
**Estimación:** 2-3 días
**Dependencias:** 8.1
**Riesgo:** Alto (calidad y seguridad de los prompts es crítica)

### 8.3 Insights automáticos semanales

- [ ] **8.3.1** Generar resumen semanal automático cada domingo/lunes:
  - "Esta semana completaste X de Y misiones (Z%)"
  - "Tu adherencia de fuerza fue del X%, objetivo: Y%"
  - "Observamos que los días que entrenas fuerza, tu energía reportada es mayor"
  - "Tu último valor de triglicéridos bajó X puntos respecto al anterior"
- [ ] **8.3.2** Detectar patrones interesantes:
  - Correlación entre entrenamiento y métricas de salud
  - Días de la semana con mejor/peor adherencia
  - Efecto de las caminatas post-comida en la consistencia
  - Relación entre sueño reportado y rendimiento en entrenamiento
- [ ] **8.3.3** Sugerencias de ajuste de objetivos:
  - "Has completado el 90% de pasos durante 3 semanas. ¿Quieres subir a 9000?"
  - "Tu adherencia de fibra es baja. ¿Probamos a añadir una fruta extra en la merienda?"
- [ ] **8.3.4** Los insights se guardan en DB para consulta histórica

**Rol:** AI Engineer + Frontend Dev
**Estimación:** 3 días
**Dependencias:** 8.2, datos suficientes (mínimo 2-3 semanas de uso)
**Riesgo:** Medio

### 8.4 Chat de salud (Q&A)

- [ ] **8.4.1** Crear interfaz de chat en la app (modal o pantalla dedicada)
- [ ] **8.4.2** El usuario puede hacer preguntas sobre sus datos:
  - "¿Cómo va mi progresión en sentadilla?"
  - "¿Qué tendencia tienen mis triglicéridos?"
  - "¿Cuántos días de racha llevo?"
  - "¿Qué ejercicios hice la semana pasada?"
- [ ] **8.4.3** La IA responde basándose en los datos del usuario + contexto general de salud
- [ ] **8.4.4** Historial de conversaciones guardado en DB
- [ ] **8.4.5** Botón de "feedback" en cada respuesta (útil / no útil) para mejorar el sistema

**Rol:** Frontend Dev + AI Engineer
**Estimación:** 3-4 días
**Dependencias:** 8.2
**Riesgo:** Medio

### 8.4.1 Análisis nutricional por visión  (Mejora futura solicitada)

**Descripción**: Usar el modelo `llama3.2-vision:latest` para analizar fotos de platos de comida y extraer automáticamente valores nutricionales estimados.

- [ ] **8.4.1.1** Integrar camera API del navegador para capturar fotos
- [ ] **8.4.1.2** Implementar upload de imágenes (base64 o multipart) al endpoint de visión
- [ ] **8.4.1.3** Crear system prompt especializado en análisis nutricional:
  - Identificación de alimentos
  - Estimación de porciones
  - Cálculo de valores nutricionales (calorías, proteínas, carbs, grasas, fibra)
  - Nivel de confianza del análisis
- [ ] **8.4.1.4** Procesar respuesta JSON estructurada del modelo
- [ ] **8.4.1.5** UI de confirmación: mostrar valores estimados, permitir edición manual
- [ ] **8.4.1.6** Almacenar foto + datos nutricionales en DB (tabla `meal_images` o similar)
- [ ] **8.4.1.7** Integrar con formulario de registro de comidas (botón "📸 Analizar plato")
- [ ] **8.4.1.8** Fallback: si el modelo de visión no está disponible, permitir solo registro manual
- [ ] **8.4.1.9** Disclaimer visible: "Valores estimados, no sustituyen análisis nutricional profesional"

**Rol:** Frontend Dev + AI Engineer
**Estimación:** 5-7 días
**Dependencias:** 8.1 (cliente IA configurado), modelo `llama3.2-vision:latest` disponible
**Riesgo:** Medio (precisión de estimaciones variable, requiere validación)

**System prompt ejemplo**:
```
Analiza esta imagen de comida y devuelve un JSON con:
- alimentos_identificados: lista de alimentos visibles
- estimacion_nutricional: { calorias, proteinas_g, carbohidratos_g, grasas_g, fibra_g }
- porcion_estimada: descripción del tamaño de porción
- confianza: 0-1 (qué tan seguro estás del análisis)

IMPORTANTE:
- Son estimaciones, no valores exactos
- Basa tus estimaciones en porciones estándar
- Si no puedes identificar algo, indícalo claramente
- Devuelve SOLO JSON, sin texto adicional
```

### 8.5 Detección de anomalías

- [ ] **8.5.1** Sistema de alertas cuando una métrica cambia significativamente:
  - Subida/bajada > 20% en una métrica de salud
  - Racha de 3+ días sin completar ninguna misión
  - Caída significativa en el volumen de entrenamiento
  - RPE consistentemente alto (posible sobreentrenamiento)
- [ ] **8.5.2** Las alertas se muestran como notificaciones en la app (no push notifications en esta fase)
- [ ] **8.5.3** Cada alerta incluye contexto y sugerencia de acción (no alarma)
- [ ] **8.5.4** El usuario puede silenciar tipos de alertas en Ajustes

**Rol:** Backend Dev + AI Engineer
**Estimación:** 2 días
**Dependencias:** 8.1
**Riesgo:** Medio

### 8.6 Insights rule-based (fallback sin IA)

- [ ] **8.6.1** Implementar sistema de reglas simples que funcione sin API de IA:
  - Si adherencia > 80% → mensaje de refuerzo positivo
  - Si adherencia < 50% → mensaje de ánimo sin culpa
  - Si métrica mejora → "¡Buena tendencia!"
  - Si métrica empeora → "Observa la tendencia, consulta con tu médico si persiste"
  - Si racha > 7 días → celebración
  - Si 3+ días sin entrenar → "¿Qué tal un paseo hoy?"
- [ ] **8.6.2** Este sistema funciona siempre, incluso sin configuración de IA
- [ ] **8.6.3** Los mensajes rule-based son editables por el usuario en Ajustes

**Rol:** Backend Dev + BA
**Estimación:** 2 días
**Dependencias:** Ninguna (paralelo a 8.1)
**Riesgo:** Bajo

### 8.7 Privacidad y ética de IA (modelo local)

- [ ] **8.7.1** Documento de política de uso de IA para datos de salud (simplificado, modelo local)
- [ ] **8.7.2** Opción de desactivar completamente la IA en Ajustes
- [ ] **8.7.3** Ventaja clave: los datos NUNCA salen del entorno local del usuario
- [ ] **8.7.4** Log de todas las interacciones con IA para auditoría
- [ ] **8.7.5** Nota: al ser modelo local, no hay problemas de ToS ni transferencia de datos a terceros

**Rol:** PO + DevOps
**Estimación:** 0.5 días
**Dependencias:** 8.1
**Riesgo:** Bajo (modelo local = privacidad total)

## Criterios de aceptación

- [ ] La IA genera insights semanales relevantes y no clínicos
- [ ] El chat responde preguntas sobre los datos del usuario correctamente
- [ ] Las anomalías se detectan y notifican apropiadamente
- [ ] El sistema rule-based funciona como fallback sin IA
- [ ] Los prompts están revisados y no generan respuestas clínicas
- [ ] El usuario puede desactivar la IA completamente
- [ ] Los datos enviados a la IA están anonimizados/sanitizados
- [ ] Las respuestas de la IA incluyen disclaimer de no-diagnóstico

## Consideraciones de coste

- **Modelo local**: Sin costes de API
- **Hardware**: Requiere GPU o CPU potente para ejecutar el modelo local
- **Cache de respuestas**: Reduce llamadas repetitivas al modelo
- **Coste mensual**: $0 (solo electricidad del hardware local)

## Configuración pendiente

El usuario facilitará la configuración del modelo local cuando se implemente la Fase 8:
- URL del endpoint (ej: `http://localhost:11434/v1` para Ollama)
- API key (si aplica)
- Nombre del modelo
- Capacidades del modelo (context window, etc.)

## APIs de datos de salud

**Estado**: Ninguna API disponible de momento (confirmado por el usuario).

La Fase 9 (Integraciones) queda **POSPUESTA** hasta que el usuario tenga APIs disponibles. Mientras tanto:
- Registro manual de métricas de salud
- Importación manual de datos de wearables (si el usuario exporta CSV/JSON)
- La IA trabaja con los datos registrados manualmente
