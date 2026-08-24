# Mejoras y Sugerencias Adicionales

## Funcionalidades propuestas más allá del diseño

Basándome en el análisis del producto, el usuario objetivo y las tendencias de apps de salud, estas son mejoras adicionales que podrían aportar valor significativo.

---

## A. Diario de bienestar holístico

### A.1 Registro de estado de ánimo y energía

- **Qué**: Selector diario de ánimo (emoji de 1-5) y nivel de energía (1-10)
- **Por qué**: Correlacionar estado emocional con adherencia a hábitos y rendimiento en entrenamiento
- **Cuándo**: Al completar misiones del día o como recordatorio nocturno
- **Complejidad**: Baja (1-2 días)
- **Impacto**: Alto (datos valiosos para insights de IA)

### A.2 Registro de sueño manual

- **Qué**: Horas de sueño, calidad (1-5), hora de acostarse/levantarse
- **Por qué**: El sueño es fundamental para salud metabólica y recuperación
- **Cuándo**: Por la mañana o integrado con wearable
- **Complejidad**: Baja (1 día)
- **Impacto**: Alto

### A.3 Diario de notas libre

- **Qué**: Campo de texto libre para anotar observaciones, sensaciones, eventos del día
- **Por qué**: Contexto cualitativo que enriquece los datos cuantitativos
- **Cuándo**: Cuando el usuario quiera, sin presión
- **Complejidad**: Muy baja (0.5 días)
- **Impacto**: Medio

---

## B. Nutrición inteligente

### B.1 Banco de recetas saludables

- **Qué**: Colección de 30-50 recetas organizadas por tipo (desayuno, comida, cena, merienda)
- **Por qué**: Facilita la sustitución de comidas con opciones reales y variadas
- **Cómo**: Base de datos local, sin API externa necesaria inicialmente
- **Complejidad**: Media (3-4 días para contenido + UI)
- **Impacto**: Alto

### B.2 Lista de la compra automática

- **Qué**: Generar lista de la compra semanal basada en el plan de comidas
- **Por qué**: Reduce fricción para seguir el plan nutricional
- **Cómo**: Extraer ingredientes de las comidas planificadas, agrupar por categoría
- **Complejidad**: Media (2-3 días)
- **Impacto**: Medio-Alto

### B.3 Análisis nutricional por visión artificial ⭐ NUEVA

- **Qué**: Usar el modelo de visión (`llama3.2-vision:latest`) para analizar fotos de platos de comida y extraer automáticamente valores nutricionales estimados
- **Por qué**: Reduce drásticamente la fricción de registro nutricional. El usuario solo hace una foto y la IA estima: calorías, proteínas, carbohidratos, grasas, fibra, y alimentos identificados
- **Cómo**:
  - Camera API del navegador para capturar foto
  - Envío de imagen al endpoint de visión (`llama3.2-vision:latest`)
  - System prompt especializado en análisis nutricional de platos
  - Respuesta estructurada JSON con valores estimados
  - El usuario puede corregir/ajustar los valores si lo desea
  - Almacenamiento de foto + datos nutricionales en DB
- **Flujo de usuario**:
  1. Usuario pulsa "Analizar plato" en registro de comida
  2. Se abre cámara o selector de imagen
  3. Foto se envía al modelo de visión
  4. IA devuelve: alimentos identificados + valores nutricionales estimados
  5. Usuario confirma o ajusta valores
  6. Se guarda en el diario de comidas
- **System prompt ejemplo**:
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
- **Complejidad**: Alta (5-7 días)
  - Integración de camera API
  - Upload de imágenes (base64 o multipart)
  - Parsing de respuesta estructurada
  - UI de confirmación/edición de valores
  - Almacenamiento de imágenes
- **Impacto**: Muy Alto (diferenciador clave, reduce fricción de registro)
- **Modelo requerido**: `llama3.2-vision:latest` (ya disponible en la configuración)
- **Riesgo**: Medio (precisión de estimaciones nutricionales variable)
- **Nota**: Los valores son estimaciones orientativas, no sustituyen análisis nutricional profesional

---

## C. Social y motivación

### C.1 Modo "accountability partner"

- **Qué**: Compartir progreso semanal con una persona de confianza (pareja, amigo, coach)
- **Por qué**: La responsabilidad social aumenta la adherencia
- **Cómo**: Link compartible con resumen semanal (sin datos sensibles de salud)
- **Complejidad**: Media (2-3 días)
- **Impacto**: Alto
- **Riesgo**: Privacidad (datos de salud compartidos)

### C.2 Comunidad privada (futuro)

- **Qué**: Foro o grupo privado de usuarios de Metabolic Quest
- **Por qué**: Compartir experiencias, recetas, rutinas
- **Cómo**: Plataforma externa (Discord, Circle) integrada con link
- **Complejidad**: Baja si es externo (0.5 días)
- **Impacto**: Medio
- **Nota**: Solo si se abre a más usuarios

---

## D. Análisis avanzado

### D.1 Correlaciones automáticas

- **Qué**: Detectar correlaciones entre variables (ej: días con más pasos → mejor ánimo)
- **Por qué**: Insights accionables basados en datos reales del usuario
- **Cómo**: Análisis estadístico simple (correlación de Pearson) en el backend
- **Complejidad**: Media (2-3 días)
- **Impacto**: Alto

### D.2 Predicción de adherencia

- **Qué**: Predecir probabilidad de completar la semana según progreso actual
- **Por qué**: Intervención temprana si se detecta riesgo de abandonar
- **Cómo**: Modelo simple basado en histórico (regresión logística o rule-based)
- **Complejidad**: Media-Alta (3-5 días)
- **Impacto**: Medio

### D.3 Informe mensual para el médico

- **Qué**: PDF resumen con evolución de métricas, adherencia y observaciones
- **Por qué**: Facilita la comunicación con profesionales sanitarios
- **Cómo**: Generación de PDF en el servidor, descargable por el usuario
- **Complejidad**: Media (2-3 días)
- **Impacto**: Alto

---

## E. Personalización avanzada

### E.1 Perfiles de entrenamiento intercambiables

- **Qué**: Diferentes planes de entrenamiento según fase (hipertrofia, fuerza, resistencia)
- **Por qué**: El usuario puede cambiar de objetivo sin perder el histórico
- **Cómo**: Templates de entrenamiento guardados en DB
- **Complejidad**: Media (2-3 días)
- **Impacto**: Medio

### E.2 Preferencias alimentarias y alergias

- **Qué**: Configurar alergias, intolerancias, preferencias (vegetariano, sin gluten, etc.)
- **Por qué**: Las sustituciones de comidas respetan las restricciones del usuario
- **Cómo**: Campos en el perfil, filtrado en el banco de sustituciones
- **Complejidad**: Baja (1-2 días)
- **Impacto**: Alto

### E.3 Zonas horarias y horarios personalizados

- **Qué**: Configurar hora de inicio del "día" (no todos empiezan a las 00:00)
- **Por qué**: Personas con turnos nocturnos o horarios atípicos
- **Cómo**: Campo en perfil, ajuste en lógica de fecha
- **Complejidad**: Baja (1 día)
- **Impacto**: Bajo (pero importante para casos edge)

---

## F. Gamificación creativa

### F.1 "Quests" narrativos

- **Qué**: Historias cortas que se desbloquean al completar fases (ej: "El camino del guerrero metabólico")
- **Por qué**: Añade capa narrativa que hace el progreso más memorable
- **Cómo**: Textos pre-escritos, desbloqueo por hitos
- **Complejidad**: Baja (1-2 días para contenido)
- **Impacto**: Medio

### F.2 Mascota virtual evolutiva

- **Qué**: Una mascota que evoluciona según el progreso (huevo → cría → adulto → legendario)
- **Por qué**: Conexión emocional, motivación visual
- **Cómo**: SVGs o emojis que cambian según nivel/logros
- **Complejidad**: Media (2-3 días para assets + lógica)
- **Impacto**: Medio-Alto (especialmente si gusta la gamificación)

### F.3 Modo "noche de trampa" planificada

- **Qué**: El usuario puede planificar una comida libre sin que cuente como fallo
- **Por qué**: Reduce ansiedad, hace el plan más sostenible
- **Cómo**: Toggle en el día, no afecta racha ni XP negativo
- **Complejidad**: Baja (0.5 días)
- **Impacto**: Alto (alineado con "no castigar días fallidos")

---

## G. Integraciones creativas

### G.1 Spotify / música de entrenamiento

- **Qué**: Integración con Spotify para playlists de entrenamiento
- **Por qué**: La música mejora el rendimiento y la experiencia
- **Cómo**: Spotify Web API, playlists curadas por tipo de entrenamiento
- **Complejidad**: Media (2-3 días)
- **Impacto**: Medio

### G.2 Strava sync

- **Qué**: Sincronizar actividades de Strava (running, cycling)
- **Por qué**: Muchos usuarios ya usan Strava para cardio
- **Cómo**: Strava API (OAuth, actividades)
- **Complejidad**: Media (2-3 días)
- **Impacto**: Medio

### G.3 Google Sheets export

- **Qué**: Exportar datos a Google Sheets automáticamente
- **Por qué**: Permite análisis personalizado con fórmulas y gráficos propios
- **Cómo**: Google Sheets API, sync periódico
- **Complejidad**: Media (2-3 días)
- **Impacto**: Medio

---

## H. Accesibilidad e inclusión

### H.1 Modo alto contraste

- **Qué**: Tema con contraste extra para usuarios con visión reducida
- **Por qué**: Accesibilidad real, no solo cumplimiento
- **Cómo**: Tema CSS adicional, toggle en Ajustes
- **Complejidad**: Baja (1 día)
- **Impacto**: Medio

### H.2 Modo "solo texto"

- **Qué**: Versión simplificada sin animaciones ni elementos visuales complejos
- **Por qué**: Usuarios que prefieren minimalismo o tienen dispositivos antiguos
- **Cómo**: Toggle en Ajustes, CSS alternativo
- **Complejidad**: Baja (1 día)
- **Impacto**: Bajo

### H.3 Multi-idioma

- **Qué**: Soporte para inglés, portugués, catalán, etc.
- **Por qué**: Si se abre a más usuarios, el idioma es barrera
- **Cómo**: next-intl o similar, archivos de traducción
- **Complejidad**: Media (3-5 días para infraestructura + traducciones)
- **Impacto**: Medio (solo si se abre a más usuarios)

---

## I. Privacidad y control de datos

### I.1 Exportación de datos en múltiples formatos

- **Qué**: Exportar en JSON (ya existe), CSV, PDF
- **Por qué**: Portabilidad de datos, análisis externo
- **Cómo**: Generadores adicionales en `app/domain/export.ts`
- **Complejidad**: Baja (1-2 días)
- **Impacto**: Medio

### I.2 Borrado selectivo de datos

- **Qué**: Borrar datos de un período específico (ej: "borrar datos de enero")
- **Por qué**: Control granular sobre los datos personales
- **Cómo**: Endpoint de borrado con filtro de fechas
- **Complejidad**: Baja (1 día)
- **Impacto**: Medio

### I.3 "Modo incógnito" temporal

- **Qué**: Pausar registro de datos sin borrar nada
- **Por qué**: Vacaciones, enfermedad, periodos de descanso
- **Cómo**: Flag en perfil, no se registran acciones ni métricas
- **Complejidad**: Baja (0.5 días)
- **Impacto**: Bajo

---

## Priorización sugerida

### Alta prioridad (impacto alto, complejidad baja-media)
1. **A.1** Registro de ánimo y energía
2. **A.3** Diario de notas libre
3. **B.1** Banco de recetas saludables
4. **E.2** Preferencias alimentarias y alergias
5. **F.3** Modo "noche de trampa" planificada
6. **D.3** Informe mensual para el médico
7. **I.1** Exportación en múltiples formatos
8. **B.3** ⭐ Análisis nutricional por visión artificial (solicitud explícita del usuario)

### Media prioridad (impacto medio-alto, complejidad media)
8. **A.2** Registro de sueño manual
9. **B.2** Lista de la compra automática
10. **C.1** Accountability partner
11. **D.1** Correlaciones automáticas
12. **F.2** Mascota virtual evolutiva
13. **G.2** Strava sync
14. **B.3**  Análisis nutricional por visión artificial (promovido a alta prioridad por el usuario)

### Baja prioridad (impacto medio-bajo o complejidad alta)
14. **B.3** Fotos de comidas
15. **C.2** Comunidad privada
16. **D.2** Predicción de adherencia
17. **E.1** Perfiles de entrenamiento intercambiables
18. **F.1** Quests narrativos
19. **G.1** Spotify integration
20. **G.3** Google Sheets export
21. **H.1-H.3** Accesibilidad avanzada y multi-idioma
22. **I.2-I.3** Borrado selectivo y modo incógnito

---

## Nota sobre la API de datos de salud

El usuario mencionó que puede facilitar datos de APIs para consultar analíticas. Sería crucial saber:

1. **¿Qué APIs específicas tiene disponibles?** (laboratorio, wearable, nutrición)
2. **¿Qué formato de datos proporcionan?** (JSON, XML, CSV, PDF)
3. **¿Qué autenticación requieren?** (OAuth, API key, scraping)
4. **¿Qué frecuencia de actualización tienen?** (tiempo real, diario, por análisis)

Esta información determinará el alcance real de la Fase 9 (Integraciones) y la Fase 8 (IA con datos reales).
