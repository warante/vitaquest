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

## Cómo añadir una decisión

Usa la fecha, el contexto, la decisión y el motivo. Si una decisión queda obsoleta, no la borres: añade una nueva entrada que la reemplace.
