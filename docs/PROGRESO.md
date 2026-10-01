# Progreso — Módulo de Gestión de Alquileres

Quien retome este trabajo debe poder continuar leyendo **solo este archivo + `git log`**. Se actualiza después de cada tarea, con la salida real de los comandos (no un resumen de memoria).

Repositorio: `C:\proyectos\clm-gaj-epe-alquileres` (worktree de `clm-gaj-epe`, rama `feature/alquileres`). Nunca tocar `C:\proyectos\clm-gaj-epe` ni la rama `main`.

Documentos de referencia: `docs/DECISIONES.md` (por qué se decidió cada cosa), `docs/PENDIENTES-HUMANOS.md` (lo que no puede resolver el desarrollo autónomo), `docs/TRAZABILIDAD.md` (requisito → archivo de implementación → archivo de prueba).

---

## Estado general

| Fase | Estado |
| --- | --- |
| Paso 0 (verificación de documentos) | **OK** — 2026-09-30, ver DECISIONES.md |
| Fase 0 (correcciones F0-1 a F0-7 + runbooks a-d) | En curso |
| Fase 1 (cimientos del módulo) | No iniciada |
| Fase 2 (hitos, alertas, dashboard) | No iniciada |
| Fase 3 (comunicaciones y documentos) | No iniciada |
| Fase 4 (reportes y operación) | No iniciada |
| Fase 5/6 (piloto, migración) | Fuera de alcance de este desarrollo — requieren dictamen GAJ y datos reales (ver PENDIENTES-HUMANOS.md) |

## Tarea actual

Fase 0 — corrigiendo F0-1 a F0-7 en orden, con TDD donde aplica, un commit por tarea.

## Próximas tareas (orden previsto)

1. Instalar Vitest + script `npm test` (F0-6).
2. F0-1: guardia de sesión en `GET /api/contratos` y `GET /api/contratos/[id]`, con filtro por rol. Prueba que recorre `app/api/**` y falla si falta guardia.
3. F0-7: nuevo `src/lib/alquileres/fechas.ts` (no se toca `src/lib/fechas.ts` del CLM) sin `new Date("yyyy-mm-dd")`.
4. F0-2: `scripts/setup-sheet.mjs` importa el esquema en vez de duplicarlo; prueba de coherencia.
5. F0-4: mock de usuarios con cuenta real solo fuera de producción.
6. F0-3: corregir README/INSTRUCTIVO.
7. F0-5: ramas/commits — ya verificado sin hallazgo (ver DECISIONES.md), documentar nada más.
8. Runbooks de las pruebas técnicas a-d (no se ejecutan).
9. Empezar Fase 1: esquema de datos (`src/lib/alquileres/esquema.ts`), catálogos, roles por módulo, IDs por secuencia, `fechas.ts`, reglas R1-R20 con TDD (T1-T28).

## Resultado de las últimas pruebas

(Se completa en cuanto exista el primer `npm test`/`npm run lint`/`npm run build`.)

## Hallazgos de la revisión adversarial (sección 6.3 del encargo)

(Se completa al cerrar cada fase.)

---

## Bitácora (una entrada por tarea/commit)

### 2026-09-30 — Paso 0 + arranque de Fase 0

- Releídos completos `docs/prd-modulo-alquileres-v2.1.md` y `docs/prd-app-seguimiento-alquileres-v1.md`.
- Leído `docs/Estructura_Datos_Gestion_Alquileres_RECONSTRUIDA.xlsx` completo (31 hojas) con script Node + paquete `xlsx` (fuera del repo, ver DECISIONES.md).
- Leída la guía de Next.js 16 (`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`): confirma `proxy.ts` (ya aplicado), `params` siempre `Promise` (ya aplicado en las rutas existentes), `next lint` removido (ya usa `eslint` directo).
- Explorado el código existente del CLM: `src/auth.ts`, `src/lib/auth-guard.ts`, `src/lib/permisos.ts`, `src/lib/types.ts`, `src/lib/navegacion.ts`, `src/proxy.ts`, todas las rutas de `src/app/api/**`, `src/lib/data/*.ts`, `src/lib/fechas.ts`, `scripts/setup-sheet.mjs`, `README.md`, `INSTRUCTIVO_CONFIGURACION.md`, `.gitignore`.
- Confirmados por lectura directa los 7 hallazgos F0-1 a F0-7 del PRD v2.1 (detalle en DECISIONES.md). No se encontraron secretos en el historial de git.
- Creados `docs/DECISIONES.md`, `docs/PENDIENTES-HUMANOS.md`, `docs/PROGRESO.md` (este archivo), pendiente `docs/TRAZABILIDAD.md`.
- Sin commit todavío de este paso (se commitea junto con el primer cambio de código de Fase 0, para no generar un commit vacío de "solo documentación" — ver próxima entrada).
