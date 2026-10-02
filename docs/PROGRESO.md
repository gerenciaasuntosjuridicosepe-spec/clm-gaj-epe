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

Fase 1 — cimientos del módulo de Alquileres. Hecho hasta ahora (ver bitácora para el detalle de cada commit):
- Modelo de datos (`tipos.ts`), catálogos semilla, `fechas.ts` propio.
- Las 20 reglas de negocio puras que se pueden implementar sin el libro original (R2, R3'/R3a, R4', R5, R8, R9, R13-R20 + validaciones + alertas A1-A8 + campos calculados C1/C4/C6 + legítimo abono + comunicaciones).
- Esquema de la planilla de Alquileres + script de aprovisionamiento (T21).
- Roles por módulo (D3/D12) con guardia de acceso (proxy + `/sin-acceso`), login de desarrollo (dev-bypass) y verificación en vivo de T19.
- Repositorio genérico sobre Sheets (R1, T20, T26, prueba técnica d) + mock en memoria, con fake/doble completo de la API de Sheets para probar sin Google real.
- Escritura restringida de Usuarios desde Alquileres (T27).
- Matriz de permisos del módulo (`permisos.ts`) y guardia de rutas de API propia (`alquileres/auth-guard.ts`, RF-42).
- Primer ABM real de punta a punta: Inmuebles (RF-05), con página + ruta de API + componente cliente, probado en vivo contra `npm run dev` (alta vía API, visible en la página de listado, bloqueado para quien no tiene rol de Alquileres).

Falta para cerrar Fase 1: replicar el patrón de Inmuebles para Expedientes, Personas (con enmascarado LECTOR) y Actuaciones; ítem de menú propio (RF-41) filtrado por `rolAlquileres`; cerrar la fase con revisión adversarial completa y `docs/TRAZABILIDAD.md` al día.

**Nota sobre continuidad:** esta fase se desarrolló a lo largo de varias sesiones interrumpidas por el límite de uso compartido de la cuenta (no un error del desarrollo — se retoma automáticamente). Cada retoma empezó re-verificando `git log`/`git status`/`git diff`/`npm test`/`npx tsc --noEmit` antes de seguir, sin asumir que el estado dejado por la sesión anterior (o por un subagente) ya estaba probado.

## Próximas tareas (orden previsto)

1. Expedientes (RF-07/RF-08): mismo patrón que Inmuebles, con la validación de R2 (vínculo al mismo inmueble) y los dos formatos de `nro_expediente` (T11, ya implementado en `validaciones.ts`).
2. Personas (RF-09): mismo patrón, con `buscarPersonaDuplicada` (R9) antes de crear, y enmascarado de campos personales para LECTOR (`enmascararSiLector`, ya implementado en `permisos.ts` — falta aplicarlo en la ruta de lectura).
3. Actuaciones (RF-11/RF-12): el ABM más complejo — alta rápida (tipo, inmueble, sector, estado), validación R2/R3'/R4' según corresponda, generación de hitos al crear un CONTRATO (RF-19, usa R13 + la semilla de CFG_HITOS_TIPO).
4. Ítem de menú "Alquileres" (RF-41) en el sidebar, filtrado por `rolAlquileres` de la sesión (hoy `Sidebar` es estático, sin filtrar por rol en absoluto — ni para el CLM; ver hallazgo en "revisión adversarial").
5. Cerrar Fase 1: correr lint/build/test completos, recorrido manual adicional en `npm run dev`, completar `docs/TRAZABILIDAD.md` con las filas de Fase 1 que falten, revisión adversarial formal antes de pasar a Fase 2.

## Resultado de las últimas pruebas (2026-10-01)

```
> clm-gaj-epe@0.1.0 test
> vitest run

 Test Files  37 passed (37)
      Tests  306 passed (306)
```

`npx tsc --noEmit`: limpio. `npm run lint`: limpio. `npm run build`: OK — genera (entre otras) `/alquileres/inmuebles` y `/api/alquileres/inmuebles`.

`npx tsc --noEmit`: sin salida (limpio). `npm run lint`: sin salida (limpio). `npm run build`: OK, genera las mismas rutas que antes más `/sin-acceso`.

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
- Creado `docs/TRAZABILIDAD.md` con las filas de Fase 0 (commit `162609d`, el mismo de los runbooks).

### 2026-09-30 — Fase 1: modelo de datos, catálogos semilla y fechas/días hábiles (commit `d8595b6`)

- `src/lib/alquileres/tipos.ts`: modelo completo transcripto campo a campo desde la hoja DICCIONARIO del xlsx reconstruido (20 tablas). Catálogos cerrados del PRD como unión literal; catálogos abiertos o "a completar con el original" como `string`.
- `src/lib/alquileres/catalogos/{catalogos-seed,parametros-seed,hitos-seed}.ts`: semillas editables. Los hitos H-06 a H-14/H-16 a H-19, `destino_categoria` y los valores completos de `tipo_area`/`caracter`/`tipo_documento`/`cargo` quedan fuera de la semilla, sin inventarse (ver PENDIENTES-HUMANOS.md punto 1).
- `src/lib/alquileres/fechas.ts`: módulo de fechas propio del módulo (no toca el del CLM). Días hábiles con feriados activos, EDATE con clamping para meses, semáforo de 4 niveles, "hoy" en America/Argentina/Buenos_Aires.
- Pruebas (`fechas.test.ts`, 18 casos) reproducen T2, T3, T4, T5 y T22 textualmente.
- npm test: 59/59 OK. Lint limpio. Build OK.

### 2026-09-30 — Fase 1: reglas R2, R3'/R3a, R4', R5, R8, R9, R15, R16 (commit `4c284ae`)

- Primer lote de reglas de negocio puras en `src/lib/alquileres/reglas/`, cada una con su prueba reproduciendo los casos numéricos del PRD (T2, T6, T7, T8).
- `src/lib/alquileres/test-fixtures.ts`: fábricas de datos ficticios para las pruebas (nunca datos reales).
- npm test: 106/106 OK. Lint limpio. Build OK.

### 2026-09-30 — Fase 1: reglas R13, R14, R17, R18, R19, R20 (commit `58f40a2`)

- Segundo lote: R13 (orquesta fechas.ts + CFG_HITOS_TIPO, probado contra la semilla real), R14 (estado derivado como recomputación pura), R17 (T17), R18 (hitos condicionales), R19 (canon vigente), R20 (catálogos editables).
- npm test: 140/140 OK. Lint limpio. Build OK.

### 2026-09-30 — Fase 1: validaciones, alertas A1-A8, campos calculados, legítimo abono, comunicaciones (commit `a463b0c`)

- `validaciones.ts` (T11 nro_expediente, T12 CUIT módulo 11, T13 neutralizarFormula/NF-S4, partida inmobiliaria, DNI, URL de documento, mail institucional), `alertas.ts` (A1-A8, incluidos T9/T10/T25), `campos-calculados.ts` (C1/C4/C6), `legitimo-abono.ts` (T28), `comunicaciones.ts` (T23).
- Corrigió de paso una colisión de nombres (`ResultadoValidacion` exportado desde 5 archivos) que `tsc` detectaba al agregar el `index.ts` barrel — se volvieron interfaces internas no exportadas.
- npm test: 200/200 OK. Lint limpio. Build OK.

### 2026-10-01 — Retomando tras corte de sesión por límite de uso

- La sesión anterior (y un subagente lanzado dentro de ella para "esquema + repositorio Sheets de Alquileres") se cortaron por límite de uso. Esta sesión arrancó re-verificando todo desde cero antes de seguir, como exige el método de trabajo: `git log`, `git status`, `git diff`, `npm test`, `npx tsc --noEmit`.
- Encontrado: los 4 commits de Fase 1 de arriba (`d8595b6`, `4c284ae`, `58f40a2`, `a463b0c`) estaban hechos pero nunca registrados en este archivo — corregido con las 4 entradas de arriba.
- Encontrado: working tree con cambios sin commitear — resultado del subagente de esquema/repositorio, cortado a mitad de camino. Se revisó cada archivo a mano (no se confió en que "ya estaba probado"):
  - `src/lib/alquileres/esquema.ts` (503 líneas): esquema completo de las 20 tablas + hojas de secuencia por prefijo. Se comparó campo por campo contra `tipos.ts` (ya conocido de memoria, por haberlo escrito en la sesión anterior) — coincide exactamente en orden y nombres.
  - `scripts/setup-sheet-alquileres.mjs` + `scripts/setup-sheet-alquileres.test.ts` (T21): se corrió la prueba (24 casos, todos en verde) y se ejecutó el script sin `.env.local` para confirmar que falla con el mensaje esperado de "faltan credenciales" (nunca se conectó a Google real).
  - Se commiteó como `386a3c0` recién después de esa verificación manual completa.
- Encontrado (reportado por el coordinador, confirmado de nuevo con `npx tsc --noEmit`): 5 páginas del CLM (`admin/auditoria`, `alertas`, `contratos`, `contratos/[id]`, página de inicio) con un error de tipos nuevo (`RolId | undefined` no asignable a `RolId`) — causado por un cambio en curso en `src/auth.ts`/`src/lib/data/mock-catalogos.ts` que esta misma sesión venía escribiendo para D3/D12 (roles por módulo) cuando se cortó. Se completó ese trabajo (`src/lib/acceso-modulo.ts`, guardia en `authorized()`, página `/sin-acceso`) y se agregó `rolClmDeSesion()` en `auth-guard.ts` para angostar el tipo en esas 5 páginas sin cambiar su comportamiento. Commit `dd1a4b8`.
- `npm test`: 244/244 OK. `npx tsc --noEmit`: limpio. `npm run lint`: limpio. `npm run build`: OK (ver salida completa más arriba, sección "Resultado de las últimas pruebas").
- Actualizado `docs/TRAZABILIDAD.md` con las filas de Fase 1 hechas hasta ahora (ver archivo).

### 2026-10-01 — Login de desarrollo (dev-bypass) + verificación manual en vivo de T19

- Agregado un proveedor `Credentials` (`id: "dev-bypass"`) a `src/auth.ts`, incluido en el array `providers` SOLO cuando `NODE_ENV !== "production"` (dos barreras independientes, ver `docs/DECISIONES.md`). Formulario correspondiente en `src/app/login/page.tsx`, visible solo fuera de producción.
- Verificado de punta a punta contra un servidor real (`npm run dev` con un `AUTH_SECRET` efímero pasado inline, sin crear `.env.local`), con `curl` simulando el flujo CSRF + POST:
  - `gestora.alquileres@ejemplo.test` (rol solo Alquileres) → `GET /` → 302 a `/sin-acceso`. **T19 (una dirección), confirmado en vivo.**
  - `m.cardozo@epe.com.ar` (rol solo CLM) → `GET /` → 200; `GET /alquileres` → 302 a `/sin-acceso`. **T19 (la otra dirección), confirmado en vivo.**
  - Email no registrado → login rechazado, `/login?error=CredentialsSignin`.
  - Sin sesión → `GET /` → 307 a `/login`.
  - Log del servidor sin errores inesperados (el único `[auth][error] CredentialsSignin` que aparece es el esperado, del intento con email no registrado).
- `npm test`: 244/244 OK. Lint limpio. `npx tsc --noEmit`: limpio.
- Commit `a6d511a`.

### 2026-10-01 — Repositorio genérico de Alquileres (commit `07b6c53`)

- `src/lib/alquileres/repositorio/`: interfaces genéricas (`tipos-repositorio.ts`: `RepositorioTabla<T>`, `ConflictoVersionError`), abstracción de transporte (`transporte-sheets.ts`), doble completo en memoria de la API de Sheets (`transporte-sheets-fake.ts` — agregar una fila asigna el próximo número real, `actualizarMultiple` revierte todo si falla a mitad de un lote), implementación real sobre HTTP (`transporte-sheets-http.ts`, apunta a `GOOGLE_SHEETS_ALQUILERES_ID`, nunca se ejecuta contra Google real), `repositorio-sheets.ts` (R1: ID = número de fila de la secuencia; M15: control optimista; caché de 60s invalidada en cada escritura; `actualizarMultiple` para R3a/prueba técnica d), `repositorio-mock.ts` (misma interfaz en memoria), `entorno.ts` (duplicado deliberado de `exigirMockPermitido` para no romper el aislamiento de T26 por una utilidad de 5 líneas), `index.ts` (fábrica `crearRepositorio()`).
- `aislamiento.test.ts` (T26): análisis estático que falla si algo en `repositorio/` importa de `src/lib/data/*` del CLM o lee `GOOGLE_SHEETS_SPREADSHEET_ID`, y la dirección inversa (el cliente del CLM no conoce `GOOGLE_SHEETS_ALQUILERES_ID`).
- 50 pruebas nuevas, incluido T1' (20 altas concurrentes sin IDs repetidos, contra el fake y contra el mock) y T20 (conflicto de versión, individual y en lote atómico).
- `npm test`: 294/294 OK. `npx tsc --noEmit`: limpio. Lint limpio. Build OK.

### 2026-10-01 — Escritura restringida de Usuarios desde Alquileres (commit `762efdf`, T27)

- `src/lib/alquileres/usuarios-alquileres.ts`: única función de escritura de Usuarios expuesta a Alquileres (`actualizarAccesoAlquileres`), filtra en runtime para quedarse solo con `rolAlquileres`/`activo` aunque el llamador intente mandar otros campos.
- Prueba T27: confirma que un intento de tocar `rolId`/`nombre`/`email` junto con los dos campos permitidos solo aplica estos últimos.
- `npm test`: 297/297 OK. Lint limpio. `npx tsc --noEmit`: limpio.

### 2026-10-01 — Permisos del módulo, guardia de API, y primer ABM real (Inmuebles)

- `src/lib/alquileres/permisos.ts`: matriz de permisos (PRD v1 sección 3) para gestión/personas/hitos/administración, `puedeAlquileres()`, `enmascararSiLector()` (defensa en profundidad para datos personales de PERSONAS), `ETIQUETAS_ROL_ALQUILERES`. 8 pruebas.
- `src/lib/alquileres/auth-guard.ts`: `requerirSesionAlquileres()`/`requerirAccionAlquileres()` — análogo al `auth-guard.ts` del CLM pero chequeando `rolAlquileres` (401 sin sesión, 403 con sesión pero sin rol del módulo).
- `src/lib/alquileres/datos/{inmuebles,expedientes,personas,actuaciones}.ts`: wiring de `crearRepositorio()` para cada tabla (solo Inmuebles tiene UI todavía; las otras tres quedan listas para las próximas tareas).
- Primer ABM de punta a punta: `src/app/api/alquileres/inmuebles/route.ts` (GET/POST, con las validaciones de RF-05: domicilio/localidad obligatorios, formato de partida, partida duplicada entre activos) + `src/app/alquileres/inmuebles/page.tsx` + `src/components/pages/alquileres-inmuebles-client.tsx`.
- La prueba genérica de cobertura de guardia (`rutas-guardia-sesion.test.ts`, F0-1/RF-42) pasó de 14 a 15 casos automáticamente al agregar la ruta nueva, sin tocar la prueba — confirma que RF-42 queda cubierto para cualquier ruta futura de Alquileres sin esfuerzo adicional.
- **Hallazgo en vivo (`npm run dev` con dev-bypass) y corrección:** `src/components/layout/topbar.tsx` (compartido por el CLM y Alquileres) llamaba a `useRol()` del CLM incondicionalmente, que lanza si la sesión no tiene `rolId` — rompía con 500 cualquier página de Alquileres para una sesión que solo tiene `rolAlquileres` (D12, el caso normal de un usuario de Alquileres sin rol del CLM). Se corrigió para leer la sesión directo y elegir la etiqueta de rol/módulo según la ruta activa (`/alquileres` vs. CLM), sin cambiar el comportamiento para una sesión con `rolId` (todo el CLM existente).
- **Segundo hallazgo en vivo y corrección:** un alta por `POST /api/alquileres/inmuebles` no aparecía al leer `GET /alquileres/inmuebles` (la página) inmediatamente después — confirmado que es un comportamiento de Next.js/Turbopack con módulos de distintas "layers" (API vs. RSC) teniendo instancias separadas de un mismo módulo, y que el CLM existente tiene exactamente el mismo comportamiento (`POST /api/contratos` + `GET /contratos` reproduce lo mismo, sin tocar ese código). Para Alquileres se corrigió cacheando las instancias de repositorio en `globalThis` en vez de en una variable de módulo (`src/lib/alquileres/repositorio/index.ts`) — ver `docs/DECISIONES.md` para el detalle completo y las alternativas consideradas.
- Verificado en vivo contra `npm run dev` (con el fix aplicado): login como `gestora.alquileres@ejemplo.test` (GESTOR de Alquileres) → `POST /api/alquileres/inmuebles` crea `INM-0001` → `GET /alquileres/inmuebles` lo muestra → `GET /` (CLM) sigue bloqueado con redirect a `/sin-acceso` (T19 no se rompió). Log del servidor sin errores.
- `npm test`: 306/306 OK. `npx tsc --noEmit`: limpio. `npm run lint`: limpio. `npm run build`: OK, genera `/alquileres/inmuebles` y `/api/alquileres/inmuebles`.
- Commit `04cca40`.

### 2026-10-01 — ABM de Expedientes, Personas y Actuaciones (mismo patrón que Inmuebles)

- **Expedientes (RF-07/RF-08):** `src/app/api/alquileres/expedientes/route.ts` (GET/POST — valida formato de `nro_expediente` con `validarNroExpediente`/T11, unicidad entre activos, que el inmueble indicado exista) + página + componente cliente (el selector de inmueble muestra domicilio, no solo el ID).
- **Personas (RF-09):** `src/app/api/alquileres/personas/route.ts` (GET/POST — valida DNI/CUIT, usa `buscarPersonaDuplicada`/R9 antes de crear y devuelve 409 con la persona existente si hay duplicado) + página + componente cliente. A diferencia de Inmuebles/Expedientes, `MATRIZ_PERSONAS` no le da a LECTOR ni siquiera "leer" (dato personal) — la página chequea el permiso ANTES de llamar al repositorio (no alcanza con ocultar el botón de alta, como en las otras ABM: acá hay que no traer la lista en absoluto). La ruta de API aplica además `enmascararSiLector` como segunda capa, documentado como defensa en profundidad ya que LECTOR nunca llega a pasar la guardia de "leer" en esta matriz.
- **Actuaciones (RF-11):** `src/app/api/alquileres/actuaciones/route.ts` (GET/POST — alta rápida con tipo/inmueble/sector, aplica R3' si se informa `actuacionAnteriorId`, arranca en `PENDIENTE_AVISO` para CONTRATO o `EN_TRAMITE` para ADENDA/LEGITIMO_ABONO) + página + componente cliente. La formalización guiada (RF-12, con los campos de R4' y la generación de hitos vía R13) queda para cuando se construya el dashboard/calendario en Fase 2 — es un flujo mucho más largo y tiene sentido construirlo junto con los hitos, no antes.
- Corrección de tipos en el camino: `enmascararSiLector<T extends Record<string, unknown>>` no compilaba contra `Persona` (interfaz sin index signature) — se cambió la restricción a `T extends object` con un cast interno, sin cambiar el comportamiento (las pruebas de `permisos.test.ts` siguen pasando igual).
- **Verificación en vivo de punta a punta** (`npm run dev`, login como `gestora.alquileres@ejemplo.test`): se creó un inmueble, un expediente ligado a ese inmueble, una persona y una actuación ligada al mismo inmueble, en ese orden, todo por API; las 4 páginas de listado (`/alquileres/{inmuebles,expedientes,personas,actuaciones}`) muestran los datos recién creados, incluidas las referencias cruzadas (la página de expedientes muestra el domicilio del inmueble, no solo su ID). Log del servidor sin errores en todo el flujo.
- `npm test`: 309/309 OK. `npx tsc --noEmit`: limpio. `npm run lint`: limpio. `npm run build`: OK — genera las 4 páginas y las 4 rutas de API bajo `/alquileres` y `/api/alquileres`.
