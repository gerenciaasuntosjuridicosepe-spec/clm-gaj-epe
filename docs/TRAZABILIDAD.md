# Trazabilidad de requisitos — Módulo de Gestión de Alquileres

Una fila por cada requisito (RF-, NF-, R-, T-, F0-, D-) del PRD con su archivo de implementación y su archivo de prueba. Regla del encargo: **un requisito sin prueba asociada no se considera terminado** — no se marca como hecho en `docs/PROGRESO.md` si le falta la columna "Prueba".

Se completa incrementalmente, fase por fase. Lo que no tiene fila todavía es porque no se llegó a esa fase (ver `docs/PROGRESO.md` para el estado real).

## Fase 0 — correcciones obligatorias

| ID | Qué exige | Archivo de implementación | Archivo de prueba | Estado |
| --- | --- | --- | --- | --- |
| F0-1 | Ningún handler de `/api/*` sin guardia de sesión; petición anónima → 401 | `src/app/api/contratos/route.ts`, `src/app/api/contratos/[id]/route.ts` | `src/app/api/rutas-guardia-sesion.test.ts` | Hecho |
| F0-2 | El script de creación de la planilla importa el esquema, no lo duplica | `scripts/setup-sheet.mjs`, `src/lib/data/sheets-schema.ts` | `scripts/setup-sheet.test.ts` | Hecho |
| F0-3 | README/INSTRUCTIVO reflejan el estado real | `README.md`, `INSTRUCTIVO_CONFIGURACION.md` | — (cambio de documentación; verificado que test/lint/build no se rompen) | Hecho |
| F0-4 | Mock solo fuera de producción; en producción sin Sheets, la app no arranca | `src/instrumentation.ts`, `src/lib/data/entorno.ts`, `src/lib/data/provider.ts`, `src/lib/data/usuarios-provider.ts`, `src/lib/data/catalogos-provider.ts` | `src/instrumentation.test.ts`, `src/lib/data/entorno.test.ts`, `src/lib/data/provider.test.ts` | Hecho |
| F0-5 | Sin secretos en el historial de git; ramas definidas | (sin cambio de código) | `git log --all -p` + grep de patrones de clave, documentado en `docs/DECISIONES.md` | Hecho (verificado, sin hallazgo) |
| F0-6 | Framework de pruebas automatizado | `vitest.config.mts`, `package.json` (`scripts.test`) | (toda la suite — Vitest es la prueba de sí mismo: `npm test` corre) | Hecho |
| F0-7 | Fechas de calendario como texto, sin desfase de huso horario | `src/lib/fechas.ts` | `src/lib/fechas.test.ts` (incluye T22) | Hecho |
| a-d | Pruebas técnicas contra Google real (identidad, carga, plantillas, concurrencia) | — (requieren credenciales reales) | `docs/runbooks/prueba-{a,b,c,d}-*.md` (no ejecutadas) | Preparado, no ejecutado — ver `docs/PENDIENTES-HUMANOS.md` punto 5 |

## Fase 1 — cimientos del módulo

(Se completa durante la Fase 1 — ver `docs/PROGRESO.md` para la tarea actual.)

## Fase 2 — hitos, alertas y dashboard

(Pendiente.)

## Fase 3 — comunicaciones y documentos

(Pendiente.)

## Fase 4 — reportes y operación

(Pendiente.)
