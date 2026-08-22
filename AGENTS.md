# VitaQuest

VitaQuest es una aplicación personal de hábitos de salud, alimentación, entrenamiento y seguimiento de analíticas. El producto debe ayudar a mantener la constancia sin castigar los días imperfectos.

## Fuente de verdad

- `docs/PRODUCT.md` contiene el alcance y los requisitos funcionales.
- `docs/ARCHITECTURE.md` contiene las decisiones técnicas y los límites de la primera versión.
- `docs/DECISIONS.md` registra decisiones que no deben perderse entre sesiones.
- `docs/ROADMAP.md` contiene el orden de trabajo acordado.

## Instrucciones de trabajo para Codex

- Leer este archivo y la documentación de `docs/` antes de cambiar el producto.
- Mantener la interfaz en español salvo que el usuario pida otro idioma.
- Tratar los datos de salud como sensibles: no inventar diagnósticos, recomendaciones clínicas ni valores de analíticas.
- Priorizar cambios pequeños, verificables y fáciles de revertir.
- No añadir autenticación, pagos, recordatorios ni integraciones externas sin actualizar primero la documentación de alcance.
- Antes de cerrar una tarea, ejecutar la comprobación de tipos y la validación disponible, y describir lo que no haya podido verificarse.

## Comandos

```text
pnpm dev       # desarrollo local
pnpm build     # compilación de producción
pnpm start     # servidor de producción
pnpm typecheck # comprobación estricta de TypeScript
pnpm lint      # Biome
```

## Despliegue

La aplicación está preparada para Railway. El flujo previsto está documentado en `README.md`; no se debe crear ni enlazar un proyecto remoto sin confirmación explícita del usuario.
