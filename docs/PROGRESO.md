# Progreso — Módulo de Gestión de Alquileres

Quien retome este trabajo debe poder continuar leyendo **solo este archivo + `git log`**. Se actualiza después de cada tarea, con la salida real de los comandos (no un resumen de memoria).

Repositorio: `C:\proyectos\clm-gaj-epe-alquileres` (worktree de `clm-gaj-epe`, rama `feature/alquileres`). Nunca tocar `C:\proyectos\clm-gaj-epe` ni la rama `main`.

Documentos de referencia: `docs/DECISIONES.md` (por qué se decidió cada cosa), `docs/PENDIENTES-HUMANOS.md` (lo que no puede resolver el desarrollo autónomo), `docs/TRAZABILIDAD.md` (requisito → archivo de implementación → archivo de prueba).

---

## Estado general

| Fase | Estado |
| --- | --- |
| Paso 0 (verificación de documentos) | **OK** — 2026-09-30, ver DECISIONES.md |
| Fase 0 (correcciones F0-1 a F0-7 + runbooks a-d) | **Cerrada** — 2026-09-30, ver detalle abajo |
| Fase 1 (cimientos del módulo) | En curso |
| Fase 2 (hitos, alertas, dashboard) | No iniciada |
| Fase 3 (comunicaciones y documentos) | No iniciada |
| Fase 4 (reportes y operación) | No iniciada |
| Fase 5/6 (piloto, migración) | Fuera de alcance de este desarrollo — requieren dictamen GAJ y datos reales (ver PENDIENTES-HUMANOS.md) |

## Fase 0 — cierre

Las 7 correcciones (F0-1 a F0-7) están hechas, cada una con su propio commit y su propia prueba automática (ver tabla de abajo y `docs/TRAZABILIDAD.md`). Las 4 pruebas técnicas a-d (sección 3 del PRD v2.1) requieren Google real: se dejaron como runbooks en `docs/runbooks/` sin ejecutar, como pide el encargo.

| Hallazgo | Commit | Prueba |
| --- | --- | --- |
| F0-1 (crítico: rutas sin guardia de sesión) | `8f4b5be` | `src/app/api/rutas-guardia-sesion.test.ts` (genérica, recorre toda `app/api/**`) |
| F0-2 (script de setup duplicaba el esquema) | `e753a06` | `scripts/setup-sheet.test.ts` |
| F0-3 (README/INSTRUCTIVO desactualizados) | `bb33a91` | — (cambio de documentación; verificado que build/lint/test siguen en verde) |
| F0-4 (mock con cuenta real podía servirse en producción) | `098a4a3` | `src/instrumentation.test.ts`, `src/lib/data/entorno.test.ts`, `src/lib/data/provider.test.ts` |
| F0-5 (secretos en el historial / ramas) | sin cambio de código — verificado sin hallazgo | `git log --all -p` sobre `.env*`/`.vercel` + grep de patrones de clave privada, ambos vacíos (ver DECISIONES.md) |
| F0-6 (sin framework de pruebas) | `8f4b5be` | Vitest instalado, `npm test` funcionando (este mismo informe lo demuestra) |
| F0-7 (desfase de huso horario en fechas) | `ca2374f` | `src/lib/fechas.test.ts` (incluye el caso T22 del PRD) |

Pruebas técnicas a-d: runbooks en `docs/runbooks/prueba-a-login.md`, `prueba-b-carga.md`, `prueba-c-plantilla.md`, `prueba-d-concurrencia.md`. También documentadas en `docs/PENDIENTES-HUMANOS.md`, punto 5.

## Tarea actual

Fase 1 — cimientos del módulo de Alquileres: esquema de datos (`src/lib/alquileres/esquema.ts`), catálogos (incluidos los valores INFERIDO/"a completar" del xlsx, como catálogo editable), roles por módulo y guardia de acceso, capa de datos genérica (repositorio + fake de Sheets), IDs por secuencia atómica, control de versión optimista, reglas de negocio R1-R20 con TDD reproduciendo T1-T28.

## Próximas tareas (orden previsto)

1. `src/lib/alquileres/tipos.ts` — modelo de datos propio (Inmueble, Expediente, Persona, Actuacion, etc.), independiente de `src/lib/types.ts` del CLM (D2, sección 4 del PRD v2.1).
2. `src/lib/alquileres/catalogos/` — catálogos semilla (CATALOGOS_VALORES del xlsx) como objetos/arrays editables, con los valores INFERIDO marcados y los "a completar con el original" vacíos/configurables (nunca hardcodeados en lógica).
3. `src/lib/alquileres/fechas.ts` — días hábiles, feriados, R13, semáforo propio (180/120/60), sin `new Date("yyyy-mm-dd")`, con pruebas T3-T5, T22.
4. `src/lib/alquileres/reglas/` — R1-R20 como funciones puras, TDD con T1-T28.
5. `src/lib/alquileres/esquema.ts` — nombres de hoja + columnas (fuente única, análoga a `sheets-schema.ts` del CLM).
6. `src/lib/alquileres/repositorio/` + fake de Sheets para pruebas (T26: aislamiento de planillas).
7. Roles por módulo: ampliar sesión/usuarios-provider con `rolesPorModulo`, guardia de acceso al grupo de menú y a `app/alquileres/**` + `app/api/alquileres/**` (RF-42, T18, T19).
8. ABM mínimo de inmuebles/expedientes/personas/actuaciones sobre el mock.
9. `scripts/setup-sheet-alquileres.mjs` (importa `esquema.ts`, prueba de coherencia T21).

## Resultado de las últimas pruebas (Fase 0, cierre)

```
> clm-gaj-epe@0.1.0 test
> vitest run

 RUN  v5.0.3 C:/proyectos/clm-gaj-epe-alquileres

 Test Files  6 passed (6)
      Tests  41 passed (41)
   Start at  21:29:58
   Duration  970ms (tests 44%, import 28%, transform 23%, worker 4%)
```

```
> clm-gaj-epe@0.1.0 lint
> eslint
(sin salida — 0 problemas)
```

```
> clm-gaj-epe@0.1.0 build
> next build

▲ Next.js 16.3.8 (Turbopack)
✓ Compiled successfully in 3.3s
  Running TypeScript ...
  Finished TypeScript in 5.4s ...
✓ Generating static pages using 15 workers (11/11) in 436ms

Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /admin/auditoria
├ ƒ /admin/sectores
├ ƒ /admin/tipos-anotacion
├ ƒ /admin/tipos-contrato
├ ƒ /admin/tipos-garantia
├ ƒ /admin/usuarios
├ ƒ /alertas
├ ƒ /api/auth/[...nextauth]
├ ƒ /api/catalogos/sectores
├ ƒ /api/catalogos/tipos-anotacion
├ ƒ /api/catalogos/tipos-contrato
├ ƒ /api/catalogos/tipos-contrato/asignacion
├ ƒ /api/catalogos/tipos-garantia
├ ƒ /api/contratos
├ ƒ /api/contratos/[id]
├ ƒ /api/contratos/[id]/anotaciones
├ ƒ /api/contratos/[id]/garantias
├ ƒ /api/contratos/[id]/garantias/[garantiaId]
├ ƒ /api/contratos/[id]/hitos
├ ƒ /api/usuarios
├ ƒ /api/usuarios/[id]
├ ƒ /calendario
├ ƒ /contratos
├ ƒ /contratos/[id]
├ ƒ /login
└ ƒ /nueva-solicitud

ƒ Proxy (Middleware)
ƒ  (Dynamic)  server-rendered on demand
```

## Hallazgos de la revisión adversarial (sección 6.3 del encargo)

(Se completa al cerrar cada fase. Fase 0 es correctiva por naturaleza — su propia revisión adversarial fue encontrar los 7 hallazgos F0-1 a F0-7, ya corregidos y probados arriba. Un hallazgo adicional notado de paso y no corregido en Fase 0 por estar fuera de su alcance: `src/lib/data/provider.ts` mantiene un `instancia` de provider en una variable module-level cacheada entre requests — en un entorno serverless esto vive por instancia de proceso, no es un problema de seguridad pero sí algo a tener en cuenta para Alquileres: el repositorio de Alquileres NO debe compartir ese singleton con el de Contratos, cada uno con el suyo — ver T26.)

---

## Bitácora (una entrada por tarea/commit)

### 2026-09-30 — Paso 0 + arranque de Fase 0

- Releídos completos `docs/prd-modulo-alquileres-v2.1.md` y `docs/prd-app-seguimiento-alquileres-v1.md`.
- Leído `docs/Estructura_Datos_Gestion_Alquileres_RECONSTRUIDA.xlsx` completo (31 hojas) con script Node + paquete `xlsx` (fuera del repo, ver DECISIONES.md).
- Leída la guía de Next.js 16 (`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`): confirma `proxy.ts` (ya aplicado), `params` siempre `Promise` (ya aplicado en las rutas existentes), `next lint` removido (ya usa `eslint` directo).
- Explorado el código existente del CLM: `src/auth.ts`, `src/lib/auth-guard.ts`, `src/lib/permisos.ts`, `src/lib/types.ts`, `src/lib/navegacion.ts`, `src/proxy.ts`, todas las rutas de `src/app/api/**`, `src/lib/data/*.ts`, `src/lib/fechas.ts`, `scripts/setup-sheet.mjs`, `README.md`, `INSTRUCTIVO_CONFIGURACION.md`, `.gitignore`.
- Confirmados por lectura directa los 7 hallazgos F0-1 a F0-7 del PRD v2.1 (detalle en DECISIONES.md). No se encontraron secretos en el historial de git.
- Creados `docs/DECISIONES.md`, `docs/PENDIENTES-HUMANOS.md`, `docs/PROGRESO.md` (este archivo), pendiente `docs/TRAZABILIDAD.md`.
- Commit `fd08952`.

### 2026-09-30 — F0-6 + F0-1

- Instalado Vitest (`npm install -D vitest`), config en `vitest.config.mts`, scripts `test`/`test:watch` en `package.json`.
- De paso: `next` 16.3.0 → 16.3.8 (parchea 3 CVE críticas/altas de RCE que reportaba `npm audit` sobre la versión pineada) y `@types/node` ^20 → ^24 (peer dependency de Vitest 5; el Node instalado es v24). `npm audit` queda en 0 vulnerabilidades (se corrió además `npm audit fix` para 2 altas en deps de desarrollo — `brace-expansion`, `js-yaml`).
- Prueba genérica `src/app/api/rutas-guardia-sesion.test.ts` + utilidad `src/lib/test-utils/recorrer-rutas-api.ts`: recorre todos los `route.ts` de `app/api/**`, invoca cada handler con sesión nula simulada, exige 401/403. Antes de corregir el código, fallaba exactamente en `GET /api/contratos` y `GET /api/contratos/[id]` — coincide con el hallazgo F0-1 del PRD.
- Corregidos ambos handlers: exigen sesión y filtran por rol (`listarVisibles`/`puedeVerContrato`).
- `npm test`: 14/14 OK. `npm run lint`: limpio. `npm run build`: OK (ver salida completa en la sección de arriba, capturada al cierre de fase).
- Commit `8f4b5be`.

### 2026-09-30 — F0-7

- Reescrito `src/lib/fechas.ts` (CLM): elimina todo uso de `new Date()` para interpretar fechas de calendario o calcular "hoy"; "hoy" sale de `Intl.DateTimeFormat` en `America/Argentina/Buenos_Aires`; la resta de días usa `Date.UTC` como unidad de cuenta neutral (mismo anclaje en ambos operandos); `formatearFecha` reordena el string `yyyy-mm-dd` sin construir ningún `Date`. Firmas públicas sin cambios.
- Pruebas nuevas `src/lib/fechas.test.ts`, incluido el caso T22 (zona horaria a las 22:00) con fake timers, mostrando explícitamente qué hubiera dado el bug original.
- `npm test`: 21/21 OK. Lint limpio. Build OK.
- Commit `ca2374f`.

### 2026-09-30 — F0-2

- `scripts/setup-sheet.mjs`: el objeto `HOJAS` (antes con columnas escritas a mano, incluidas `link_texto_final`/`link_pdf` que no existen en el esquema real) ahora se arma importando las constantes `*_COLUMNS`/`SHEET_NAMES` de `src/lib/data/sheets-schema.ts`.
- Para que esto funcione sin agregar ninguna dependencia nueva (ni `tsx` ni `ts-node`): se marcaron como `import type` los dos imports de `sheets-schema.ts` que ya eran type-only de hecho (`../types`, `./mock-catalogos`) — cambio de sintaxis sin efecto en tiempo de ejecución bajo `tsc`/Next, pero que le permite a Node 24 (soporte nativo de "type stripping") cargar el archivo `.ts` directamente sin imports residuales sin resolver.
- `HOJAS` se exporta y `main()` (la conexión a Google) solo corre si el script se ejecuta directamente, no cuando una prueba lo importa.
- Prueba de coherencia `scripts/setup-sheet.test.ts` (equivalente a T21 pero para el esquema del CLM): compara `HOJAS` contra cada `*_COLUMNS` de `sheets-schema.ts`, y además verifica explícitamente que no reaparezcan `link_texto_final`/`link_pdf`.
- Verificado manualmente: `node scripts/setup-sheet.mjs` (sin `.env.local`) falla con el mismo mensaje de siempre ("faltan credenciales") — no cambió el comportamiento end-to-end, solo de dónde saca las columnas.
- `npm test`: 33/33 OK. Lint limpio. Build OK.
- Commit `e753a06`.

### 2026-09-30 — F0-4

- `src/instrumentation.ts` (nuevo, convención de Next.js): `register()` corre una vez al arrancar cada instancia del servidor; lanza si `NODE_ENV === "production"` y `googleSheetsConfigurado()` es `false` — el proceso no llega a atender pedidos.
- `src/lib/data/entorno.ts` (`exigirMockPermitido`): segunda barrera, llamada desde cada punto de "caer al mock" en `provider.ts`, `usuarios-provider.ts` y `catalogos-provider.ts`.
- No se tocó `MOCK_USUARIOS` (sigue con la cuenta real que ya documentaba `INSTRUCTIVO_CONFIGURACION.md` para probar el login en desarrollo) — el criterio de aceptación de F0-4 es que esa cuenta nunca pueda servirse en producción, no que desaparezca del mock de desarrollo (ver razonamiento en el mensaje del commit).
- Pruebas: `src/instrumentation.test.ts` (4 casos: producción sin Sheets lanza, producción con Sheets no lanza, fuera de producción no lanza, runtime edge no evalúa), `src/lib/data/entorno.test.ts`, `src/lib/data/provider.test.ts` (defensa en profundidad del provider de contratos).
- `npm test`: 41/41 OK. Lint limpio. Build OK.
- Commit `098a4a3`.

### 2026-09-30 — F0-3

- README: el párrafo que afirmaba categóricamente "todavía no está conectado a Google Sheets ni desplegado en Vercel" se reescribe para explicar el mecanismo real (`googleSheetsConfigurado()`, elección automática) y remitir a verificar el estado de cada checkout en particular, en vez de afirmarlo como si fuera universal — más la mención de que F0-4 impide que un despliegue de producción sirva el mock.
- INSTRUCTIVO_CONFIGURACION.md: ruta de ejemplo generalizada (el documento también se usa desde worktrees con otra ruta que el checkout principal).
- Cambio de documentación — se verificó que `npm test`/`npm run lint`/`npm run build` siguen en verde (nada que pudiera romperse).
- Commit `bb33a91`.

### 2026-09-30 — F0-5 (sin cambio de código)

- Verificado (ver Paso 0 más arriba): sin secretos en el historial de git, `.gitignore` correcto, dos ramas (`main` protegida — no tocada — y `feature/alquileres`). No hizo falta ninguna corrección: se documenta la verificación en DECISIONES.md y acá, sin commit propio (no hay cambio de código que commitear).

### 2026-09-30 — Runbooks de las pruebas técnicas a-d + cierre de Fase 0

- Creados `docs/runbooks/prueba-a-login.md`, `prueba-b-carga.md`, `prueba-c-plantilla.md`, `prueba-d-concurrencia.md`: qué confirman, prerrequisitos, pasos, resultado esperado, quién puede correrlos. Ninguno se ejecutó (todos requieren Google real).
- Actualizado este archivo (PROGRESO.md) con el cierre de Fase 0: tabla de hallazgos → commit → prueba, salida real de `npm test`/`npm run lint`/`npm run build`.
- Pendiente: `docs/TRAZABILIDAD.md` (se crea a continuación, antes de empezar Fase 1 — un requisito sin su fila en ese archivo no se da por terminado, por regla del encargo).
