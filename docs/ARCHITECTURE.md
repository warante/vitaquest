# Arquitectura

## Stack

- Vite + React 19 para una SPA estática.
- TypeScript estricto.
- CSS propio (dark mode, verde esmeralda).
- Dexie.js sobre IndexedDB para persistencia local en el dispositivo.
- PWA con `vite-plugin-pwa` (service worker, manifest, offline).
- GitHub Pages como plataforma de despliegue.

## Capas

```text
src/                 interfaz y componente principal
src/db/              esquema Dexie y operaciones CRUD
src/domain/          reglas de producto puras (XP, rachas, insignias, etc.)
src/charts.tsx       componentes de visualización (sparklines, calendario)
src/format.ts        utilidades de formato
docs/                contexto persistente del proyecto
```

## Datos

La persistencia usa Dexie.js sobre IndexedDB. No hay servidor ni base de datos remota. Todos los datos viven en el dispositivo del usuario.

Tablas:
- `profile`: configuración y objetivos del usuario (registro único).
- `dailyRecords`: resumen diario de acciones completadas.
- `dailyActions`: detalle de acciones por día.
- `meals`: comidas registradas por fecha.
- `workouts`: actividad física registrada.
- `labRecords`: analíticas y métricas de salud.
- `challenges`: retos semanales y personalizados.
- `trainingSessions`: sesiones de entrenamiento.
- `exerciseEntries`: ejercicios dentro de cada sesión.
- `exerciseSets`: series de cada ejercicio.

## Importación y exportación

La app permite exportar todos los datos como JSON e importar una copia previa desde otro dispositivo. Esto sustituye la sincronización en la nube.

## Despliegue

GitHub Pages sirve los archivos estáticos generados por Vite. El workflow `.github/workflows/deploy-pages.yml` se ejecuta en cada push a `main`, compila la app y despliega el directorio `dist/`.

## PWA

La app es instalable en Android y otros dispositivos móviles. `vite-plugin-pwa` genera el service worker y el manifest automáticamente. El service worker cachea los assets estáticos para funcionamiento offline.

## Seguridad y privacidad

- No hay servidor, no hay autenticación, no hay datos en la nube.
- Todos los datos permanecen en el dispositivo del usuario.
- No se recopilan datos personales fuera del dispositivo.
- La exportación/importación JSON permite al usuario controlar sus datos.

## DevOps

- CI: typecheck, lint y build en cada push.
- Deploy automático a GitHub Pages desde `main`.
- Biome para lint y formato.
