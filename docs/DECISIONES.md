# Decisiones del desarrollo — Módulo de Gestión de Alquileres

Registro cronológico de toda decisión tomada sin preguntar, tal como exige el encargo (sección 3). Formato por entrada: fecha, qué, alternativas consideradas, por qué.

Precedencia documental usada en todo el desarrollo: **v2.1 > v1 > xlsx reconstruido**. Cada vez que dos fuentes se contradicen se anota acá cuál ganó y por qué.

---

## 2026-09-30 — Paso 0: verificación de documentos fuente

**Qué:** Relectura completa de los 3 documentos fuente antes de escribir código, como exige el encargo.

- `docs/prd-modulo-alquileres-v2.1.md` (286 líneas) — leído completo. Documento principal, prevalece sobre todo.
- `docs/prd-app-seguimiento-alquileres-v1.md` (601 líneas) — leído completo. Rige en lo que v2.1 no modifique.
- `docs/Estructura_Datos_Gestion_Alquileres_RECONSTRUIDA.xlsx` — leído con un script Node usando el paquete `xlsx` (ver más abajo), hoja por hoja empezando por LEEME. 31 hojas: LEEME, MODELO, DICCIONARIO, CATALOGOS_VALORES, HITOS_SEMILLA, PARAMETROS_SEMILLA, REGLAS, PREGUNTAS_ABIERTAS, HALLAZGOS_DATOS, ETIQUETAS_PLANTILLA, EJEMPLO_CARGA + 18 hojas de tabla con solo encabezados (datos vacíos, es un esquema, no datos) + FERIADOS, ERRORES, SEQ_ACT.
- `docs/prd-modulo-alquileres-v2.md` — **no leído** (el encargo lo marca explícitamente como histórico/ignorar).
- `AGENTS.md` (raíz) y `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` — leídos. Next.js 16 cambia: Turbopack por defecto, Async Request APIs completamente removidas (params siempre `Promise`), `middleware.ts` renombrado a `proxy.ts` (ya aplicado en el código existente), `next lint` removido (ya usa `eslint` directo en package.json). No se detectó uso de `cacheComponents`/PPR en este proyecto — no aplica.

**Resultado:** ningún documento está dañado, corrupto o incompleto de forma que impida continuar. El xlsx es explícitamente una reconstrucción (lo dice su propia hoja LEEME) con celdas `INFERIDO` y secciones marcadas "a completar con el original" — tratadas según la regla de la sección 3 del encargo (usar lo INFERIDO registrando acá, no inventar lo "a completar con el original").

**Paso 0: OK.** Fecha: 2026-09-30.

---

## 2026-09-30 — Herramienta para leer el xlsx: paquete `xlsx` (SheetJS), fuera de package.json

**Qué:** Para leer `Estructura_Datos_Gestion_Alquileres_RECONSTRUIDA.xlsx` hoja por hoja se necesitaba una librería, ya que el libro es un zip con XML interno (parsearlo a mano hoja por hoja con 31 hojas es más lento y más propenso a error que usar un parser probado).

**Alternativas consideradas:**
1. Parsear el XML interno del zip a mano (`unzip` + leer `sheet1.xml` etc.) — descartado: mucho más trabajo y riesgo de error para una tarea de lectura única, no recurrente.
2. Instalar `xlsx` o `exceljs` como dependencia del repositorio (`npm install xlsx` en `clm-gaj-epe-alquileres/package.json`) — descartado: el encargo pide no instalar dependencias que no se necesiten en el repositorio; esta librería solo hace falta una vez, para análisis, no en tiempo de ejecución de la app.
3. **Elegida:** instalar `xlsx` en un proyecto Node temporal en el directorio de scratchpad (fuera del repositorio), correr un script que vuelca cada hoja a JSON, leer los JSON. Así el repositorio de la app nunca gana esta dependencia.

**Por qué:** cumple "no instales dependencias que no necesites" del encargo en el sentido estricto (el repo de la app no la tiene), a la vez que permite una lectura confiable y completa de las 31 hojas.

---

## 2026-09-30 — Hallazgos de Fase 0 confirmados por lectura directa de código (F0-1 a F0-7)

Antes de tocar código se verificó cada hallazgo del PRD v2.1 sección 3 leyendo los archivos señalados, para no corregir algo que ya estuviera bien o pasar por alto algo que el PRD no haya visto:

- **F0-1 confirmado.** `src/app/api/contratos/route.ts` → `GET` no llama a `requerirSesion()` ni filtra por rol (comentario propio en el código ya lo admite: "Sin filtrar por rol a propósito"). `src/app/api/contratos/[id]/route.ts` → `GET` tampoco. El resto de las rutas de API (`catalogos/*`, `usuarios/*`, `contratos/[id]/anotaciones|garantias|hitos`) sí usan `requerirSesion`/`requerirAdmin`/`requerirAccesoEscritura` — son los únicos dos handlers sin guardia.
- **F0-2 confirmado.** `scripts/setup-sheet.mjs` tiene un array `HOJAS.Contratos` con `link_texto_final` y `link_pdf` que no existen en `CONTRATOS_COLUMNS` de `src/lib/data/sheets-schema.ts` — un desfase de columnas real si se usara ese script contra Sheets real.
- **F0-3 confirmado.** `README.md` dice "Todavía no está conectado a Google Sheets ni desplegado en Vercel" — eso es cierto *en este worktree* (no hay `.env.local`), pero la redacción no aclara que el repo principal si lo tiene conectado/desplegado y que acá se corre intencionalmente en modo mock. Se corrige la redacción para que sea precisa en cualquier checkout, no solo en este worktree (ver tarea F0-3 en PROGRESO.md).
- **F0-4 confirmado.** `src/lib/data/mock-catalogos.ts`, `MOCK_USUARIOS`, tiene `{ id: "u6", nombre: "Administrador CLM", rolId: "administrador_sistema", email: "paganinicg@gmail.com" }` — una cuenta real de Carlos embebida como admin en el código fuente del CLM existente.
- **F0-5 confirmado sin hallazgo de secretos.** `git log --all -p` sobre `.env*`/`.vercel` no devuelve nada (nunca se commitearon). Un grep de todo el historial por patrones de clave privada/API key (`private_key`, `BEGIN PRIVATE KEY`, `AIza`, `client_secret`) solo encuentra referencias a *nombres* de variables de entorno en comentarios/instructivo, nunca un valor real. `.gitignore` ya ignora `.env*` y `.vercel`. Las ramas existentes son `main` (protegida, no tocada) y `feature/alquileres` (esta). No hace falta acción de remediación de secretos — el hallazgo del PRD parece referirse a un estado previo al commit inicial que ya no existe en el historial actual.
- **F0-6 confirmado.** `package.json` no tiene ningún framework de pruebas ni script `test`.
- **F0-7 confirmado.** `src/lib/fechas.ts`, `diasRestantes`/`formatearFecha` usan `new Date(fechaISO)` directo sobre un string `yyyy-mm-dd`, que el motor de JS interpreta en UTC medianoche — con la zona horaria de Argentina (UTC-3) esto puede mostrar/contar un día antes. No se toca este archivo (es del CLM existente, fuera del alcance del módulo salvo lo que F0-7 pida); el módulo de Alquileres usa su propio `src/lib/alquileres/fechas.ts` nuevo, libre de este patrón desde el inicio (sección 5 del encargo).

Cada uno de estos hallazgos se corrige como una tarea separada, con su propio commit y su propia prueba, registradas en PROGRESO.md.

---

## 2026-10-01 — Cómo probar el login en `npm run dev` sin credenciales de Google (sección 6.2 del encargo)

**Qué:** el encargo pide explícitamente dejar documentada "la solución que uses para poder probar en dev" el login, ya que no hay `.env.local` en este worktree y el botón "Continuar con Google" no puede completarse sin `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`.

**Alternativas consideradas:**
1. No probar el login en absoluto, solo revisar el código a ojo — descartado: el encargo exige "recorrido manual con el servidor de desarrollo" en cada cierre de fase, y los cambios de `src/auth.ts` de esta fase (D3/D12, T19) son precisamente los que más necesitan probarse de punta a punta, no solo con pruebas unitarias de la lógica pura.
2. Mockear `next-auth` por completo en un entorno de pruebas E2E (Playwright) — descartado por desproporcionado para esta etapa: no hay todavía UI de Alquileres que probar de punta a punta, y agregaría una dependencia y una infraestructura de pruebas nueva solo para esto.
3. **Elegida:** un proveedor adicional de NextAuth, `Credentials` con id `"dev-bypass"` (`src/auth.ts`, función `proveedorDevBypass()`), que acepta un email de texto, lo busca en `buscarUsuarioPorEmail` (mismo mecanismo que el login real) y entra como esa persona si existe y `puedeIniciarSesion()` lo permite. Se agrega un formulario simple en `/login`, visible solo cuando `NODE_ENV !== "production"`.

**Por qué es seguro que esto no se cuele a producción (dos barreras independientes, documentadas también como comentario en el código):**
1. El array `providers` que recibe `NextAuth(...)` ni siquiera incluye este proveedor cuando `NODE_ENV === "production"` — no es una cuestión de ocultar el botón en la UI: el endpoint `/api/auth/callback/dev-bypass` no existe en absoluto en ese build (confirmado: `npm run build`, que corre con `NODE_ENV=production` internamente, genera igual todas las rutas sin errores, y el código de `proveedorDevBypass()` devuelve `null` en ese momento).
2. Si alguien reactivara el proveedor a mano en producción, `authorize()` vuelve a chequear `NODE_ENV` y devuelve `null` — defensa en profundidad, mismo patrón que `exigirMockPermitido` de F0-4 (`src/lib/data/entorno.ts`).
3. No depende de ninguna variable de entorno nueva que alguien pudiera dejar cargada por error en Vercel (nada de `ALLOW_DEV_LOGIN=true` o similar): usa el mismo `NODE_ENV` que Next.js ya fija automáticamente según el comando (`next dev` vs. `next build`/`next start`).

**Cómo correrlo:** como tampoco hay `AUTH_SECRET` en este worktree (no se creó `.env.local`), hace falta pasarlo como variable de entorno inline al comando, sin persistir ningún archivo:
```
AUTH_SECRET="<cualquier valor aleatorio, ej. node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\">" npm run dev
```
Esto NO es un secreto real (no protege datos reales, todo el entorno usa datos mock/ficticios) — es solo la clave de firma de JWT de una sesión de desarrollo efímera, descartable en cualquier momento. No se guarda en ningún archivo del repositorio.

**Verificado de punta a punta en esta sesión** (no solo descripto): se corrió `npm run dev` con un `AUTH_SECRET` efímero, y con `curl` (simulando el flujo CSRF + POST que hace el botón del formulario) se probó: (a) login con `gestora.alquileres@ejemplo.test` (rol solo en Alquileres) → `GET /` redirige a `/sin-acceso` (T19, una dirección); (b) login con `m.cardozo@epe.com.ar` (rol solo CLM) → `GET /` da 200, `GET /alquileres` redirige a `/sin-acceso` (T19, la otra dirección); (c) login con un email no registrado → rechazado, redirige a `/login?error=CredentialsSignin`; (d) sin sesión, `GET /` redirige a `/login`. Los cuatro casos dieron el resultado esperado contra el servidor real, no solo contra la lógica pura ya cubierta por `src/lib/acceso-modulo.test.ts`.
