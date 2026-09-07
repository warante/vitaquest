# VitaQuest

VitaQuest es una PWA personal para convertir objetivos de salud en acciones diarias visibles: hábitos, comidas, entrenamiento, progreso, analíticas y recompensas.

Los datos se almacenan localmente en el dispositivo mediante IndexedDB (Dexie.js). No hay servidor ni base de datos remota. La app es instalable en Android y funciona offline.

## Inicio local

Requisitos: Node.js 20+, pnpm 9+.

```bash
pnpm install
pnpm dev
```

Abre `http://localhost:5173`.

## Validación

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Despliegue en GitHub Pages

La app se despliega automáticamente en GitHub Pages mediante GitHub Actions. En cada push a `main`, el workflow `.github/workflows/deploy-pages.yml` compila y despliega el directorio `dist/`.

Para activar:
1. Ve a Settings > Pages del repositorio en GitHub.
2. En "Source", selecciona "GitHub Actions".
3. Haz push a `main` y el workflow se ejecutará automáticamente.

## Importar / Exportar datos

Desde la pestaña **Ajustes** puedes:
- **Exportar** todos tus datos como JSON (backup).
- **Importar** un JSON previamente exportado (migración entre dispositivos).

## Documentación del proyecto

- [Producto](docs/PRODUCT.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Decisiones](docs/DECISIONS.md)
- [Roadmap](docs/ROADMAP.md)
