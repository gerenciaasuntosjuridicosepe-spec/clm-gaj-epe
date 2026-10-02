# Informe final — Módulo de Gestión de Alquileres

Cierre del desarrollo autónomo según la sección 7 del encargo. Fecha: 2026-10-02. Repositorio: `C:\proyectos\clm-gaj-epe-alquileres` (worktree de `clm-gaj-epe`), rama `feature/alquileres`, nunca mergeada ni pusheada (ver sección "Qué no se hizo" más abajo — es una restricción explícita del encargo, no un olvido).

Este informe es el punto de entrada para quien retome el trabajo. Para el detalle tarea por tarea con comandos y salidas reales, ver `docs/PROGRESO.md` (bitácora completa); para el por qué de cada decisión no trivial, `docs/DECISIONES.md`; para requisito → código → prueba, `docs/TRAZABILIDAD.md`; para lo que solo puede resolver un humano, `docs/PENDIENTES-HUMANOS.md` (12 puntos).

---

## 1. Qué está hecho y verificado

Verificado quiere decir: prueba automática en verde **y**, para cada pieza con una ruta de API o una pantalla, ejercitada en vivo contra `npm run dev` con `curl`/sesiones reales (dev-bypass), no solo deducido de que las pruebas pasan. El detalle completo, con comandos y salidas pegadas, está en `docs/PROGRESO.md`.

### Fase 0 — Correcciones y runbooks (cerrada 2026-09-30)
Las 7 correcciones del PRD v2.1 sección 3 (F0-1 a F0-7): guardia de sesión faltante en 2 rutas del CLM, script de aprovisionamiento desincronizado del esquema, documentación de despliegue incorrecta, mock con cuenta real servible en producción, framework de pruebas (Vitest) instalado, desfase de huso horario en `fechas.ts`. Las 4 pruebas técnicas a-d (requieren Google real) quedaron como runbooks en `docs/runbooks/`, sin ejecutar.

### Fase 1 — Cimientos del módulo (cerrada 2026-10-01)
Modelo de datos independiente del CLM (D2/D5), ~20 reglas de negocio puras con TDD (R2 a R20 implementables sin el libro original), esquema de la planilla + script de aprovisionamiento (T21), roles por módulo (D3/D12) con guardia de acceso en ambas direcciones (T19), repositorio genérico sobre Sheets/mock (R1, T20, T26, prueba técnica d — con un fake completo de la API de Sheets), escritura restringida de Usuarios desde Alquileres (T27), matriz de permisos + guardia de rutas con cobertura automática (RF-42), ABM de Inmuebles/Expedientes/Personas/Actuaciones (alta rápida), menú propio en el sidebar (RF-41).

### Fase 2 — Hitos, alertas, dashboard, calendario (cerrada 2026-10-02)
RF-19 (generación automática de hitos), RF-20 (cumplimiento, recalcula R13/R14), RF-21 (reprogramar/NO_APLICA), RF-12 parcial (formalización guiada vía API — R5 para `fecha_fin`, T20 para concurrencia), Dashboard (RF-40/sección 8), pantalla de Alertas filtrable, Calendario propio (componente visual propio, no el del CLM — ver decisión del 2026-10-02 en `DECISIONES.md`).

### Fase 3 — Comunicaciones y documentos, en lo posible sin Google real (cerrada 2026-10-02)
RF-22/23/24 (aviso/reiteración con destinatarios armados desde CONTACTOS_EPE vigentes, "Marcar como enviado" cumple el hito, carta documento se registra directo), RF-28 (adjuntar documento con enlace validado — A6 funciona de verdad), RF-29 (actos administrativos gatean FORMALIZADA de un LEGITIMO_ABONO), RF-33 parcial (alta de Áreas/Contactos EPE), RF-25/26/27 parcial (lógica pura de armado de las 10 etiquetas de plantilla, sin la llamada real a Docs).

### Fase 4 — Reportes y operación, en lo posible sin Google real (cerrada 2026-10-02, última fase del encargo)
- **Dos gaps reales de Fase 1 encontrados y corregidos de raíz** al construir esta fase (no eran tareas nuevas, eran código de Fase 1 modelado pero nunca conectado):
  - **LOG_CAMBIOS (RF-38/M9, prioridad M del PRD original, + M17 del v2.1):** nunca se escribía ninguna fila. Se conectó genéricamente en el repositorio (`repositorio-mock.ts`/`repositorio-sheets.ts`), no por ruta — cualquier tabla queda auditada sola. Una entrada ALTA por alta, una MODIFICACION por campo cambiado, una BAJA cuando el único cambio es `activo: true→false`, una CONFLICTO_VERSION en cada rechazo por versión vieja.
  - **ACTUACION_PARTES (RF-10):** no tenía ninguna ruta de API, lo que significaba que R8 (CONTRATO/ADENDA exigen un titular y un firmante antes de FORMALIZADA) nunca se había podido ejercitar. Se agregó el alta (`POST/GET .../actuaciones/[id]/partes`) y se conectó R8 en los dos caminos reales a FORMALIZADA.
- RP-01 (vencimientos por horizonte), RP-02 (cartera de contratos vigentes, con máscara de datos personales para LECTOR), RP-09 (calidad de datos), RP-10 (actividad y cambios) — 4 de los 12 reportes del PRD, elegidos por ser los más ligados al criterio de cierre ("las cifras coinciden con el dashboard") y el que valida LOG_CAMBIOS.
- Exportación CSV (con BOM UTF-8 y protección de inyección de fórmulas) para los 4 reportes.
- RF-39 (respaldo manual + alerta A8): el ADMINISTRADOR registra que hizo la copia manual; la app calcula "hace N días" y la alerta sola.
- Pantalla de errores, alimentada automáticamente por `onRequestError` (Next.js, API estable desde v15) — cualquier error no capturado en una ruta de Alquileres queda registrado sin que la ruta tenga que hacer nada.
- Primer usuario mock LECTOR (nunca existió uno hasta esta tarea) — permitió verificar en vivo, por primera vez, el enmascarado de datos personales y los bloqueos de ese rol.

**Estado final de la suite, verificado por mí mismo justo antes de escribir este informe** (no es un recorte de una corrida anterior):

```
> clm-gaj-epe@0.1.0 test
> vitest run --run

 Test Files  56 passed (56)
      Tests  440 passed (440)
```

`npx tsc --noEmit`: limpio. `npm run lint`: limpio. `npm run build`: compila y pasa TypeScript sin errores, registra 31 rutas de Alquileres (páginas + API, `npm run build 2>&1 | grep -c alquileres`) más todas las rutas del CLM sin cambios. 32 commits de este desarrollo sobre `main` (`git log --oneline main..feature/alquileres | wc -l`), working tree limpio, sin `.env.local`, sin secretos en el historial (verificado con grep de patrones de clave privada/API key sobre `git log --all -p`).

---

## 2. Qué está hecho pero NO verificado contra Google real

Todo el repositorio sobre Sheets (`RepositorioSheets`, R1/T20/M15) está probado contra un **doble completo** de la API de Sheets (`transporte-sheets-fake.ts`, `FakeSheetsApi`) — nunca contra una planilla real. Esto incluye: el repositorio genérico, LOG_CAMBIOS/ERRORES/PARAMETROS (los tres módulos "chicos" fuera del repositorio genérico), el script de aprovisionamiento (`scripts/setup-sheet-alquileres.mjs`, con su propia prueba de coherencia T21 pero sin ejecutarse nunca contra Sheets real), y las 4 pruebas técnicas a-d del PRD v2.1 sección 3 (quedaron como runbooks en `docs/runbooks/`).

Esto es exactamente como lo pide el encargo (nunca hablar con Google real) — se anota acá para que quede explícito qué parte de la confianza es "la lógica está probada contra un doble fiel" vs. "se ejecutó contra la cosa real".

---

## 3. Qué NO se hizo y por qué

| Ítem | Por qué no |
| --- | --- |
| Fase 5 (piloto) y Fase 6 (migración histórica) | Fuera del límite del encargo — Fase 5 además tiene como precondición dura el dictamen de GAJ (D10), que no existe. |
| RF-25 (generación real de contrato/adenda desde Google Docs) | Requiere la API de Docs/Drive con credenciales reales — prohibido. La lógica pura (armar los valores de las 10 etiquetas) está hecha y probada (`reglas/datos-plantilla.ts`). |
| Redacción legal de IVA/regla de actualización en los contratos generados | Contenido legal real, no inventado — PENDIENTES-HUMANOS.md punto 10. |
| Copia real del respaldo a Google Drive (RF-39) | Requiere Google real + que un humano complete `carpeta_drive_respaldos` (vacío en el xlsx reconstruido). El registro manual ("ya lo hice") sí está hecho. |
| RP-03 a RP-08, RP-11, RP-12 (8 de los 12 reportes) | Tiempo — se priorizaron los 4 más ligados al criterio de cierre de Fase 4. Mismo patrón ya probado (agregación pura + ruta + página + export CSV), documentado en `docs/PROGRESO.md` para que quien continúe los replique sin re-derivar el patrón. |
| Impresión a PDF con hoja de estilos dedicada | Las páginas de reportes son HTML con tablas simples, imprimibles tal cual desde el navegador, pero sin un `@media print` curado. |
| RF-37 completo (editar un parámetro ya sembrado y que se aplique de inmediato) | La mayoría del código lee `PARAMETROS_SEED` (la semilla) directo, no el repositorio — solo el parámetro nuevo de esta fase (`ultimo_respaldo_en`) pasa por un repositorio de verdad. Migrar cada lectura existente es un refactor más amplio, no se hizo por el riesgo de regresión a esta altura del encargo. |
| "Administración" como grupo de menú propio (parte de RF-41) | Áreas, Contactos EPE, Plantillas, Feriados y Parámetros tienen API (construida a medida que algo las necesitó) pero no una pantalla propia dentro de un menú "Administración". |
| UI de ficha de detalle de una actuación (RF-16: "todos los bloques en una pantalla") | Comunicaciones/documentos/actos/partes tienen API pero no una pantalla integrada — se operan hoy vía API directamente (documentado en cada ruta, verificado en vivo con curl). |
| R17/R18 (cambio de tipo de actuación, RF-14) | Reglas puras ya probadas desde Fase 1, nunca conectadas a una ruta — no era parte central de ninguna fase posterior, quedó en el backlog. |
| `git merge` / `git push` | Prohibido explícitamente por el encargo. La rama queda lista para que un humano la revise y decida. |

---

## 4. Decisiones por defecto tomadas (resumen — el detalle completo con alternativas está en `docs/DECISIONES.md`, ~20 entradas)

- **Precedencia documental:** v2.1 > v1 > xlsx reconstruido, aplicada cada vez que hubo conflicto (registrado en cada caso).
- **Campos "INFERIDO"/"PROPUESTA" del xlsx usados tal cual, registrados:** las 10 etiquetas de `ETIQUETAS_PLANTILLA` (7 de 10 son "PROPUESTA" de la reconstrucción, no texto literal del PRD — se usaron igual, con su estado anotado en `catalogos/etiquetas-plantilla-seed.ts`); `tipo_area` (solo SUCURSAL/GERENCIA confirmados, el resto queda en catálogo editable vacío); `cargo` (los 4 confirmados en el PRD).
- **Campos "a completar con el original" NUNCA inventados:** hitos H-06 a H-14/H-16 a H-19, `destino_categoria`, reglas R6/R10-R12, `caracter` completo, `tipo_documento` completo — todos como catálogo editable vacío o con el hueco documentado, nunca con un valor hardcodeado (ver `PENDIENTES-HUMANOS.md` punto 1).
- **Nunca se fabricó la apariencia de una acción real que no ocurrió:** ni un "generador de documentos" simulado (RF-25) ni un "botón de respaldo" que simule copiar a Drive (RF-39) — en ambos casos se construyó la parte real posible (lógica pura / registro manual) y se dejó explícito en PENDIENTES-HUMANOS.md qué falta y cómo conectarlo cuando haya Google real.
- **xlsx (SheetJS) descartado como dependencia de runtime** por 2 vulnerabilidades de severidad alta sin parche — se exporta solo CSV.
- **Dos matrices de permisos nuevas en Fase 3/4** (`MATRIZ_DOCUMENTOS`, `MATRIZ_COMUNICACIONES`, `MATRIZ_REPORTES`) transcriptas literalmente de la tabla de permisos de la sección 3 del PRD v1 — nunca inventadas; donde la tabla no tenía una fila explícita (Áreas), se usó el default más restrictivo razonable, anotado.
- **Bugs reales encontrados y corregidos durante el trabajo normal** (no buscados aparte): R3' no se validaba siempre en Actuaciones (Fase 1); identidad de clase de `ConflictoVersionError` entre "layers" de Turbopack, resuelto con un type guard por forma en vez de `instanceof` (Fase 2); duplicados/estado inválido no chequeados en comunicaciones, y `ConflictoVersionError` no capturado en la ruta de hitos (Fase 3); LOG_CAMBIOS y ACTUACION_PARTES nunca conectados (Fase 4, ver sección 1).

---

## 5. Riesgos conocidos

- **Ventanas de carrera (TOCTOU) aceptadas, no resueltas:** altas de Inmuebles/Expedientes/Personas (verificación de duplicado antes de escribir) y el upsert de PARAMETROS sin control de versión — aceptado a la escala de GAJ (≤15 usuarios), mismo criterio que el propio PRD acepta para el control optimista de versión en general (ventana de milisegundos entre lectura y escritura).
- **`instrumentation.ts` (`register`/`onRequestError`) se liga una sola vez al iniciar `next dev`** — un cambio en ese archivo no tiene efecto hasta reiniciar el servidor de desarrollo, a diferencia de casi todo el resto del código. Documentado para no perder tiempo si alguien lo edita y no ve el efecto esperado.
- **Cuenta real embebida como dato de prueba:** `src/lib/data/mock-catalogos.ts` tiene a `paganinicg@gmail.com` (el coordinador) como usuario ADMINISTRADOR tanto del CLM como de Alquileres — preexistente desde antes de esta rama, necesario para que el login real de Google funcione en desarrollo; no es un secreto (es un email, no una credencial) pero sí es un dato real en código fuente, a tener en cuenta antes de cualquier publicación del repositorio.
- **Dependencia de un único titular de cuentas (D9):** riesgo ya aceptado por Carlos el 30/09, no mitigado en este desarrollo (es una decisión organizacional, no de código).
- **La cobertura de LOG_CAMBIOS es retroactivamente incompleta:** las operaciones hechas ANTES de este commit (si alguna persistiera entre sesiones, lo cual no aplica al mock en memoria pero aplicaría a una Sheets real ya en uso) no habrían quedado auditadas — el hook es hacia adelante desde que se activó.

---

## 6. Pasos exactos para un humano

### 6.1. Habilitar y correr las pruebas contra Google real (pruebas técnicas a-d + T21 real)

1. Crear una planilla nueva de Google Sheets (vacía) dedicada a Alquileres — **nunca** reusar la planilla del CLM.
2. Crear o reusar una cuenta de servicio de Google Cloud con la API de Sheets habilitada; compartir la planilla con el email de esa cuenta de servicio como Editor.
3. En `clm-gaj-epe-alquileres/.env.local` (crearlo — no existe en este worktree a propósito):
   ```
   GOOGLE_SHEETS_ALQUILERES_ID=<id de la planilla nueva>
   GOOGLE_SERVICE_ACCOUNT_EMAIL=<email de la cuenta de servicio>
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="<clave privada, con los \n literales si Node los necesita escapados>"
   ```
4. Crear el esquema en la planilla real (**revisar el script antes de correrlo — no se ejecutó nunca contra Google real en este desarrollo**):
   ```
   node scripts/setup-sheet-alquileres.mjs
   ```
5. Seguir los 4 runbooks de `docs/runbooks/` (`prueba-a-login.md`, `prueba-b-carga.md`, `prueba-c-plantilla.md`, `prueba-d-concurrencia.md`) paso por paso.
6. Para correr la app contra la planilla real: `npm run build && npm start` (o `npm run dev`) con las variables de entorno cargadas — confirmar que `googleSheetsAlquileresConfigurado()` da `true` y que el modo mock ya no se usa.

### 6.2. Desplegar un preview de Vercel

1. Este repositorio (`clm-gaj-epe-alquileres`) es un worktree de `clm-gaj-epe` en la rama `feature/alquileres` — el remoto (`origin`, ver `git remote -v`) es el mismo que el checkout principal.
2. **No se hizo ningún push desde este desarrollo** (prohibido por el encargo). Para desplegar un preview, un humano debe:
   ```
   git push origin feature/alquileres
   ```
   (desde su propia máquina/checkout, revisando antes el diff completo — ver 6.3).
3. Si el proyecto de Vercel ya está conectado al repositorio de GitHub, el push a una rama no-`main` genera automáticamente un preview deployment. Si no, conectar el proyecto desde el dashboard de Vercel.
4. El preview va a arrancar SIN Google Sheets configurado (no hay `.env.local`, y las variables de Vercel son las del CLM, no las de Alquileres) — por diseño (F0-4), si `NODE_ENV=production` y no hay Sheets configurado, la app **no arranca** (`src/instrumentation.ts`, `register()`). Para que el preview sirva el módulo de Alquileres de verdad, hay que cargar las variables de 6.1 en la configuración de ese preview en Vercel.

### 6.3. Revisar el diff completo de la rama

```
git fetch origin
git diff origin/main...feature/alquileres --stat   # resumen de archivos
git diff origin/main...feature/alquileres          # diff completo
git log origin/main..feature/alquileres --oneline   # los commits de este desarrollo (32, desde "Agregar documentos fuente del modulo..." hasta el cierre de Fase 4)
```

Si `origin/main` no está disponible localmente, reemplazar por `main` (la rama local) — confirmar primero con `git fetch origin main` que está actualizada.

---

## Resumen denso para el coordinador

Las 4 fases del encargo (0 a 4) quedan cerradas en todo lo posible sin hablar con Google real ni inventar datos/contenido legal — 32 commits sobre main, 440/440 tests, lint y build en verde, verificado por mí mismo ahora mismo, no heredado de una corrida vieja. Al construir Fase 4 aparecieron dos gaps reales de Fase 1 (LOG_CAMBIOS nunca escribía nada pese a ser RF-38 prioridad M; ACTUACION_PARTES no tenía API, así que R8 nunca se pudo ejercitar) — ambos corregidos de raíz y conectados genéricamente, no parchados caso por caso. Se construyeron 4 de los 12 reportes (RP-01/02/09/10), exportación CSV (se descartó la librería `xlsx` por tener vulnerabilidades sin parche), el respaldo manual con alerta A8, y una pantalla de errores con cobertura automática vía `onRequestError`. Dos veces más se encontró algo que "parecía poder simularse" (generar un documento, copiar un respaldo a Drive) y en ambas se decidió no fabricar la apariencia de que la app hizo algo que no hizo — se deja la lógica real lista y el paso humano exacto en `PENDIENTES-HUMANOS.md` (12 puntos en total). Lo no hecho por tiempo (8 reportes, UI de ficha de actuación, RF-37 completo, menú de Administración) queda listado con el patrón a seguir. Nunca se tocó `main`, nunca se hizo push, nunca se instaló una dependencia sin justificar, sin secretos en el historial. La rama `feature/alquileres` queda lista para que un humano la revise, decida sobre Fase 5 (requiere el dictamen de GAJ) y habilite las pruebas contra Google real siguiendo la sección 6 de este informe.
