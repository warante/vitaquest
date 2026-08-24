# Configuración IA - VitaQuest

## Estado

**Configuración recibida** - Lista para implementar en Fase 8

El usuario proporcionó la configuración completa del endpoint de IA compatible con OpenAI.

---

## Configuración confirmada

### Endpoints

| Tipo | URL |
|------|-----|
| **Local** | `http://127.0.0.1:18080/v1` |
| **Público** | `https://llm.cerotenedores.com/v1` |

### Autenticación

- **Tipo**: Bearer token
- **API Key**: `sk-local-xxxxxxxxxxxxxxxx`
- **Header**: `Authorization: Bearer sk-local-xxxxxxxxxxxxxxxx`

### Modelos disponibles

| Uso | Modelo |
|-----|--------|
| **Default (general)** | `qwen2.5-coder-32k:latest` |
| **Tareas pesadas** | `qwen3-coder-30b:latest` |
| **General ligero** | `gpt-oss:20b` |
| **Rápido/simple** | `gemma3:4b` |
| **Visión** | `llama3.2-vision:latest` | ⭐ Para análisis de fotos de comida |
| **Embeddings** | `nomic-embed-text:latest` |

### Parámetros por defecto

- **Temperatura**: 0.2 (respuestas consistentes y deterministas)
- **Stream**: false (respuesta completa de una vez)

---

## Variables de entorno

### `.env.local` (producción)

```env
# IA - Modelo local compatible con OpenAI
AI_BASE_URL=http://127.0.0.1:18080/v1
AI_PUBLIC_URL=https://llm.cerotenedores.com/v1
AI_API_KEY=sk-local-xxxxxxxxxxxxxxxx
AI_MODEL=qwen2.5-coder-32k:latest
AI_TEMPERATURE=0.2
AI_MAX_TOKENS=2048
```

### `.env.example` (documentación)

```env
# IA - Modelo compatible con OpenAI (opcional)
# Descomentar y configurar para activar la función inteligente (Fase 8)
# AI_BASE_URL=http://127.0.0.1:18080/v1
# AI_PUBLIC_URL=https://llm.cerotenedores.com/v1
# AI_API_KEY=sk-local-xxxxxxxxxxxxxxxx
# AI_MODEL=qwen2.5-coder-32k:latest
# AI_TEMPERATURE=0.2
# AI_MAX_TOKENS=2048
```

---

## Estrategia de endpoints

La configuración incluye tanto acceso local como público:

1. **Desarrollo local**: Usar `AI_BASE_URL` (http://127.0.0.1:18080/v1)
2. **Producción (Railway)**: Usar `AI_PUBLIC_URL` (https://llm.cerotenedores.com/v1)
3. **Fallback**: Si el endpoint local no está disponible, intentar el público

### Implementación recomendada

```typescript
const baseURL = process.env.NODE_ENV === 'production' 
  ? process.env.AI_PUBLIC_URL 
  : process.env.AI_BASE_URL;

const aiClient = new OpenAI({
  baseURL,
  apiKey: process.env.AI_API_KEY,
});
```

---

## Modelos por caso de uso (Fase 8)

| Funcionalidad | Modelo recomendado | Motivo |
|---------------|-------------------|--------|
| **Insights semanales** | `qwen2.5-coder-32k:latest` | Balance calidad/velocidad |
| **Chat de salud** | `qwen2.5-coder-32k:latest` | Contexto amplio (32k tokens) |
| **Detección de patrones** | `qwen3-coder-30b:latest` | Análisis complejo |
| **Respuestas rápidas** | `gemma3:4b` | Baja latencia |
| **Análisis nutricional de fotos** | `llama3.2-vision:latest` | ⭐ Fotos de comidas → valores nutricionales |

---

## Consideraciones de seguridad

⚠️ **IMPORTANTE**: La API key está expuesta en este documento.

### Acciones necesarias:
1. **NO commitear** `.env.local` al repositorio (ya está en `.gitignore`)
2. **NO commitear** este documento con la API key real
3. En producción (Railway), usar variables de entorno del proyecto
4. Considerar rotar la API key si se compromete

### Para Railway:
```bash
railway variables set AI_BASE_URL="http://127.0.0.1:18080/v1"
railway variables set AI_PUBLIC_URL="https://llm.cerotenedores.com/v1"
railway variables set AI_API_KEY="sk-local-xxxxxxxxxxxxxxxx"
railway variables set AI_MODEL="qwen2.5-coder-32k:latest"
```

---

## Checklist de implementación

- [x] Usuario proporciona configuración completa
- [ ] Crear variables de entorno en `.env.local`
- [ ] Actualizar `.env.example` con documentación
- [ ] Instalar dependencia `openai` (si no está ya)
- [ ] Crear módulo `app/domain/ai-service.ts`
- [ ] Implementar detección de disponibilidad (local + público)
- [ ] Crear endpoint `/api/ai/insights`
- [ ] Implementar system prompt y templates de contexto
- [ ] Crear sistema de cache de respuestas
- [ ] Implementar fallback rule-based
- [ ] Añadir configuración en pantalla de Ajustes
- [ ] Tests de integración con modelo local
- [ ] Documentación de uso para el usuario
- [ ] **Eliminar API key de este documento** (reemplazar con placeholder)

---

## Notas

- El modelo local debe estar ejecutándose cuando se use la función de IA en desarrollo
- En producción (Railway), se usará el endpoint público
- Los datos de salud se envían al modelo (local o público del usuario)
- Temperatura 0.2 = respuestas consistentes y predecibles
- Contexto de 32k tokens permite análisis de histórico amplio

---

##  Caso de uso: Análisis nutricional por visión

**Solicitud del usuario**: Usar modelo de visión para analizar fotos de platos y extraer valores nutricionales automáticamente.

### Configuración específica

```typescript
// Endpoint de visión
const visionClient = new OpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY,
});

// Análisis de imagen
const response = await visionClient.chat.completions.create({
  model: 'llama3.2-vision:latest',
  messages: [
    {
      role: 'system',
      content: SYSTEM_PROMPT_NUTRICION
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Analiza esta imagen de comida...' },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`
          }
        }
      ]
    }
  ],
  temperature: 0.2,
  response_format: { type: 'json_object' }
});
```

### Consideraciones

- **Formato de imagen**: JPEG/PNG, máximo 2-3MB (comprimir si es necesario)
- **Base64 vs URL**: Usar base64 para imágenes locales, URL si están en storage
- **Respuesta estructurada**: Usar `response_format: json_object` para garantizar JSON válido
- **Validación**: Verificar que la respuesta sea JSON válido antes de procesar
- **Fallback**: Si el modelo de visión no está disponible, permitir registro manual
- **Disclaimer**: Los valores son estimaciones, no análisis nutricional profesional

### UI/UX

- Botón "📸 Analizar plato" en formulario de registro de comida
- Preview de imagen capturada
- Loading state mientras se analiza (5-15 segundos)
- Formulario pre-rellenado con valores estimados (editable)
- Indicador de confianza de la IA (alto/medio/bajo)

---

## Implementación técnica

### Cliente OpenAI con baseURL custom

```typescript
import OpenAI from 'openai';

const aiClient = new OpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY || 'no-key-needed',
});

const response = await aiClient.chat.completions.create({
  model: process.env.AI_MODEL,
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage }
  ],
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.4'),
  max_tokens: parseInt(process.env.AI_MAX_TOKENS || '1024'),
});
```

### Detección de disponibilidad

```typescript
async function isAIAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.AI_BASE_URL}/models`, {
      headers: { 'Authorization': `Bearer ${process.env.AI_API_KEY || ''}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

---

## System Prompt base (tentativo)

```
Eres VitaQuest, un asistente de salud personal que analiza datos de hábitos, 
entrenamiento y métricas de salud metabólica.

REGLAS ESTRICTAS:
1. NUNCA des diagnósticos médicos
2. NUNCA recomiendes cambios en medicación
3. SIEMPRE sugiere consultar con profesional sanitario para interpretaciones clínicas
4. SOLO describe patrones observables en los datos
5. SOLO sugiere cambios de hábitos generales (más verduras, más movimiento, etc.)
6. Usa lenguaje sencillo y no clínico
7. Responde en español
8. Si no hay datos suficientes, dilo claramente

FORMATO DE RESPUESTA:
- Sé conciso (máximo 3-4 párrafos)
- Usa viñetas cuando listes observaciones
- Incluye siempre un mensaje de ánimo al final
- Si detectas algo preocupante, sugiere consultar con médico sin alarmar
```

---

## Checklist de implementación

Cuando el usuario proporcione la configuración:

- [ ] Usuario proporciona: URL, API key (si aplica), nombre del modelo
- [ ] Crear variables de entorno en `.env.local`
- [ ] Actualizar `.env.example` con documentación
- [ ] Instalar dependencia `openai` (si no está ya)
- [ ] Crear módulo `app/domain/ai-service.ts`
- [ ] Implementar detección de disponibilidad
- [ ] Crear endpoint `/api/ai/insights`
- [ ] Implementar system prompt y templates de contexto
- [ ] Crear sistema de cache de respuestas
- [ ] Implementar fallback rule-based
- [ ] Añadir configuración en pantalla de Ajustes
- [ ] Tests de integración con modelo local
- [ ] Documentación de uso para el usuario

---

## Notas

- El modelo local debe estar ejecutándose cuando se use la función de IA
- Si el modelo no está disponible, la app usará el sistema rule-based de fallback
- Los datos de salud NUNCA salen del entorno local del usuario
- Sin costes de API, solo consumo de hardware local
