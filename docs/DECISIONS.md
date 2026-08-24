# Registro de decisiones

## 2026-08-21: nombre VitaQuest

Se elige VitaQuest porque comunica salud, progreso y juego sin limitar el producto a un diagnóstico, un deporte o una métrica concreta.

## 2026-08-21: primera superficie Hoy

La primera entrega empieza por un panel diario porque es la pantalla que concentra la acción y permite validar rápido si el producto ayuda a decidir qué hacer hoy.

## 2026-08-21: despliegue en Railway

Railway será la infraestructura objetivo para la aplicación independiente. El repositorio debe poder desplegarse desde su raíz sin depender de la instalación local del agente.

## 2026-08-21: persistencia por fases

No se conecta PostgreSQL en el scaffold inicial. Primero se valida la experiencia y después se añade el modelo de datos, migraciones, autenticación y copias de seguridad con una decisión separada.

## 2026-08-22: persistencia fase 2

Se adopta Drizzle con PostgreSQL para guardar el perfil personal, acciones diarias, comidas, entrenamientos y analíticas. La primera instalación sigue siendo de un único perfil; la autenticación queda pendiente antes de abrir el producto a más usuarios. No se enlaza todavía un proyecto Railway porque falta confirmar el destino remoto.

## 2026-08-22: producto móvil fase 3

Se elige una PWA ligera, sin migrar a una aplicación nativa. El shell se puede instalar, cachea la superficie inicial y mantiene la interfaz útil sin conexión. La exportación empieza como JSON portable para no atar los datos a una herramienta externa.

## 2026-08-22: evolución fase 4

Los recordatorios empiezan como preferencias locales porque todavía no hay identidad autenticada ni servicio de notificaciones. Los objetivos de 12 semanas y los logros se calculan desde la adherencia observable; más adelante se trasladarán a PostgreSQL cuando exista una cuenta de usuario.

## 2026-08-23: nombre VitaQuest confirmado

Se mantiene "VitaQuest" como nombre del producto. No se renombra a "Metabolic Quest" a pesar del rediseño visual propuesto.

**Motivo**: El usuario prefiere mantener el nombre actual.

## 2026-08-23: alcance personal confirmado

La aplicación seguirá siendo de uso personal. No se implementará autenticación multi-usuario ni se abrirá a terceros en el plan actual.

**Motivo**: El usuario confirmó que es una herramienta personal.

## 2026-08-23: IA con modelo local

Se usará un modelo local compatible con API OpenAI para la función inteligente (Fase 8). El usuario facilitará la configuración (URL, API key, nombre del modelo) cuando se implemente esta fase.

**Motivo**: Privacidad total de datos de salud, sin costes de API, control completo.

## 2026-08-23: configuración de IA recibida

El usuario proporcionó la configuración completa del endpoint de IA:

- **Provider**: openai_compatible_local_ollama
- **Local**: `http://127.0.0.1:18080/v1`
- **Público**: `https://llm.cerotenedores.com/v1`
- **API Key**: (se mantiene en `VITAQUEST_AI_API_KEY`, valor real no versionado)
- **Modelo default**: `qwen2.5-coder-32k:latest`
- **Temperatura**: 0.2
- **Stream**: false

**Modelos recomendados**:
- Coder default: `qwen2.5-coder-32k:latest`
- Coder heavy: `qwen3-coder-30b:latest`
- General: `gpt-oss:20b`
- Fast/light: `gemma3:4b`
- Vision: `llama3.2-vision:latest`
- Embeddings: `nomic-embed-text:latest`

**Decisión**: Usar endpoint local en desarrollo, endpoint público en producción (Railway).

**Motivo**: El usuario tiene ambos endpoints disponibles, lo que permite que la IA funcione tanto en desarrollo local como en producción desplegada.

## 2026-08-23: análisis nutricional por visión artificial

Se añade como mejora futura (Fase 8.4.1) la capacidad de analizar fotos de platos de comida usando el modelo de visión `llama3.2-vision:latest` para extraer automáticamente valores nutricionales estimados.

**Funcionalidad**:
- El usuario hace una foto de su plato
- La IA identifica alimentos y estima valores nutricionales (calorías, proteínas, carbs, grasas, fibra)
- El usuario puede confirmar o ajustar los valores
- Se guarda la foto + datos nutricionales en el diario de comidas

**Modelo requerido**: `llama3.2-vision:latest` (ya disponible en la configuración de IA)

**Motivo**: Solicitud explícita del usuario para reducir la fricción de registro nutricional. Los valores son estimaciones orientativas, no análisis profesional.

## 2026-08-23: integraciones externas pospuestas

La Fase 9 (Integraciones con wearables, APIs de salud, etc.) queda pospuesta. El usuario no tiene APIs de datos de salud disponibles de momento.

**Motivo**: Sin APIs disponibles, no hay nada que integrar. Se reactivará cuando el usuario confirme qué APIs tiene.

## 2026-08-23: persistencia dual (SQLite local, PostgreSQL en Railway)

La aplicación usa dos bases de datos según el entorno:

- **Desarrollo local**: SQLite mediante `sql.js`, guardando los datos en `vitaquest.db` (ignorado por git). No requiere `DATABASE_URL`.
- **Producción (Railway)**: PostgreSQL, tal y como describe `docs/ARCHITECTURE.md`.

**Motivo**: Confirmado por el usuario: Railway va en PostgreSQL y el desarrollo local en SQLite.

**Nota de implementación**: el cliente actual (`db/client.ts`) usa `drizzle-orm/sql-js`; la rama PostgreSQL se reintroduce cuando se prepare el despliegue remoto. Los valores `created_at`/`updated_at` usan `$defaultFn(() => new Date())` (aplicados por el ORM), sin default a nivel de DDL.

## 2026-08-23: métricas metabólicas sobre lab_records

Para la Fase 6 se reutiliza la tabla `lab_records` (creada en la Fase 2) en lugar de crear una nueva tabla `metabolic_markers`. Las métricas metabólicas se identifican por el campo `marker` (valores `triglycerides`, `insulin_resistance`, `fatty_liver_index`, `alt_gpt`). El contexto interpretativo y la tendencia se calculan en `app/domain/metabolic-markers.ts` (no se almacenan).

**Motivo**: Evitar una tabla redundante con `lab_records`, que ya guarda marcador, valor, unidad y fecha. El contexto y la tendencia son derivables y no necesitan persistirse.

## 2026-08-23: diario de entrenamiento (Fase 7)

- La biblioteca de ejercicios es una constante en `app/domain/training.ts` (no una tabla `exercise_library`): sirve solo de autocomplete; el nombre del ejercicio se guarda como texto libre en `exercise_entries.exercise_name`.
- Se añade una sexta pestaña "Entreno" a la navegación (además de Hoy, Semana, Retos, Progreso, Ajustes) para alojar el diario de entrenamiento, que no encajaba limpiamente en las pestañas existentes.
- El 1RM se estima con la fórmula de Epley (`peso × (1 + reps/30)`).

## 2026-08-23: XP acumulado y sistema de niveles (Fase 10)

- El XP mostrado pasa a ser **acumulado**: suma del `xp` de todos los `daily_records` más 40 XP por cada reto completado. Antes se mostraba solo el XP del día actual.
- Curva de niveles: umbrales `[0, 100, 300, 600, 1000, 1500]` XP con títulos Novato → Explorador → Guerrero → Veterano → Maestro → Leyenda.
- Los logros se calculan desde datos reales (racha, sesiones de fuerza/cardio, métricas, PRs) en `app/domain/achievements.ts`.

## 2026-08-23: sin sistema de "vida/energía" (Fase 10.7)

No se implementa el sistema de vidas/energía. Va contra el principio del producto de "no castigar los días fallidos" y puede generar ansiedad. Se mantiene como alternativa futura el concepto de "días de descanso planificados" (no cuentan como fallo de racha).

## 2026-08-23: misiones del día y temas cosméticos (Fase 10)

- La "Misión del día" es una misión rotatoria determinística por fecha (sin persistencia), mostrada en la pestaña Hoy con bonus XP orientativo.
- Los temas cosméticos (verde/azul/púrpura/dorado) se desbloquean por nivel y se aplican sobrescribiendo las variables CSS `--green-*` mediante el atributo `data-theme` en `<html>`.
- El multiplicador de XP por racha (`streakXpMultiplier`) se muestra en el header; no modifica aún la fórmula de XP acumulado.

## 2026-08-23: rachas por categoría y retos adaptativos (Fase 10)

- **Rachas por categoría** (`app/domain/category-streaks.ts`): tres rachas derivadas de datos reales y calculadas en el servidor dentro de `/api/dashboard`.
  - **Pasos**: días consecutivos con la acción de pasos completada (`walk-8000-steps` o `steps-8000`).
  - **Fibra**: días consecutivos con la acción `fiber-30g` completada. Se añade esta acción a las misiones iniciales para que la fibra (objetivo ya existente en el perfil) sea medible.
  - **Fuerza**: semanas consecutivas con al menos `strengthGoal` (por defecto 3) sesiones de fuerza registradas.
  - Las rachas de pasos y fibra permiten que "hoy" esté todavía en curso (se cuenta desde ayer); la de fuerza permite que la semana actual esté en curso.
- **Eventos temporales** (`app/domain/events.ts`): un evento temático mensual determinístico por fecha, sin persistencia (mismo patrón que la misión del día).
- **Retos adaptativos** (`app/domain/adaptive-challenges.ts`): retos derivados del nivel del usuario (fácil → especial), mostrados sin persistencia como objetivo a alcanzar.
- Tanto el evento del mes como los retos adaptativos son informativos (no modifican el XP acumulado ni requieren migración); los retos semanales existentes siguen siendo los únicos con recompensa de XP persistida.

## 2026-08-24: mejoras UX/UI móvil (Fase 11)

- **Bottom navigation en móvil**: en pantallas ≤767px la navegación pasa de una barra horizontal superior (sticky) a una barra fija inferior con icono + etiqueta apilados, respetando `safe-area-inset-bottom`. En escritorio se mantiene la navegación superior existente.
- **Targets táctiles**: todos los controles interactivos (pills de día, misiones, comidas, retos, botones secundarios y de registrar) tienen `min-height`/`min-width` de al menos 44px.
- **Formularios mobile-first**: los campos numéricos usan `inputMode` y `enterKeyHint`; las fechas ya usaban `type="date"`.
- **Rendimiento**: los componentes de gráficos (`MetricSparkline`, `MetricLineChart`) y el calendario de entrenamiento (`WorkoutCalendar`) se extraen a `app/charts.tsx` y se cargan con `next/dynamic` (code splitting + lazy loading). Los helpers de formato se mueven a `app/format.ts`.
- **Offline**: el service worker cachea lecturas de `/api/` (red primero, caché como respaldo) y la interfaz muestra un aviso de "Sin conexión". La misión del día se encola en `localStorage` (`app/offline-queue.ts`) cuando no hay conexión y se reenvía al recuperar la conexión. El resto de escrituras mantienen su comportamiento anterior (aviso de error).
- **Accesibilidad**: la navegación usa semántica de tabs ARIA (`role="tablist"`/`tab`/`tabpanel`, `aria-selected`, `aria-controls`), el estado de carga usa `aria-busy`/`aria-live` y los errores usan `role="alert"`.
- **Microinteracciones**: efecto de pulsación (`:active` escala sutil) en botones; se respeta `prefers-reduced-motion` ya existente.

**Motivo**: llevar la experiencia móvil a un estándar táctil y accesible sin cambiar el producto ni añadir dependencias. El score de Lighthouse y el tiempo en 4G quedan por verificar con métricas reales.

## 2026-08-24: función inteligente (Fase 8) con endpoint público

Se implementa la Fase 8 (función inteligente) con las siguientes decisiones:

- **Endpoint público solo**: la llamada a la IA usa únicamente el endpoint público `https://llm.cerotenedores.com/v1` (constante `AI_BASE_URL` en `app/ai/client.ts`). No se usa el endpoint local `http://127.0.0.1:18080/v1`, a petición explícita del usuario.
- **Cliente sin dependencia nueva**: el cliente es una función `fetch` contra `/v1/chat/completions` (`app/ai/client.ts`), sin instalar el SDK `openai`.
- **Configuración por variables de entorno**: `VITAQUEST_AI_API_KEY` (obligatoria) y `VITAQUEST_AI_MODEL` (opcional, default `qwen2.5-coder-32k:latest`). La API key se mantiene en `.env.local`/Railway y nunca se expone al cliente.
- **Modelos seleccionables**: `app/domain/ai-models.ts` define la lista permitida (coder default, coder heavy, general, rápido). El usuario puede elegir el modelo en Ajustes; la elección se guarda en `localStorage` y se valida en el servidor con `resolveModel`.
- **Reglas puras en el dominio**: `app/domain/insights.ts` contiene detección de anomalías, insights rule-based y respuestas de fallback del chat; `app/domain/ai-prompts.ts` contiene el system prompt (sin diagnósticos, en español) y el parseo de la respuesta JSON.
- **Fallback rule-based**: si la IA no está configurada o falla, `/api/ai/insights` y `/api/ai/chat` devuelven resultados deterministas (`source: "rules"`), de modo que la función nunca queda vacía.
- **Sin persistencia de conversaciones**: los insights y el chat son efímeros (no se guardan en base de datos) en esta fase; solo se envían a la IA datos sanitizados sin identificadores personales.

**Motivo**: privacidad de los datos de salud y simplicidad. El usuario pidió explícitamente usar solo el endpoint público.

## 2026-08-24: DevOps e infraestructura (Fase 12)

Se implementa la Fase 12 con las siguientes decisiones:

- **CI/CD**: un único workflow `.github/workflows/ci.yml` ejecuta typecheck, lint, test (`bun test`) y build en push a `main` y en PR. No se añade lint de workflow (actionlint) para no aumentar dependencias.
- **Despliegue**: `.github/workflows/deploy.yml` es manual (`workflow_dispatch`) y elige `staging`/`production`; usa el CLI de Railway (`@railway/cli`) con `RAILWAY_TOKEN`. No se activa despliegue automático desde `main`.
- **Rate limiting en memoria**: `app/rate-limit.ts` implementa ventana fija con estado en memoria (no distribuido). Se aplica a login (10/10 min), API general (300/min) e IA (20/min) por IP. Se asume una sola instancia (app personal); un límite distribuido requeriría Redis.
- **Cabeceras de seguridad**: cabeceras base siempre; CSP y HSTS solo en producción. El CSP usa `'unsafe-inline'` para scripts/estilos porque Next.js inyecta scripts en línea; un CSP con nonce queda como mejora futura.
- **Backups**: `scripts/backup-db.mjs` soporta SQLite (copia del archivo, realidad actual) y PostgreSQL (`pg_dump` cuando `DATABASE_URL` está definido). La rama PostgreSQL de `db/client.ts` sigue sin reintroducirse; el backup SQLite es el que aplica hoy. En Railway se recomiendan los backups nativos o una tarea programada.
- **Monitorización**: se documenta UptimeRobot sobre `/api/health` (exenta de auth y rate limiting), sin automatizar la alta del servicio externo.
- **Staging**: entorno Railway independiente, desplegado solo por workflow manual.

**Motivo**: dotar al producto de infraestructura mínima sin crear/enlazar recursos remotos (que requieren confirmación explícita) ni añadir dependencias.

## Cómo añadir una decisión

Usa la fecha, el contexto, la decisión y el motivo. Si una decisión queda obsoleta, no la borres: añade una nueva entrada que la reemplace.
