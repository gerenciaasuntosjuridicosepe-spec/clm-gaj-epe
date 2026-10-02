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
