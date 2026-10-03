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

---

## 2026-10-01 — Caché de repositorios de Alquileres en `globalThis`, no en una variable de módulo

**Qué:** al probar el primer ABM real (Inmuebles) de punta a punta contra el servidor de desarrollo, se encontró que un alta hecha por `POST /api/alquileres/inmuebles` no aparecía al leer `GET /alquileres/inmuebles` (la página) inmediatamente después — aunque sí aparecía al leer de nuevo `GET /api/alquileres/inmuebles` (la misma ruta de API).

**Diagnóstico:** Next.js con Turbopack (`next dev`) compila las rutas de API y los Server Components en grafos de módulos separados ("layers"); importar el mismo archivo desde un Route Handler y desde una página puede darle a cada uno su propia instancia de módulo, con sus propias variables de nivel de módulo (el patrón `let instancia = null` que ya usa `src/lib/data/provider.ts` del CLM). **Se confirmó que esto NO es un bug nuevo de Alquileres**: se reprodujo el mismo comportamiento contra el CLM existente (`POST /api/contratos` seguido de `GET /contratos` sin ver el contrato nuevo) — es una característica ya presente en el mock del CLM; simplemente nunca se había probado este flujo exacto (crear y leer en procesos de request distintos, en una ventana de tiempo muy corta) de punta a punta antes de ahora.

**Alternativas consideradas:**
1. Dejarlo así, igual que el CLM — descartado: haría imposible probar manualmente el ABM de Alquileres en esta misma sesión de desarrollo (cada alta "desaparecería" al navegar a la página de listado), bloqueando la verificación manual que exige el encargo al cerrar cada fase.
2. Reescribir el mock para persistir en un archivo temporal en disco — descartado: demasiado para un problema de desarrollo, y cambiaría la semántica de "en memoria, se pierde al reiniciar" ya documentada y aceptada en varios comentarios del CLM.
3. **Elegida:** cachear las instancias de repositorio en `globalThis` (`src/lib/alquileres/repositorio/index.ts`, función `crearRepositorio()`) en vez de en una variable de módulo. `globalThis` es el objeto global real del proceso de Node y SÍ se comparte entre distintos grafos de módulos de Turbopack dentro del mismo proceso — mismo truco que usan clientes de base de datos (ej. Prisma) para sobrevivir al hot-reload de `next dev` sin duplicar conexiones.

**Por qué no se aplicó esta misma corrección al CLM:** `src/lib/data/provider.ts` es código existente del CLM, fuera del alcance de esta fase (solo se toca por hallazgos explícitos de Fase 0). El mock del CLM ya documenta "se pierde al reiniciar `next dev`" como limitación conocida y aceptada; esta sesión no agrega una corrección no solicitada sobre código ajeno al módulo de Alquileres.

**Verificado:** con el fix, `POST /api/alquileres/inmuebles` seguido de `GET /alquileres/inmuebles` muestra el inmueble recién creado (antes no aparecía) — repetido contra un servidor de desarrollo recién arrancado para confirmar que no era casualidad de caché de Next. Prueba automática en `src/lib/alquileres/repositorio/index.test.ts` (confirma que dos llamadas a `crearRepositorio()` con el mismo `nombreTabla` devuelven la misma instancia, limpiando la caché de `globalThis` entre pruebas) — esa prueba, al correr en un solo proceso de Vitest, no reproduce el escenario multi-layer de Turbopack; la evidencia de que el fix funciona en ese escenario es la verificación manual contra `npm run dev` documentada en `docs/PROGRESO.md`.

---

## 2026-10-02 — Comparar `ConflictoVersionError` por forma (`esConflictoVersionError`), no por `instanceof`

**Qué:** al escribir la primera prueba que ejercita el camino T20 (control de versión) a través de una ruta HTTP real (`[id]/route.test.ts`, formalización RF-12), apareció un error no capturado: el `catch (err) { if (err instanceof ConflictoVersionError) ... }` de `[id]/route.ts` no reconocía el error lanzado por el repositorio, y lo relanzaba (la prueba esperaba 409, el handler tiraba un error sin capturar).

**Diagnóstico:** es el mismo mecanismo de fondo que la decisión del 2026-10-01 de arriba (caché de repositorios en `globalThis` para sobrevivir a los "layers" de Turbopack), llevado a su consecuencia lógica: el caché resuelve que los DATOS se vean iguales entre layers, pero no que las CLASES usadas para construir/comparar errores sean "la misma clase" — si el repositorio cacheado en `globalThis` fue instanciado por la copia del módulo de OTRA layer (u otra "generación" del registro de módulos, que es lo que reproduce `vi.resetModules()` en Vitest), los errores que lanza son instancias de la clase `ConflictoVersionError` DE ESA OTRA layer. `instanceof` compara identidad de clase (referencia al constructor), no nombre ni forma, así que da `false` aunque el error sea idéntico en todo sentido observable (mismo `.name`, mismos campos, mismo mensaje).

**Alternativas consideradas:**
1. Dejarlo así y solo ajustar la prueba para no pasar por ese camino — descartado: tapar el síntoma en la prueba habría dejado el bug real intacto en producción (cualquier ruta nueva que use `instanceof ConflictoVersionError` podría fallar en producción exactamente en la misma circunstancia que generó la decisión del 2026-10-01: Route Handler vs. Server Component en layers distintas).
2. Cachear también las CLASES de error en `globalThis` (mismo truco que con los repositorios) — descartado: más intrusivo, y las clases de error no necesitan identidad compartida si se las compara correctamente; hubiera sido resolver con más del mismo mecanismo un problema que tiene una solución estándar más simple.
3. **Elegida:** agregar `esConflictoVersionError(err): err is ConflictoVersionError` en `tipos-repositorio.ts`, un type guard por "duck typing" (`err.name === "ConflictoVersionError"` + forma de sus campos `tabla`/`id`/`versionEsperada`/`versionActual`), y usarlo en vez de `instanceof` en todo el código de producción que necesite distinguir este error. Es la forma estándar en JS/TS de identificar errores propios que puedan cruzar "realms" o grafos de módulos distintos (mismo principio que, por ejemplo, Node usa `err.code === "ENOENT"` en vez de comparar clases de error del sistema de archivos).

**Alcance de la corrección:** se revisó con `grep -rn "instanceof ConflictoVersionError" src/` que el único lugar de producción que comparaba por clase era `[id]/route.ts` (recién creado en esta misma tarea) — se corrigió ahí. Se documentó en `docs/PROGRESO.md` que `[id]/hitos/route.ts` (RF-20/RF-21, de la tarea anterior) ni siquiera captura este error todavía (responde 500 en vez de 409 ante un conflicto de versión) — no se tocó esa ruta en esta tarea para no mezclar alcance, pero queda anotado como pendiente con la solución ya lista para reusar (`esConflictoVersionError`).

**Verificado:** `route.test.ts` (caso T20) pasa en verde; verificado también en vivo contra `npm run dev` (dos `PATCH` reales por HTTP con la misma `version`, el segundo responde 409 de verdad, no solo en la prueba) — ver `docs/PROGRESO.md`, entrada RF-12.

---

## 2026-10-02 — RF-40 (Calendario): componente visual propio, no el `calendario-mes.tsx` del CLM directamente

**Qué:** el PRD v2.1 (RF-40) pide un calendario propio del módulo y dice explícitamente: "puede reutilizar el componente visual de calendario del CLM con un adaptador; si el tipo de evento actual lo impide, se construye uno propio sin alterar el del CLM". Había que decidir cuál de las dos ramas aplicaba.

**Diagnóstico:** `src/components/domain/calendario-mes.tsx` (CLM) recibe `EventoCalendario[]` (de `src/lib/calendario.ts`), un tipo con campos específicos de `Contrato` (`tipoContrato`, `gerenciaResponsable`, `etapaActual`) y, más importante, el panel de detalle del día tiene un `<Link href={`/contratos/${ev.contratoId}`}>` **hardcodeado** dentro del componente — no es solo el tipo de dato de entrada, el propio JSX asume que todo evento es de un contrato del CLM y lo enlaza a su ficha.

**Alternativas consideradas:**
1. Escribir un "adaptador" que transforme eventos de Alquileres al tipo `EventoCalendario` del CLM (rellenando `tipoContrato`/`gerenciaResponsable` con valores ficticios o `"—"`) para poder pasarle el componente del CLM sin tocarlo — descartado: el link hardcodeado a `/contratos/${id}` seguiría ahí, llevando a una actuación de Alquileres a una URL del CLM que no existe para ese ID (404 o, peor, a un contrato ajeno si el ID coincidiera por casualidad con uno real del CLM). Forzar el modelo de datos de Alquileres dentro de la forma de `Contrato` también viola D2/D5 (modelos de datos independientes), aunque fuera "solo para la UI".
2. Modificar `calendario-mes.tsx` del CLM para que el link y los campos mostrados sean configurables — descartado: es tocar un archivo del CLM fuera del alcance de esta fase (el encargo solo permite tocar código del CLM por hallazgos explícitos de Fase 0), por una necesidad que es enteramente de Alquileres.
3. **Elegida:** `src/components/domain/calendario-mes-alquileres.tsx`, un componente propio con el mismo diseño visual (misma grilla, mismos estilos del design system) pero tipado a `EventoCalendarioAlquileres` (propio) y sin ningún link roto (el panel de detalle del día muestra el `actuacionId` como texto, no como enlace — consistente con el resto del módulo en esta fase, que tampoco tiene todavía una ficha de detalle de actuación navegable). Para no duplicar la matemática de calendario (que SÍ es genérica, no depende de `Contrato`), se importan de `src/lib/calendario.ts` — sin modificarlo — las cuatro funciones puras de grilla: `construirGrillaMes`, `aFechaISO`, `DIAS_SEMANA`, `MESES`. Esto es, en los hechos, "el componente visual del CLM con un adaptador" que permite el PRD: se adapta la parte reutilizable (la grilla) y se reconstruye la parte que no lo es (el tipo de evento y su render).

**Verificado:** en vivo contra `npm run dev`, con una actuación formalizada con `fecha_fin` a futuro y varios hitos con `fecha_prevista` vencida — el calendario muestra ambos tipos de evento en sus fechas correctas, con el semáforo correcto para el vencimiento (ver `docs/PROGRESO.md`).

---

## 2026-10-02 — Fase 3: matrices de permisos de Comunicaciones/Documentos/Áreas, armadas desde la tabla de la sección 3 del PRD v1

**Qué:** RF-22/23/24 (comunicaciones) y RF-28/29 (documentos, actos administrativos) necesitaban su propia matriz de permisos (`permisos.ts`), que todavía no existía para estas tablas.

**Fuente:** la matriz de permisos de la sección 3 del PRD v1 (tabla en `docs/prd-app-seguimiento-alquileres-v1.md`, línea ~85) tiene filas explícitas para "Actos administrativos y documentos (adjuntar enlace)" (`L C E B | L C E | L | L`) y para "Enviar comunicaciones"/"Generar... desde plantilla" (`C` únicamente para ADMINISTRADOR/GESTOR). No hay fila propia para "Áreas".

**Decisiones tomadas:**
1. `MATRIZ_DOCUMENTOS` (actos administrativos y documentos): se transcribió tal cual la fila de la tabla — ADMINISTRADOR con baja, GESTOR sin baja, SUPERVISOR y LECTOR solo lectura. Distinta de `MATRIZ_GESTION` porque ahí SUPERVISOR tiene además "baja" y acá no.
2. `MATRIZ_COMUNICACIONES`: la tabla no tiene una fila de "leer" propia para comunicaciones (se ven dentro de la ficha de la actuación, visible para todos los roles) pero sí restringe expresamente "Enviar comunicaciones" a ADMINISTRADOR/GESTOR. Se modela como la misma forma que `MATRIZ_HITOS` (leer para todos, crear/editar solo ADMINISTRADOR/GESTOR, sin baja — una comunicación ya registrada es parte del historial, no se borra).
3. `MATRIZ_CONTACTOS_EPE`: la fila "Contactos EPE y localidades" de la tabla es idéntica en forma a `MATRIZ_GESTION` — se reutiliza esa constante en vez de declarar una nueva idéntica (evita un duplicado que podría divergir sin querer en un cambio futuro).
4. **Áreas, sin fila en la tabla:** se usó `MATRIZ_ADMINISTRACION` (solo ADMINISTRADOR escribe) como default razonable, por ser estructura organizativa de EPE (más cercana en espíritu a "Catálogos, plantillas, feriados, parámetros" que a un simple directorio de contactos). Si en una revisión posterior alguien aporta una fila explícita para Áreas que diga otra cosa, corregir acá.

**Verificado:** las 5 rutas nuevas (`areas`, `contactos-epe`, `[id]/comunicaciones`, `[id]/documentos`, `[id]/actos-admin`) pasan solas a formar parte de la cobertura automática de RF-42 (`rutas-guardia-sesion.test.ts`, sin tocarlo); permisos ejercitados en vivo contra `npm run dev` (ver `docs/PROGRESO.md`): GESTOR rechazado al crear un Área (403), ADMINISTRADOR aceptado.

---

## 2026-10-02 — RF-29: LEGITIMO_ABONO y ADENDA pasan a FORMALIZADA por edición directa del estado, no por hitos

**Qué:** R14 (`calcularEstadoDerivado`) solo calcula el estado de un CONTRATO a partir de sus hitos; su propio comentario dice explícitamente que ADENDA y LEGITIMO_ABONO "usan EN_TRAMITE, FORMALIZADA, CERRADA y ANULADA cargados a mano (no pasan por esta función)" — pero hasta esta tarea, `[id]/route.ts` (RF-12/RF-29) no tenía ningún campo `estadoActuacion` editable, así que no había ninguna forma real de llevar un LEGITIMO_ABONO o una ADENDA a FORMALIZADA.

**Decisión:** se agregó `estadoActuacion` a los campos editables de `[id]/route.ts`, con una compuerta: si el cuerpo pide `estadoActuacion: "FORMALIZADA"` (a) un CONTRATO lo rechaza (400, con el mensage de que debe cumplir H-15), (b) para ADENDA/LEGITIMO_ABONO, se corre `validarObligatoriosFormalizacion` (R4') sobre la actuación con los cambios ya aplicados, y para LEGITIMO_ABONO específicamente se consulta `ACTOS_ADMIN` (RF-29) para el flag `tieneActoAdministrativo` que R4' exige. Sin pasar esa validación, 400 con el detalle de qué falta — igual criterio que el resto del módulo (nunca un mensaje genérico).

**Alternativa considerada:** una ruta separada `PATCH .../estado` solo para esto — descartada por ahora: el campo cabe naturalmente junto a los demás campos de formalización que ya edita esta ruta, y separar hubiera significado dos round-trips de red para un flujo que conceptualmente es uno solo ("completar los datos y formalizar").

**Verificado:** `route.test.ts` (3 casos: CONTRATO rechazado, LEGITIMO_ABONO sin acto rechazado, LEGITIMO_ABONO con acto aceptado) y en vivo contra `npm run dev` (ver `docs/PROGRESO.md`).

---

## 2026-10-02 — RF-25/26/27: se construye solo la lógica pura (sin Google), no una ruta de "generar documento" que simule hacerlo

**Qué:** antes de escribir código para RF-25/26/27 se volvió a leer la hoja `ETIQUETAS_PLANTILLA` del xlsx reconstruido (mismo método que en Paso 0, sección 3) para tener la lista completa y exacta de las 10 etiquetas — no se había registrado su contenido completo en el Paso 0 original, solo el nombre de la hoja.

**Cómo se leyó (variación menor sobre el método del Paso 0):** se instaló `xlsx` con `npm install --no-save xlsx` DIRECTAMENTE en este repositorio (no en un proyecto Node aparte en el scratchpad, como se hizo el 2026-09-30), se corrió un script de una línea para volcar la hoja a JSON, y se desinstaló de inmediato (`npm uninstall --no-save xlsx`). Se verificó con `git status package.json package-lock.json` que ninguno de los dos quedó modificado, y que `node_modules/xlsx` no quedó presente — mismo resultado neto (cero huella en el repositorio) que el método original, solo que más rápido de ejecutar en este caso puntual. Se documenta la diferencia acá para que quede claro que no se instaló una dependencia nueva de la app.

**Decisión principal — qué SÍ y qué NO construir:** de las 10 etiquetas, 3 son "Constatado en el PRD" (`SECTOR_EPE`, `LOCADORES`, parcialmente `CONDICION_IVA`/`REGLA_ACTUALIZACION`) y 7 son "PROPUESTA" de la reconstrucción (razonables, mapeo 1:1 con campos que ya existen, pero no texto literal de ningún PRD) — se usan las 10 igual (regla de la sección 3: lo INFERIDO se puede usar, registrando de dónde sale cada una; ver `catalogos/etiquetas-plantilla-seed.ts`, que lista el estado de cada una).

Se construyó y probó `reglas/datos-plantilla.ts` (armado de los 10 valores + reemplazo de texto `{{CLAVE}}`) porque es ciento por ciento posible sin hablar con Google. **Deliberadamente NO se construyó** una ruta de API `POST .../documentos/generar` con un "generador mock" que devolviera una URL falsa simulando haber creado un documento real — se consideró y se descartó: aunque seguiría el mismo patrón que el mock de Sheets (una interfaz + una implementación falsa para probar), la diferencia es que un repositorio-mock de Sheets no pretende ser "el documento real" ante el usuario, mientras que una ruta que responde "documento generado" con una URL inventada SÍ podría leerse como que el sistema generó un contrato real cuando no generó nada — eso cruza la línea de "nunca fabricar/simular algo como si fuera real" (incluso para una persona bien intencionada revisando el código, no sería obvio a simple vista que la URL es falsa). Se prefirió dejar la lógica pura lista y probada, y anotar en `docs/PENDIENTES-HUMANOS.md` (punto 11) el paso exacto para que un humano con Google real complete la única pieza que falta.

**Tampoco se inventó la redacción legal** de `{{CONDICION_IVA}}`/`{{REGLA_ACTUALIZACION}}` (RF-27 pide "la redacción", no el código `MAS_IVA`/`SIN_IVA`) — es contenido contractual/legal real, exactamente lo que el encargo pide no fabricar. Se deja pasar el valor crudo como placeholder explícito y se anota en `docs/PENDIENTES-HUMANOS.md` (punto 10).

**Verificado:** `reglas/datos-plantilla.test.ts` (6 pruebas, incluida la verificación explícita de que `SECTOR_EPE` nunca coincide con el nombre del firmante — hallazgo 14). `npm test`: 383/383. `npx tsc --noEmit`: limpio. `npm run lint`: limpio. `npm run build`: OK (sin rutas nuevas, es solo lógica de librería).

---

## 2026-10-02 — Fase 4: no se instala `xlsx` para exportar — solo CSV

**Qué:** el PRD v2.1 (sección 4) pide "XLSX y CSV generados en el servidor" para los reportes (RP-01 a RP-12). Generar un `.xlsx` binario real (es un zip con XML interno) necesita una librería — se probó instalar `xlsx` (SheetJS), la más usada para esto en Node.

**Hallazgo:** `npm audit` reportó 2 vulnerabilidades de severidad alta en `xlsx` SIN parche disponible: Prototype Pollution (GHSA-4r6h-8v6p-xvw6) y ReDoS (GHSA-5pgg-2g8v-p4x9).

**Análisis de riesgo real:** las dos vulnerabilidades son sobre PARSEAR un `.xlsx` de origen no confiable (el vector de ataque es un archivo malicioso que alguien sube/abre). El uso previsto acá era solo ESCRIBIR desde datos propios del servidor (nunca parsear un `.xlsx` ajeno en runtime) — en principio, un uso de solo-escritura no dispara ninguno de los dos CVEs. Aun así:

**Decisión:** no instalar `xlsx`. **Alternativas consideradas:**
1. Instalarlo igual, ya que el uso previsto no toca el código vulnerable — descartado: "sin parche disponible" significa que si en el futuro alguien agrega una importación de `.xlsx` (ej. para RF-36 "feriados con importación desde CSV" si se extendiera a xlsx, o cualquier otra razón), quedaría expuesto sin que sea obvio por qué, y una dependencia de runtime con vulnerabilidades conocidas sin arreglo es justamente el tipo de cosa que el encargo pide evitar si hay una alternativa razonable.
2. Buscar una librería alternativa de generación de `.xlsx` sin las mismas vulnerabilidades — descartado por tiempo: no hay garantía de que la alternativa esté mejor mantenida, y evaluar varias librerías para esto no es proporcional al beneficio.
3. **Elegida:** solo CSV (`lib/alquileres/exportar.ts`, `aCsv`), con BOM UTF-8 (para que Excel no rompa los acentos) y protección de inyección de fórmulas (T13/NF-S4, reutilizando `neutralizarFormula`). CSV abre perfectamente en Excel y Google Sheets — que es el uso real que le va a dar GAJ — sin ninguna dependencia nueva.

**Verificado:** `exportar.test.ts` (4 pruebas); probado en vivo que los 4 reportes exportan CSV con headers y `Content-Disposition` correctos.

---

## 2026-10-02 — Fase 4: LOG_CAMBIOS y ACTUACION_PARTES eran gaps reales de Fase 1, no tareas nuevas de Fase 4

**Qué:** al construir RP-10 ("Actividad y cambios") se encontró que LOG_CAMBIOS (modelado en `tipos.ts`/`esquema.ts` desde Fase 1, RF-38, prioridad M) nunca se escribía desde ningún alta/edición/baja — no había ninguna ruta ni repositorio que lo tocara. Al construir RP-02 ("Cartera", columna "locadores") se encontró lo mismo con ACTUACION_PARTES (RF-10): modelado desde Fase 1, pero sin ninguna ruta de API — lo que además significaba que R8 (mínimo un titular y un firmante antes de FORMALIZADA) nunca se había podido ejercitar de verdad, porque no había manera de cargar una parte.

**Por qué pasaron desapercibidos tanto tiempo:** ninguna prueba de Fase 1-3 verificaba el EFECTO SECUNDARIO de escribir en LOG_CAMBIOS (las pruebas comprobaban el resultado directo de cada operación — "¿el inmueble quedó creado?", no "¿quedó auditado?"); y R8 nunca se probó porque nunca hubo cómo cargar una parte para violarlo o cumplirlo.

**Decisión:** corregir los dos de raíz, no solo para que los reportes de Fase 4 tengan datos — LOG_CAMBIOS se conectó GENÉRICAMENTE en el repositorio (`repositorio-mock.ts`/`repositorio-sheets.ts`), no en cada ruta, para que no vuelva a pasar que una tabla nueva se olvide de auditar. ACTUACION_PARTES se conectó con su propia ruta (RF-10) y R8 se conectó en los dos lugares donde una actuación puede llegar a FORMALIZADA.

**Alternativa considerada:** dejar ambos como "RP-10/RP-02 dan 0 o vacío, documentado como alcance de Fase 4, corrección de Fase 1 para una sesión futura" — descartada: ambos son prioridad M del PRD original (no "deseable"), encontrados DURANTE el trabajo normal de esta fase (no agregados fuera de alcance a propósito), y la corrección no tocó ningún comportamiento ya probado de las fases anteriores (se confirmó con la suite completa en verde antes y después). Mismo criterio que las correcciones de Fase 3 (duplicados en comunicaciones, `ConflictoVersionError` en hitos): un hallazgo real durante el trabajo normal se corrige en el momento, no se difiere solo porque "no es la tarea de hoy".

**Verificado:** ver las entradas de `docs/PROGRESO.md` (Fase 4) y `docs/TRAZABILIDAD.md` para el detalle de pruebas y verificación en vivo de cada uno.

---

## 2026-10-02 — RF-39: el botón de respaldo REGISTRA que se hizo, no lo hace la app

**Qué:** RF-39 [CAMBIO v2.1] describe "un botón del ADMINISTRADOR que copia la planilla a la carpeta de respaldos de Drive". Copiar algo a Drive necesita la API de Drive con la cuenta de servicio real — prohibido en este desarrollo.

**Decisión:** el botón no copia nada; registra que el ADMINISTRADOR YA HIZO la copia manual por fuera de la app. Es exactamente el mismo patrón que RF-23 [CAMBIO v2.1] ya establece para los mails ("el envío real pasa por la casilla del gestor, la app solo guarda que pasó, con fecha y quién lo declaró") — no es una invención nueva de esta tarea, es aplicar un patrón que el propio PRD v2.1 ya eligió para el mismo tipo de problema (algo que debe pasar por fuera de la app porque automatizarlo requiere Google real).

**Por qué no se construyó un botón que "simula" copiar a Drive** (ej. devolviendo una URL falsa de la carpeta) — mismo criterio que la decisión de RF-25/26/27 de arriba: fabricar la apariencia de una acción real que no ocurrió es exactamente lo que el encargo prohíbe, incluso como ayuda visual.

**Verificado:** `administracion/respaldo/route.test.ts` (3 pruebas) y en vivo: sin ningún respaldo registrado, A8 encendida; `POST` registra hoy; `GET` después muestra "hace 0 días" y A8 apagada.

---

## 2026-10-02 — Pantalla de errores: `onRequestError` de Next.js en vez de try/catch manual en cada ruta

**Qué:** la Fase 4 pide una "pantalla de errores". Se evaluó envolver cada ruta de Alquileres en un try/catch que llame a `registrarError()` — se descartó por el mismo motivo que llevó a construir RF-42 como una prueba genérica que recorre todas las rutas: un mecanismo que depende de que cada ruta nueva "se acuerde" de llamarlo es exactamente el tipo de cosa que ya se demostró que se olvida (ver la decisión de arriba sobre LOG_CAMBIOS/ACTUACION_PARTES, ambos gaps de "nadie se acordó de conectarlo").

**Decisión:** usar `onRequestError`, una función que `src/instrumentation.ts` puede exportar desde Next 15 (API estable, no experimental) y que el framework llama SOLO, para cualquier error no capturado en cualquier ruta o render, sin que el código de la ruta sepa que existe. Se filtra para que solo registre errores de rutas de Alquileres (`/alquileres`, `/api/alquileres`), no del CLM.

**Hallazgo durante la verificación:** `register()`/`onRequestError` se ligan una sola vez cuando arranca el proceso de `next dev` — un primer intento de verificación, editando `instrumentation.ts` con el servidor ya corriendo desde antes, dio "no se registró nada" porque el proceso en memoria nunca había cargado la versión nueva del archivo. Reiniciar `next dev` lo resolvió. Se documenta en `docs/PROGRESO.md` para que quien continúe no repita la misma confusión (a diferencia de casi todo el resto del código de este módulo, que sí tiene hot-reload en `next dev`).

**Verificado:** `administracion/errores/route.test.ts` (3 pruebas) y en vivo: un `POST` con JSON inválido a una ruta real (`/api/alquileres/inmuebles`) disparó el error, y apareció solo, sin ningún cambio en esa ruta, en `GET /api/alquileres/administracion/errores`.

---

## 2026-10-03 — Carlos descarta las pruebas técnicas (b) y (d), decisión humana explícita

**Qué:** de las 4 pruebas técnicas de la Fase 0 (sección 3 del PRD v2.1), Carlos decidió no ejecutar (b) carga de 4.000 filas/10 usuarios simultáneos ni (d) 20 IDs concurrentes + escritura atómica contra Google real.

**Por qué:** (b) requería escribir primero un script de carga masiva de datos ficticios que nunca se construyó durante el desarrollo autónomo (el runbook lo daba por hecho, pero no existe — ver discrepancia encontrada el 2026-10-03); (d) requería un script chico de 20 altas concurrentes, factible pero de valor marginal frente al riesgo/tiempo, dado que la lógica de asignación de ID y la escritura atómica ya están probadas exhaustivamente contra el doble de la API (`FakeSheetsApi`, T1'), y la escala real de EPE (~15 usuarios, no 10 simultáneos de forma sostenida) hace que el escenario de colisión sea de bajo riesgo práctico.

**Alternativas consideradas:** escribir ambos scripts ahora igual (se descartó por tiempo/beneficio); dejarlas "pendientes" indefinidamente en PENDIENTES-HUMANOS.md (se descartó: es más honesto marcarlas descartadas por decisión explícita que dejarlas como un pendiente eterno que nadie va a resolver).

**Consecuencia:** si en producción real aparecieran 429 de cuota o IDs duplicados, son exactamente los dos riesgos que estas pruebas iban a descartar — quedan como riesgo conocido y aceptado, no como bug. Los runbooks `docs/runbooks/prueba-b-carga.md` y `prueba-d-concurrencia.md` se conservan sin cambios, como referencia de qué habría que hacer si el riesgo se materializa y hay que revisitar la decisión.

---

## 2026-10-03 — RF-25/26/27: generación de documentos server-side (.docx), no Google Docs API

**Qué:** el PRD v2.1 pedía generar el contrato copiando una plantilla de Google Docs vía API (corrigiendo el hallazgo 13: AutoCrat solo mapeaba un locador). Carlos, al evaluar la prueba técnica (c), eligió en cambio construir la generación **server-side con la librería `docx`** (MIT), sin tocar Google Docs/Drive en absoluto.

**Por qué:**
- `armarBloqueLocadores()` (ya construido en el desarrollo autónomo, Fase 3) aplana el bloque de locadores a un solo string — la parte realmente difícil de la integración con Docs (repetir una sección por cada locador) ya no existe como problema, así que el beneficio relativo de usar la API de Docs es menor de lo que parecía al principio.
- Evita habilitar scopes nuevos de Google (Docs API, Drive API), una plantilla real, una carpeta de Drive compartida, y la cuota/latencia asociada.
- El documento generado **siempre** necesita una revisión humana después (las cláusulas de IVA/actualización no se inventan, PENDIENTES-HUMANOS.md punto 10) — perder la edición en vivo de un Google Doc es un costo menor si de todos modos un abogado va a abrir el archivo.
- Totalmente testeable offline, mismo patrón TDD que el resto del módulo (se verifica desarmando el .docx generado con `jszip` y revisando el XML).

**Alternativas consideradas** (presentadas a Carlos antes de decidir):
- A) Google Docs API real (lo que pedía el PRD) — descartada por lo de arriba, no por imposible.
- C) Sin automatización, solo mostrar los 10 valores en pantalla para copiar a mano — descartada: ya que se iba a construir algo, generar el archivo completo cuesta poco más que mostrar los valores.

**Dependencias nuevas, justificadas** (regla de la sección 2 del encargo original): `docx` (runtime, MIT, sin vulnerabilidades — `npm audit` limpio de cosas nuevas, las 5 preexistentes son de `eslint-config-next`) y `jszip` (solo devDependency, para desarmar el .docx en los tests — también usada internamente por `docx`, así que no agrega una familia de dependencias nueva).

**Decisión de diseño menor:** el borrador NO se persiste como fila de `DOCUMENTOS` con `origen: GENERADO` (ese campo del esquema queda sin usar por ahora) — se regenera en cada pedido a partir de los datos actuales, sin guardar ningún archivo. Si el abogado quiere adjuntar la versión final al expediente, usa el flujo ya existente (RF-28: sube su propio archivo a Drive y pega el link). Se evaluó relajar `validarUrlDocumento` para aceptar una URL interna de "redescarga" en vez de un link real de Drive, y se descartó por ahora: agrega complejidad sin un beneficio claro todavía (nadie pidió poder "ver borradores generados anteriormente" como historial).

**Verificado:** `src/lib/alquileres/servicios/generar-contrato-docx.test.ts` (5 pruebas: .docx válido, sector correcto nunca el del firmante, los dos locadores presentes, cláusulas vacías marcadas "A COMPLETAR", cláusulas cargadas se muestran tal cual) y la ruta `.../documentos/generar-contrato/route.test.ts` (2 pruebas, de punta a punta: crea inmueble+área+actuación+2 personas+2 partes reales, descarga el .docx, confirma que los dos locadores y el área aparecen en el XML del documento). `npm test`: 448/448. `npm run lint`: limpio. `npm run build`: limpio, ruta registrada.

---

## 2026-10-03 — Carlos (GAJ) elimina el requisito de dictamen formal escrito (D10) como condición dura de la Fase 5

**Qué:** el PRD v2.1 (D10) exigía un dictamen interno escrito de GAJ sobre base legal del tratamiento, confidencialidad, seguridad e inscripción ante la AAIP, antes de cargar cualquier dato real de personas (Fase 5). Carlos, en su carácter de responsable de GAJ, decidió eliminar esa condición.

**Alcance de la decisión (confirmado explícitamente con Carlos antes de aplicar el cambio):** se elimina el trámite de formalizar un documento separado — el análisis de fondo (base legal, confidencialidad, seguridad, AAIP si corresponde) Carlos ya lo evaluó. No se elimina el criterio de fondo de protección de datos personales, solo el requisito de un papel firmado aparte antes de poder avanzar.

**Por qué se preguntó antes de aplicar:** es exactamente el tipo de decisión que el encargo original (ver el primer mensaje de esta tanda de trabajo) pedía escalar a un humano — toca datos personales/seguridad, no es reversible en el sentido de que una vez cargados datos reales de personas no se puede "deshacer" fácilmente. Como quien pide el cambio es la misma persona que tiene la autoridad de GAJ sobre este punto (no un desarrollo autónomo decidiéndolo solo), se confirmó el alcance exacto y se aplicó.

**Consecuencia:** la Fase 5 (piloto con datos reales) deja de tener esta traba documental. Sigue sin estar empezada — es trabajo nuevo (cargar datos reales, correr la UAT de los casos D.7770/D.7761 si Carlos los aporta, etc.), fuera del alcance de las Fases 0-4 ya cerradas, a decidir por separado cuándo arrancar.

**Verificado:** sin cambios de código — solo documentación (`docs/PENDIENTES-HUMANOS.md` punto 3, `docs/INFORME-FINAL.md`, `docs/PROGRESO.md`).
