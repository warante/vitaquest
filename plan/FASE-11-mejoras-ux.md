# Fase 11: Mejoras UX/UI Móvil

## Objetivo

Optimizar la experiencia móvil de Metabolic Quest para que sea rápida, intuitiva y agradable de usar diariamente en un smartphone.

## Análisis

La app se usará principalmente en dispositivo móvil. Las claves son:
- Navegación táctil fluida
- Inputs optimizados para dedos (no ratón)
- Carga rápida incluso en 4G
- Funcionalidad offline básica
- Accesibilidad completa
- Animaciones sutiles que den feedback sin distraer

## Tareas

### 11.1 Navegación móvil optimizada

- [ ] **11.1.1** Bottom navigation bar fija en móvil (5 tabs: Hoy, Semana, Retos, Progreso, Ajustes)
  - Icono + label en cada tab
  - Tab activo con indicador visual (fondo verde o underline)
  - Altura: 56-64px, safe area para iPhone (notch/home indicator)
- [ ] **11.1.2** Transiciones entre tabs: slide horizontal suave (200-300ms)
- [ ] **11.1.3** Gestos de swipe entre tabs (swipe left/right para cambiar de tab)
- [ ] **11.1.4** Deep linking: cada tab tiene URL propia para poder compartir/bookmark
- [ ] **11.1.5** Estado de navegación persistido: al volver a la app, mantener la última tab visitada

**Rol:** UX/UI Designer + Frontend Dev
**Estimación:** 2-3 días
**Dependencias:** 5.3 (reestructuración de navegación)
**Riesgo:** Bajo

### 11.2 Interacciones táctiles

- [ ] **11.2.1** Todos los botones y targets táctiles ≥ 44x44px (Apple HIG) / ≥ 48x48dp (Material Design)
- [ ] **11.2.2** Feedback háptico al completar misiones (vibración sutil, si el dispositivo lo soporta)
- [ ] **11.2.3** Feedback visual inmediato al tocar:
  - Misiones: checkbox se marca con animación de scale + color
  - Botones: ripple effect o scale down al presionar
  - Cards: lift effect (sombra aumenta) al presionar
- [ ] **11.2.4** Pull-to-refresh en pantallas de datos (Hoy, Progreso)
- [ ] **11.2.5** Long-press en misiones para ver detalles o editar (context menu)
- [ ] **11.2.6** Swipe en misiones para acciones rápidas:
  - Swipe right: marcar como completada
  - Swipe left: posponer para mañana

**Rol:** UX/UI Designer + Frontend Dev
**Estimación:** 3 días
**Dependencias:** 5.5 (misiones rediseñadas)
**Riesgo:** Bajo

### 11.3 Formularios mobile-first

- [ ] **11.3.1** Todos los inputs numéricos usan `inputMode="numeric"` para teclado numérico
- [ ] **11.3.2** Inputs de texto con `autoComplete` apropiado para sugerencias del navegador
- [ ] **11.3.3** Selectores de fecha: date picker nativo del dispositivo
- [ ] **11.3.4** Sliders para valores rangos (RPE, objetivos numéricos)
- [ ] **11.3.5** Toggle switches en lugar de checkboxes para settings binarios
- [ ] **11.3.6** Autoguardado de formularios largos (diario de entrenamiento) cada 30 segundos
- [ ] **11.3.7** Validación inline con mensajes de error claros y en español

**Rol:** Frontend Dev + UX/UI Designer
**Estimación:** 2 días
**Dependencias:** 7.3 (formulario de entrenamiento)
**Riesgo:** Bajo

### 11.4 Rendimiento móvil

- [ ] **11.4.1** Code splitting por ruta: cada tab carga solo su código
- [ ] **11.4.2** Lazy loading de imágenes e iconos
- [ ] **11.4.3** Virtualización de listas largas (histórico de métricas, logros)
- [ ] **11.4.4** Precaching de rutas principales en el service worker
- [ ] **11.4.5** Optimizar bundle size: analizar con `@next/bundle-analyzer`
- [ ] **11.4.6** Target: First Contentful Paint < 1.5s en 4G, Time to Interactive < 3s
- [ ] **11.4.7** Minimizar re-renders con `React.memo`, `useMemo`, `useCallback` donde aplique

**Rol:** Frontend Dev + DevOps
**Estimación:** 2-3 días
**Dependencias:** Arquitectura actual
**Riesgo:** Medio (optimización puede requerir refactor)

### 11.5 Offline y PWA mejorada

- [ ] **11.5.1** Cache de datos esenciales para consulta offline:
  - Plan de la semana actual
  - Misiones del día
  - Últimas métricas de salud
  - Banco de sustituciones de comidas
- [ ] **11.5.2** Queue de acciones offline: si el usuario marca misiones sin conexión, se sincronizan al reconectar
- [ ] **11.5.3** Indicador visual de estado de conexión (online/offline)
- [ ] **11.5.4** Pantalla de "sin conexión" amigable con datos cacheados visibles
- [ ] **11.5.5** Background sync para enviar datos pendientes cuando se recupere la conexión
- [ ] **11.5.6** Actualización del service worker con versión de cache incrementada

**Rol:** Frontend Dev + DevOps
**Estimación:** 3-4 días
**Dependencias:** PWA existente (fase 3)
**Riesgo:** Medio (sync offline puede ser complejo)

### 11.6 Accesibilidad

- [ ] **11.6.1** Audit completo con Lighthouse Accessibility (target: score 100)
- [ ] **11.6.2** Navegación completa por teclado (tab order lógico)
- [ ] **11.6.3** ARIA labels en todos los elementos interactivos
- [ ] **11.6.4** Contraste de colores WCAG AA mínimo (4.5:1 para texto normal)
- [ ] **11.6.5** Soporte para screen readers (VoiceOver en iOS, TalkBack en Android)
- [ ] **11.6.6** Textos escalables: la app funciona con tamaño de fuente del sistema aumentado
- [ ] **11.6.7** Reducir animaciones si el usuario tiene `prefers-reduced-motion` activado
- [ ] **11.6.8** Skip links y landmarks ARIA para navegación por teclado

**Rol:** QA + Frontend Dev
**Estimación:** 2-3 días
**Dependencias:** 5.1 (sistema de diseño)
**Riesgo:** Bajo

### 11.7 Animaciones y microinteracciones

- [ ] **11.7.1** Animación de completado de misión: checkbox → checkmark con scale + color transition
- [ ] **11.7.2** Animación de XP ganado: número flotante que sube y desaparece (+10 XP)
- [ ] **11.7.3** Animación de racha: fuego que crece al mantener racha
- [ ] **11.7.4** Animación de logro desbloqueado: card que aparece con bounce + brillo
- [ ] **11.7.5** Transición de ring de progreso: animación suave al cargar
- [ ] **11.7.6** Skeleton loaders mientras cargan datos (no spinners)
- [ ] **11.7.7** Todas las animaciones respetan `prefers-reduced-motion`
- [ ] **11.7.8** Duración de animaciones: 150-300ms (rápidas, no distraen)

**Rol:** UX/UI Designer + Frontend Dev
**Estimación:** 2-3 días
**Dependencias:** 5.1, componentes existentes
**Riesgo:** Bajo

### 11.8 Notificaciones push (fase posterior)

- [ ] **11.8.1** Investigar Web Push API para PWA:
  - Notificaciones de recordatorio de misiones
  - Notificación de resumen semanal
  - Notificación de logro desbloqueado
- [ ] **11.8.2** Configuración de notificaciones en Ajustes:
  - Hora de recordatorio matutino (ej: 8:00)
  - Hora de recordatorio de entrenamiento
  - Hora de resumen semanal
  - Tipos de notificación activados/desactivados
- [ ] **11.8.3** Service worker para recibir y mostrar push notifications
- [ ] **11.8.4** Nota: las notificaciones push en PWA tienen soporte limitado en iOS

**Rol:** Frontend Dev + DevOps
**Estimación:** 3-4 días
**Dependencias:** 5.13 (Ajustes), service worker existente
**Riesgo:** Medio (soporte iOS limitado)

### 11.9 Widgets de pantalla de inicio (futuro, nativo)

- [ ] **11.9.1** Investigar viabilidad de widgets para PWA:
  - Widget de resumen del día (misiones pendientes)
  - Widget de racha y XP
  - Widget de métrica de salud principal
- [ ] **11.9.2** Si PWA no soporta widgets nativos, considerar:
  - TWA (Trusted Web Activity) para Android
  - Documentación para el usuario sobre cómo añadir PWA a home screen

**Rol:** Mobile Dev + UX/UI Designer
**Estimación:** 2-3 días (investigación) + 5-7 días (implementación si viable)
**Dependencias:** Investigación de viabilidad
**Riesgo:** Alto (widgets nativos requieren app nativa o TWA)

## Criterios de aceptación

- [ ] La app es completamente usable en viewport 375px (iPhone SE)
- [ ] Todos los targets táctiles son ≥ 44x44px
- [ ] Las transiciones entre tabs son suaves y rápidas
- [ ] La app carga en < 3s en 4G
- [ ] Funciona offline para consulta de datos cacheados
- [ ] Lighthouse Accessibility score ≥ 95
- [ ] Las animaciones son sutiles y respetan reduced-motion
- [ ] Los formularios son fáciles de usar con teclado numérico en móvil

## Testing móvil

- Probar en iPhone SE (375px), iPhone 14 (390px), Samsung Galaxy S21 (360px)
- Probar en Chrome Android, Safari iOS, Firefox Android
- Probar con 3G throttled para rendimiento
- Probar con screen reader activado
- Probar con tamaño de fuente aumentado
