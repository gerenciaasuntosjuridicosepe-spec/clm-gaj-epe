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
| Fase 1 (cimientos del módulo) | **Cerrada** — 2026-10-01, ver "Fase 1 — cierre" más abajo |
| Fase 2 (hitos, alertas, dashboard, calendario) | **Cerrada** — 2026-10-02, ver "Fase 2 — cierre" más abajo |
| Fase 3 (comunicaciones y documentos) | **Cerrada en lo posible sin Google real** — 2026-10-02, ver "Fase 3 — cierre" más abajo; lo que requiere Google real queda en PENDIENTES-HUMANOS.md puntos 10-11 |
| Fase 4 (reportes y operación) | **Cerrada en lo posible sin Google real** — 2026-10-02, ver "Fase 4 — cierre" más abajo; es la última fase del encargo (Fase 5/6 quedan fuera de alcance) |
| Fase 5/6 (piloto, migración) | Fuera de alcance de este desarrollo — requieren datos reales, sin empezar (ya sin la traba del dictamen formal de GAJ, eliminada por Carlos el 2026-10-03 — ver DECISIONES.md) |

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

## Fase 1 — cierre

Cerrada el 2026-10-01. Se construyeron los cimientos completos del módulo (ver la bitácora de abajo para el detalle de cada commit, y `docs/TRAZABILIDAD.md` para el mapeo requisito → código → prueba):

- Modelo de datos (`tipos.ts`), catálogos semilla, `fechas.ts` propio.
- Las 20 reglas de negocio puras implementables sin el libro original (R2, R3'/R3a, R4', R5, R8, R9, R13-R20 + validaciones + alertas A1-A8 + campos calculados C1/C4/C6 + legítimo abono + comunicaciones) — 312 pruebas automáticas en total en el repositorio al cierre de esta fase.
- Esquema de la planilla de Alquileres + script de aprovisionamiento (T21).
- Roles por módulo (D3/D12) con guardia de acceso (proxy + `/sin-acceso`), login de desarrollo (dev-bypass) y verificación en vivo de T19 (en ambas direcciones).
- Repositorio genérico sobre Sheets (R1, T20, T26, prueba técnica d) + mock en memoria, con fake/doble completo de la API de Sheets para probar sin Google real.
- Escritura restringida de Usuarios desde Alquileres (T27).
- Matriz de permisos del módulo (`permisos.ts`) y guardia de rutas de API propia (`alquileres/auth-guard.ts`, RF-42 — cobertura automática para cualquier ruta nueva).
- ABM completo de las 4 tablas raíz (RF-05, RF-07/08, RF-09, RF-11): Inmuebles, Expedientes, Personas (con bloqueo total de LECTOR) y Actuaciones (alta rápida; RF-12 formalización guiada queda para Fase 2/3), verificado en vivo de punta a punta encadenando los 4 altas con referencias cruzadas correctas.
- Menú propio "Alquileres" en el sidebar (RF-41), filtrado por rol, separado del menú del CLM.
- Revisión adversarial de cierre (ver sección "Hallazgos de la revisión adversarial" más abajo): encontró y corrigió un bug real (R3' no se validaba siempre en Actuaciones) y documentó limitaciones aceptadas (ventanas de carrera en altas, caso LECTOR del menú no verificado en vivo).

**Nota sobre continuidad:** esta fase se desarrolló a lo largo de varias sesiones interrumpidas por el límite de uso compartido de la cuenta (no un error del desarrollo — se retoma automáticamente). Cada retoma empezó re-verificando `git log`/`git status`/`git diff`/`npm test`/`npx tsc --noEmit` antes de seguir, sin asumir que el estado dejado por la sesión anterior (o por un subagente) ya estaba probado.

## Fase 2 — cierre

Cerrada el 2026-10-02. Hitos, alertas, dashboard, calendario (ver la bitácora de abajo para el detalle de cada commit, y `docs/TRAZABILIDAD.md` para el mapeo requisito → código → prueba):

- RF-19 (generación automática de hitos al crear un CONTRATO), RF-20 (cumplimiento de un hito, recalcula R13/R14) y RF-21 (reprogramar/NO_APLICA).
- RF-12 parcial: formalización guiada (carga de los campos que exige R4', con R5 para la fecha de fin y T20 para la concurrencia) — falta la UI de edición en la ficha de la actuación (queda para cuando exista esa ficha) y el camino para LEGITIMO_ABONO; ver "Próximas tareas".
- Dashboard (RF-40/sección 8 PRD v1): tarjetas de indicadores + cola de trabajo sobre A1/A4/A5/A6.
- Alertas: pantalla propia y filtrable sobre la misma cola de trabajo.
- Calendario (RF-40): vencimientos efectivos (R15/C3) e hitos previstos, con un componente visual propio (no se reutilizó el del CLM tal cual — ver `docs/DECISIONES.md`, 2026-10-02).
- Revisión adversarial de cierre (más liviana que la de Fase 1, enfocada en lo nuevo de esta fase): se revisó específicamente (a) que `/alquileres/alertas` y `/alquileres/calendario` quedan cubiertas por la guardia de acceso por módulo sin ningún cambio de código — `tieneAccesoARuta()` en `src/lib/acceso-modulo.ts` usa `pathname.startsWith("/alquileres")`, no una lista enumerada de rutas, igual que RF-42 para las rutas de API; (b) que ninguna de las dos pantallas nuevas expone datos de Personas (solo `actuacionId`/`inmuebleId`/`hitoId`), así que no hace falta un chequeo de permiso adicional más allá del que ya exige el módulo (todos los roles tienen "leer" en `MATRIZ_GESTION`); (c) que `diferenciaDias` nunca devuelve algo que haga caer `nivelSemaforo` en la rama "gris" para un evento de vencimiento real. No se encontraron bugs nuevos en esta pasada — el único hallazgo real de esta fase (identidad de clase de `ConflictoVersionError` entre "layers") ya se corrigió y está documentado en `docs/DECISIONES.md` (2026-10-02).

**Limitaciones aceptadas, documentadas, no bloqueantes:** `[id]/hitos/route.ts` todavía no captura `ConflictoVersionError` (responde 500 en vez de 409 ante un conflicto de versión en esa ruta puntual); R17/R18 (cambio de tipo de actuación, RF-14) son reglas puras ya probadas pero sin ruta que las invoque todavía; RF-12 solo tiene la API, no una pantalla de edición propia.

## Fase 3 — cierre

Cerrada el 2026-10-02, en lo que es posible sin Google real (ver `docs/TRAZABILIDAD.md` para el mapeo requisito → código → prueba):

- RF-22/23/24 (comunicaciones): borrador de AVISO/REITERACION con destinatarios armados desde CONTACTOS_EPE vigentes del área (RF-22); "Marcar como enviado" (M16/T23) recién ahí cumple el hito; CARTA_DOCUMENTO se registra directo, sin borrador.
- RF-28 (documentos): adjuntar un enlace validado (`drive.google.com`/`docs.google.com`) — A6 (formalizada sin escaneado) funciona de verdad por primera vez, con datos reales pasados al dashboard/alertas.
- RF-29 (actos administrativos): un LEGITIMO_ABONO no pasa a FORMALIZADA sin al menos uno — wiring agregado a `[id]/route.ts` (que de paso ganó la capacidad de llevar ADENDA/LEGITIMO_ABONO a FORMALIZADA por edición directa del estado, algo que antes no existía en absoluto).
- RF-33 parcial: alta mínima de Áreas y Contactos EPE, necesaria para que RF-22 tenga de dónde sacar destinatarios.
- RF-25/26/27 parcial: lógica pura de armado de los 10 valores de `ETIQUETAS_PLANTILLA` (RF-26 bloque repetible de locadores, RF-27 `SECTOR_EPE`), probada, sin la llamada real a Google Docs (eso y la redacción legal de IVA/actualización quedan en `docs/PENDIENTES-HUMANOS.md`, puntos 10 y 11 — deliberadamente no se construyó una ruta que simule "generar" un documento, ver `docs/DECISIONES.md`).
- Revisión adversarial de cierre: encontró y corrigió un hueco real en `[id]/comunicaciones/route.ts` (se podían preparar bordadores duplicados o comunicaciones para un hito ya cumplido) y otro en `[id]/hitos/route.ts` (no capturaba `ConflictoVersionError`, daba 500 en vez de 409) — ambos con pruebas nuevas. Se verificó además que el esquema de las 5 tablas nuevas (AREAS, CONTACTOS_EPE, COMUNICACIONES, DOCUMENTOS, ACTOS_ADMIN) ya estaba completo en `esquema.ts` desde Fase 1 y que el script de aprovisionamiento (T21, `scripts/setup-sheet-alquileres.test.ts`) las sigue cubriendo sin cambios, por derivar todo de la misma fuente única.

**Limitaciones aceptadas, documentadas, no bloqueantes:** sin UI propia para comunicaciones/documentos/actos (solo API, dentro de la ficha de la actuación que todavía no existe); RF-12 sin pantalla de edición propia; R17/R18 (RF-14) sin ruta que las invoque.

## Fase 4 — cierre

Cerrada el 2026-10-02 — **última fase del encargo** (Fase 5/6 quedan fuera de alcance, ver `docs/PENDIENTES-HUMANOS.md`). Antes de escribir código se releyó la sección 9 del PRD v1 (RP-01 a RP-12) y la sección 4 del v2.1 (exportaciones XLSX/CSV simplificadas, respaldo manual D13/RF-39, LOG_CAMBIOS M9/M17). Dos hallazgos reales de Fase 1 (modelados en el esquema desde el principio, nunca conectados a ninguna ruta) aparecieron al construir esta fase y se corrigieron de raíz, no solo para los reportes:

- **RF-38/M9/M17 (LOG_CAMBIOS):** nunca se escribía ninguna fila, a pesar de ser prioridad M desde el PRD v1. Se conectó GENÉRICAMENTE en `repositorio-mock.ts`/`repositorio-sheets.ts` (`crear`/`actualizar`/`actualizarMultiple`) — cualquier tabla del módulo queda auditada sola, sin que cada ruta tenga que acordarse de llamar nada. Una entrada ALTA por alta, una MODIFICACION por cada campo que cambió (ignora los de auditoría que siempre cambian), una BAJA cuando el único cambio es `activo: true→false`, y una CONFLICTO_VERSION cuando `actualizar()` rechaza por versión vieja (M17) — sin interrumpir la operación de negocio si falla la escritura del log. `repositorio/log-cambios.ts` (nuevo), 7 pruebas propias + 2 en cada repositorio genérico.
- **RF-10 (ACTUACION_PARTES):** tampoco tenía ninguna ruta de API, así que R8 ("al menos un titular y un firmante para CONTRATO/ADENDA antes de FORMALIZADA") nunca se había podido ejercitar de verdad. Se agregó `POST/GET .../actuaciones/[id]/partes` y se conectó R8 en los dos caminos a FORMALIZADA que existen (`cumplir-hito-servicio.ts` para CONTRATO vía H-15, `[id]/route.ts` para ADENDA vía edición directa del estado) — verificado en vivo: sin partes, el estado se queda en EN_TRAMITE/rechaza; con un titular y un firmante, pasa a FORMALIZADA.
- RP-01 (Vencimientos por horizonte), RP-02 (Cartera de contratos vigentes), RP-09 (Calidad de datos) y RP-10 (Actividad y cambios, que valida el punto anterior) — los 4 reportes más directamente ligados al criterio de cierre de la fase ("las cifras de los reportes coinciden con el dashboard") y al hallazgo de LOG_CAMBIOS. RP-03 a RP-08, RP-11 y RP-12 no se construyeron — ver "Próximas tareas".
- Exportación CSV (`lib/alquileres/exportar.ts`, `aCsv`) con BOM UTF-8, escape RFC 4180 y protección de inyección de fórmulas (T13/NF-S4) — **no XLSX binario real**: se evaluó instalar `xlsx` (SheetJS) y se descartó por tener 2 vulnerabilidades de severidad alta sin parche (`npm audit`, Prototype Pollution + ReDoS) — ver `docs/DECISIONES.md`.
- RF-39 [CAMBIO v2.1] (respaldo manual + alerta A8): botón del ADMINISTRADOR en el dashboard que REGISTRA que ya hizo la copia manual a Drive (la app no la hace — necesitaría la API de Drive real, fuera de los límites duros) — mismo patrón que "Marcar como enviado" de RF-23. Verificado en vivo: sin respaldo nunca registrado, A8 encendida; al registrar, se apaga y muestra "hace 0 día(s)".
- Pantalla de errores: `src/instrumentation.ts` ganó `onRequestError` (API estable desde Next 15 — cobertura automática de CUALQUIER error no capturado en cualquier ruta de Alquileres, sin tocar cada ruta una por una, mismo criterio que RF-42/T26). Verificado en vivo provocando un error real (JSON inválido en un POST) — apareció solo en `/api/alquileres/administracion/errores`. **Nota importante encontrada en la verificación:** `onRequestError`/`register()` se ligan una sola vez al iniciar el proceso de `next dev` — editar `instrumentation.ts` con el servidor ya corriendo NO alcanza, hace falta reiniciar `next dev` para que el cambio tome efecto (a diferencia de casi todo el resto del código, que sí tiene hot-reload). Esto explicó un primer intento de verificación que dio "vacío" por error de método, no por un bug real — documentado para no repetir la confusión.
- Se agregó un usuario mock LECTOR (`lector.alquileres@ejemplo.test`, `u8`) — no existía ninguno hasta esta tarea, así que el caso LECTOR (oculta "Personas" del menú, enmascara `locadores` en RP-02, bloquea RP-09/RP-10/exportar) nunca se había verificado en vivo, solo por pruebas unitarias con sesión simulada. Verificado en vivo de punta a punta en esta tarea.

**Limitaciones aceptadas, documentadas, no bloqueantes:** RP-03 a RP-08, RP-11, RP-12 no construidos (mismo patrón que los 4 que sí se hicieron, quedan para quien continúe); PDF por impresión del navegador no se armó (hoja de estilos de impresión específica) — las pantallas ya son HTML con tablas simples, imprimibles tal cual con el navegador, pero sin una hoja `@media print` dedicada; RF-37 (editar parámetros ya sembrados y que se aplique de inmediato) sigue sin wiring completo — la mayoría del código lee `PARAMETROS_SEED` directo, no el repositorio (ver nota en `datos/parametros.ts`); "Administración" como sección de menú propia (RF-41) no se armó — Áreas/Contactos EPE/Plantillas/Feriados/Parámetros siguen sin ABM con pantalla (solo API, construida en Fases 3-4 a medida que algo las necesitó).

## Tarea actual

Ninguna — Fase 4 (última del encargo) cerrada. Sigue la revisión adversarial final de todo el branch y `docs/INFORME-FINAL.md` (sección 7 del encargo).

## Próximas tareas (orden previsto, todas para quien continúe — fuera del límite de esta sesión)

1. Revisión adversarial de cierre de Fase 4 (mismo proceso que las 3 anteriores) y después el informe final.
2. RP-03 a RP-08, RP-11, RP-12 — mismo patrón que los 4 ya construidos (agregación pura + ruta + página + export CSV).
3. R17/R18 wiring (diferido desde Fase 2): aplicar `aplicarCambioTipoActuacion` (RF-14) y las condiciones automáticas de NO_APLICA de R18.
4. UI: pantallas propias para comunicaciones/documentos/actos/partes dentro de una ficha de detalle de la actuación (RF-16, todavía no existe) y edición de RF-12 — hoy todo eso es API-only.
5. RF-37 completo: migrar las lecturas de `PARAMETROS_SEED` al repositorio (`datos/parametros.ts`) para que editar un parámetro se aplique de verdad, con una pantalla de Administración.
6. Lo que requiere Google real (RF-25 generación de documentos, RF-39 copia real a Drive) o contenido legal (redacción de IVA/actualización) — ver `docs/PENDIENTES-HUMANOS.md`, puntos 10 y 11.

## Resultado de las últimas pruebas (2026-10-02, cierre de Fase 4)

```
> clm-gaj-epe@0.1.0 test
> vitest run --run

 Test Files  56 passed (56)
      Tests  440 passed (440)
```

`npx tsc --noEmit`: sin salida (limpio). `npm run lint`: sin salida (limpio). `npm run build`: OK — agrega `/api/alquileres/actuaciones/[id]/partes`, `/api/alquileres/reportes/{vencimientos,cartera,calidad-datos,actividad}`, `/api/alquileres/administracion/{respaldo,errores}`, `/alquileres/reportes` (+4 subpáginas), `/alquileres/administracion/errores`; todo lo anterior sin cambios.

### 2026-10-02 — Fase 4: LOG_CAMBIOS (RF-38/M9/M17), ACTUACION_PARTES (RF-10) + R8, RP-01/02/09/10, exportación CSV, respaldo (RF-39/A8), pantalla de errores

Ver el detalle completo en "Fase 4 — cierre" más arriba. Resumen de archivos nuevos: `repositorio/log-cambios.ts`, `repositorio/errores.ts`, `datos/{actuacion-partes,parametros}.ts`, `app/api/alquileres/actuaciones/[id]/partes/route.ts`, `reglas/{rp01-vencimientos,rp02-cartera,rp09-calidad-datos}.ts`, `lib/alquileres/exportar.ts`, `app/api/alquileres/reportes/{vencimientos,cartera,calidad-datos,actividad}/route.ts`, `app/alquileres/reportes/**`, `app/api/alquileres/administracion/{respaldo,errores}/route.ts`, `app/alquileres/administracion/errores/page.tsx`, `components/pages/alquileres-respaldo-admin.tsx`. Modificados: `repositorio-mock.ts`/`repositorio-sheets.ts` (hook genérico a LOG_CAMBIOS), `repositorio/index.ts` (`obtenerTransporteHttpCompartido` extraído y reusado), `servicios/cumplir-hito-servicio.ts` y `app/api/alquileres/actuaciones/[id]/route.ts` (R8), `src/instrumentation.ts` (`onRequestError`), `permisos.ts` (`MATRIZ_REPORTES`), `navegacion.ts`/`sidebar.tsx` (ítem "Reportes"), `src/lib/data/mock-catalogos.ts` (usuario LECTOR de prueba, `u8`).

- **Verificado en vivo, de punta a punta, contra `npm run dev`** (no solo con pruebas): alta → LOG_CAMBIOS con la entrada ALTA correspondiente; formalización + cumplir hitos sin partes → R8 bloquea FORMALIZADA (se queda en EN_TRAMITE); agregado un titular y un firmante → FORMALIZADA de verdad; RP-01/RP-02/RP-09 con datos reales, cifras coherentes entre sí; exportación CSV con headers y BOM correctos; RF-39 con A8 encendida sin respaldo y apagada después de registrar uno; `onRequestError` registrando un error real (JSON inválido) en la pantalla de errores — con la salvedad del reinicio de `next dev` ya anotada arriba; usuario LECTOR viendo RP-02 con `locadores` vacío y recibiendo 403 en RP-09/RP-10/exportar/Personas, y el sidebar ocultándole "Personas" correctamente.
- `npm test`: 440/440 OK (385 al empezar esta fase → 440, +55 pruebas nuevas). `npx tsc --noEmit`: limpio. `npm run lint`: limpio. `npm run build`: OK.

### 2026-10-02 — RF-25/26/27 (parcial): lógica pura de armado de plantillas, sin Google

- Se releyó la hoja `ETIQUETAS_PLANTILLA` del xlsx reconstruido (10 etiquetas, 3 "Constatado en el PRD" y 7 "PROPUESTA") — ver `docs/DECISIONES.md` para el método de lectura (variación menor sobre el de Paso 0, sin huella en el repositorio, verificado con `git status`).
- `catalogos/etiquetas-plantilla-seed.ts`: catálogo único de las 10 etiquetas con su estado (CONSTATADO/PROPUESTA) y campo de origen.
- `reglas/datos-plantilla.ts`: `reemplazarEtiquetas` (reemplazo genérico `{{CLAVE}}`, deja el placeholder si falta el valor, para notar lo que falta cargar en vez de borrarlo en silencio), `armarBloqueLocadores` (RF-26: todas las partes TITULAR, en orden, con nombre + DNI o CUIT + domicilio + carácter — corrige el hallazgo 13 de mostrar solo un locador), `armarValoresPlantillaContrato` (arma los 10 valores; RF-27: `SECTOR_EPE` sale de `AREAS.nombre`, nunca del firmante — corrige el hallazgo 14).
- **No se construyó** una ruta de API que "genere" un documento (ni con una URL simulada) — la llamada real a Google Docs/Drive es un paso que solo puede hacer un humano con credenciales reales; ver `docs/PENDIENTES-HUMANOS.md` puntos 10 y 11 para la redacción legal pendiente y el paso exacto de conexión real.
- `reglas/datos-plantilla.test.ts` (6 pruebas): incluye la verificación explícita de que `SECTOR_EPE` nunca coincide con el nombre del firmante (hallazgo 14), y que el bloque de locadores respeta el orden y excluye a los FIRMANTE.
- `npm test`: 383/383 OK (377 → 383, +6). `npx tsc --noEmit`: limpio. `npm run lint`: limpio. `npm run build`: OK.

### 2026-10-02 — Fase 3 (parcial): Comunicaciones (RF-22/23/24), Documentos (RF-28), Actos administrativos (RF-29)

- `reglas/comunicaciones.ts` (`armarDestinatarios`, nueva): RF-22 — sector SUCURSAL -> jefe de sucursal + designado; cualquier otro `tipoArea` -> gerente + responsable designado, filtrando contactos vigentes (RF-33: sin `vigenteHasta`, o con `vigenteHasta >= hoy`). 4 pruebas nuevas.
- `src/app/api/alquileres/actuaciones/[id]/comunicaciones/route.ts` (nueva): `POST` prepara un BORRADOR de AVISO/REITERACION con destinatarios armados desde AREAS/CONTACTOS_EPE (rechaza con 400 si no hay contactos vigentes para el área — no inventa un destinatario), o registra directamente una CARTA_DOCUMENTO (sin paso de borrador, RF-24) y cumple H-04 en el mismo request. `PATCH` es "marcar como enviado" (M16/T23): valida fecha no futura, pasa la comunicación a ENVIADO y cumple el hito asociado (H-01 o H-03) — reutiliza el mismo mecanismo de R13/R14 que RF-20.
- `src/lib/alquileres/servicios/cumplir-hito-servicio.ts` (nueva): se extrajo de `[id]/hitos/route.ts` la lógica de "cumplir un hito + recalcular R13/R14" para que la ruta de comunicaciones la reutilice sin duplicarla — `hitos/route.ts` quedó más corto y ahora también captura `ConflictoVersionError` (antes no lo hacía: un conflicto de versión ahí daba 500, corregido a 409 de paso).
- `src/app/api/alquileres/actuaciones/[id]/documentos/route.ts` (nueva, RF-28): adjunta un documento con `urlDocumento` validada (`validarUrlDocumento`, ya existía desde Fase 1 sin usuario todavía) — solo acepta `drive.google.com`/`docs.google.com`. El dashboard y la pantalla de alertas ahora reciben los documentos reales (antes recibían `documentos: []` a mano) — A6 (formalizada sin escaneado) funciona de verdad por primera vez.
- `src/app/api/alquileres/actuaciones/[id]/actos-admin/route.ts` (nueva, RF-29) + wiring en `[id]/route.ts`: se agregó `estadoActuacion` a los campos editables de la ruta de formalización, con una compuerta — un CONTRATO no puede pasar a FORMALIZADA editando el estado directamente (debe cumplir H-15), y un LEGITIMO_ABONO/ADENDA sí, pero corriendo R4' (`validarObligatoriosFormalizacion`) primero; para LEGITIMO_ABONO, R4' exige al menos un `ACTOS_ADMIN` cargado.
- `src/app/api/alquileres/areas/route.ts` y `.../contactos-epe/route.ts` (nuevas, RF-33 parcial): alta mínima, necesaria para que RF-22 tenga de dónde sacar los destinatarios — sin ellas, no había forma de probar RF-22 con datos reales (ni siquiera ficticios) en este entorno. Áreas usa `MATRIZ_ADMINISTRACION` (solo ADMINISTRADOR), Contactos EPE usa `MATRIZ_CONTACTOS_EPE` (= `MATRIZ_GESTION`) — ver `docs/DECISIONES.md` para la justificación de cada matriz.
- 3 matrices nuevas en `permisos.ts`: `MATRIZ_DOCUMENTOS`, `MATRIZ_COMUNICACIONES`, `MATRIZ_CONTACTOS_EPE` — todas transcriptas de la tabla de permisos de la sección 3 del PRD v1, no inventadas (ver DECISIONES.md).
- Se extrajo `ahoraIso()` (antes duplicada idéntica en `repositorio-mock.ts` y `repositorio-sheets.ts`) a `fechas.ts`, para que la ruta de comunicaciones (que necesita "ahora con hora" para `envioDeclaradoEn`) no la triplique.
- **Verificado en vivo** (`npm run dev`, sesión ADMINISTRADOR): creada un Área SUCURSAL + 2 contactos vigentes (JEFE_SUCURSAL/DESIGNADO) + un CONTRATO con esa área → `POST .../comunicaciones` con `tipoComunicacion: "AVISO"` arma el BORRADOR con exactamente esos dos mails como destinatarios → `PATCH` marcando como enviado cumple H-01 de verdad (estado pasa a AVISO_ENVIADO) → formalizado el contrato (R4') y adjuntado un documento ESCANEADO firmado de `drive.google.com` → el dashboard muestra "Formalizadas sin escaneado: 0" (antes de adjuntarlo daba 1, confirmado por la prueba automática correspondiente) → registrada una CARTA_DOCUMENTO (CD-9999) sobre la misma actuación, cumple H-04 en el mismo request, sin pasar por BORRADOR → creado un LEGITIMO_ABONO apuntando al contrato, rechazado al intentar FORMALIZADA sin acto administrativo, aceptado después de registrar uno. Sin errores en el log del servidor en ninguno de estos pasos.
- `npm test`: 377/377 OK (364 antes de esta tanda → 377, +13 pruebas nuevas: 4 de `armarDestinatarios`, 5 de `comunicaciones/route.test.ts`, 2 de `documentos/route.test.ts`, 3 de `[id]/route.test.ts` RF-29, menos 1 de ajuste en la cobertura automática de rutas al refactorizar `hitos/route.ts`). `npx tsc --noEmit`: limpio. `npm run lint`: limpio. `npm run build`: OK.

### 2026-10-02 — Calendario (RF-40) y pantalla de Alertas (cierre funcional de Fase 2)

- `reglas/calendario.ts` (`construirEventosCalendarioAlquileres`): agregación pura, mismo espíritu que `dashboard.ts` — arma una lista de eventos (`vencimiento` desde R15/C3, con su nivel de semáforo; `hito` desde cualquier `ActuacionHito` PENDIENTE con `fechaPrevista`) a partir de reglas ya probadas, sin inventar ninguna cuenta nueva. Se exportó `esTerminal` de `reglas/alertas.ts` (antes privada) para no duplicar ese criterio. 6 pruebas en `reglas/calendario.test.ts`.
- `src/components/domain/calendario-mes-alquileres.tsx`: vista mensual, visualmente igual a `calendario-mes.tsx` del CLM (misma grilla, mismos estilos), pero con el modelo de eventos propio de Alquileres. **Decisión** (ver `docs/DECISIONES.md`, 2026-10-02): no se reutilizó el componente del CLM directamente porque su tipo `EventoCalendario` está atado al modelo de `Contrato` (campos `tipoContrato`/`gerenciaResponsable`, link fijo a `/contratos/...`) — D2/D5 prohíben que Alquileres extienda ese modelo. Sí se reutilizan, por import directo y sin modificar el archivo, las funciones de matemática de grilla que no tocan el modelo de Contrato (`construirGrillaMes`, `aFechaISO`, `DIAS_SEMANA`, `MESES` de `src/lib/calendario.ts`) — esto es exactamente "el componente visual con un adaptador" que permite el PRD v2.1 (sección 4).
- `src/app/alquileres/calendario/page.tsx` + `alquileres-calendario-client.tsx`: página nueva, mismo patrón que el dashboard (Server Component calcula con datos reales, Client Component solo pinta).
- `src/app/alquileres/alertas/page.tsx` + `alquileres-alertas-client.tsx`: pantalla filtrable (botones por código de alerta + contador) sobre la `colaDeTrabajo` que ya calcula `calcularDashboard` — no se agregó ninguna cuenta nueva, es una vista más detallada de lo mismo que ya muestra el dashboard (como estaba previsto). Cubre A1/A4/A5/A6; A2/A3 (necesitan datos de Partes/Propuesta del locador, sin ABM todavía) y A7/A8 (Administración, con pantalla propia en Fase 3/4) quedan fuera, documentado en el propio código y en `docs/TRAZABILIDAD.md`.
- Menú (`navegacion.ts`/`sidebar.tsx`): se agregan los ítems "Calendario" y "Alertas" (reutilizando los íconos `CalendarDays`/`BellRing` que el sidebar ya importaba para el CLM) — el grupo "Alquileres" queda con sus 7 ítems de Fase 1-2 (faltan Reportes y Administración, Fase 3/4).
- **Verificado en vivo** (`npm run dev`): alta de inmueble + CONTRATO, formalización con `fecha_fin` 2028-12-31 (R5) → `/alquileres/calendario` muestra el evento de vencimiento (nivel verde, ~2 años) en la fecha correcta. Cumplida H-01 con fecha pasada (2026-01-05) → R13 calcula `fecha_prevista` pasada para H-02/H-21/H-03 → `/alquileres/alertas` muestra las 3 alertas A4 correspondientes, filtrables por botón, y `/alquileres/calendario` también muestra esos 3 hitos como eventos en sus fechas. Sidebar muestra los 7 ítems del menú de Alquileres. Sin errores en el log del servidor en ninguna de las dos pantallas.
- `npm test`: 358/358 OK (352 → 358: +6 de `reglas/calendario.test.ts`). `npx tsc --noEmit`: limpio. `npm run lint`: limpio. `npm run build`: OK (agrega `/alquileres/alertas` y `/alquileres/calendario`).

### 2026-10-02 — RF-12 (parcial: formalización guiada) + bug real encontrado y corregido (identidad de clase entre "layers")

- `src/app/api/alquileres/actuaciones/[id]/route.ts`: `GET` (ficha de detalle) + `PATCH` (edita los campos que pide R4' para poder formalizar: `fechaInicio`, `plazoMeses`, `fechaFin`, `canonInicial`, `montoTotalReconocido`, `condicionIvaCanon`, `destinoCategoria`, `destinoDescripcion`, `reglaActualizacion`, `firmanteEpeContactoId`, `observaciones`). No fuerza el paso a FORMALIZADA — eso sigue ocurriendo únicamente al cumplir H-15 (R14, ya existente en `[id]/hitos/route.ts`); esta ruta solo asegura que los datos estén disponibles para que R4' lo permita. R5 decide la `fecha_fin`: si se informan `fechaInicio`+`plazoMeses` sin `fechaFin`, la calcula; si se informa una `fechaFin` distinta de la calculada, exige `motivoCambioFecha` (si no, 400). `version` es obligatoria en el cuerpo (T20); un conflicto de versión responde 409 vía `ConflictoVersionError`.
- **Bug real encontrado por la prueba de esta ruta, no por revisión de código** (`route.test.ts`, caso T20): el primer `PATCH` exitoso + un segundo `PATCH` con la misma `version` vieja debía dar 409, pero el error se propagaba sin capturar (test rojo con el stack trace completo, no un simple "expected 409 got 500"). Causa: el caché de repositorios vive en `globalThis` (`repositorio/index.ts`, comentario ya existente ahí) justamente para que un Route Handler y un Server Component compartan los mismos datos aunque Turbopack les dé grafos de módulos ("layers") separados. Eso resuelve que los DATOS se vean iguales, pero no que las CLASES de error sean "la misma clase": si el repositorio cacheado fue instanciado por el módulo de otra layer, los errores que lanza son instancias de la clase `ConflictoVersionError` de ESA OTRA layer, y `err instanceof ConflictoVersionError` (comparando contra la clase de ESTA layer) da `false` aunque sea "el mismo" error en todo sentido observable — el `catch` entonces relanza el error en vez de devolver 409. Se reprodujo el efecto exacto en Vitest con `vi.resetModules()` entre `beforeEach` y las importaciones dinámicas del test (mismo mecanismo que las layers de Turbopack: dos instancias del mismo módulo fuente).
  - **Corrección en la raíz**, no solo en el test: `tipos-repositorio.ts` agrega `esConflictoVersionError(err): err is ConflictoVersionError`, un type guard por "duck typing" (compara `err.name === "ConflictoVersionError"` + la forma de sus campos, no la clase) — la forma estándar de identificar errores propios que puedan cruzar "realms"/grafos de módulos. `[id]/route.ts` lo usa en vez de `instanceof`. Es el único lugar de producción que hoy compara `ConflictoVersionError` por clase (se confirmó con `grep -rn "instanceof ConflictoVersionError" src/`, sin otros resultados) — si se agrega otro en el futuro, usar `esConflictoVersionError()` directamente.
- `route.test.ts` (5 pruebas): exige `version`, T2 (fecha_fin por defecto vía R5), R5 con `fechaFin` distinta sin motivo (rechaza) y con motivo (acepta), y T20 end-to-end (segundo `PATCH` con version vieja → 409, sin perder el cambio exitoso anterior — verificado leyendo de nuevo con `GET`).
- **Verificado en vivo** (`npm run dev`, login `dev-bypass` como `gestora.alquileres@ejemplo.test`/GESTOR): alta de inmueble + actuación CONTRATO → `PATCH` con `fechaInicio`/`plazoMeses`/`canonInicial`/`condicionIvaCanon` → `fechaFin` calculada correctamente (`2026-04-01` + 24 meses → `2028-03-31`) → reintento con la misma `version` → **409** real por HTTP (no solo en la prueba) → `GET` confirma que el cambio exitoso anterior no se perdió. Completando además `destinoCategoria`/`destinoDescripcion`/`firmanteEpeContactoId` y cumpliendo H-01/H-05/H-20/H-15 (en ese orden, solo para ejercitar la función — no es el orden real de uso) se vio R14 mover el estado PENDIENTE_AVISO → FORMALIZADA → CERRADA correctamente (H-20 cumplido manda, según el orden de prioridad documentado en `r14-estado-derivado.ts`: esto es la regla funcionando como está especificada, no un bug). El dashboard (`/alquileres`) reflejó de inmediato: 1 contrato vigente, canon neto $150.000, 1 "vence > 180 días", y la cola de trabajo con los 3 hitos todavía atrasados de esa misma actuación (H-02/H-21/H-03) — primera verificación end-to-end real de que el dashboard reacciona a datos con `fecha_fin`, pendiente desde el cierre de la tarea anterior.
- `npm test`: 352/352 OK (de 346 a 352: +5 de `route.test.ts`, +1 de la cobertura automática de guardia de sesión que ya detecta la ruta nueva sola, RF-42). `npx tsc --noEmit`: limpio. `npm run lint`: limpio. `npm run build`: OK (agrega `/api/alquileres/actuaciones/[id]`).

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

**Fase 0** (correctiva por naturaleza): su propia revisión adversarial fue encontrar los 7 hallazgos F0-1 a F0-7, ya corregidos y probados. Hallazgo adicional notado de paso, no corregido por estar fuera de su alcance: `src/lib/data/provider.ts` mantiene un `instancia` de provider en una variable module-level cacheada entre requests — en un entorno serverless/Turbopack esto puede dar instancias distintas por "layer" (ver el hallazgo de Fase 1 de abajo, que sí se corrigió, pero solo para Alquileres).

**Fase 1** (revisión formal al cierre, 2026-10-01):

- **Permisos** — revisado rol por rol contra las 4 matrices (`permisos.ts`): confirmado que cada ruta de API vuelve a chequear el permiso en el servidor (no solo oculta botones en el cliente) y que las páginas de Server Component que llaman al repositorio DIRECTO (sin pasar por la ruta de API) también chequean el permiso antes de leer — crítico para Personas, donde LECTOR no tiene ni "leer" (a diferencia de Inmuebles/Expedientes/Actuaciones, donde sí). Sin hallazgos de un rol viendo/editando algo que no debería, más allá de lo ya corregido.
- **Datos personales** — `enmascararSiLector` existe pero hoy es código "muerto" en la práctica: LECTOR nunca llega a ese punto en la ruta de Personas porque `MATRIZ_PERSONAS` ya lo bloquea antes con 403 (esto es correcto, no un bug: la función queda como segunda capa de defensa documentada, para si en el futuro se expone una vista agregada donde LECTOR sí tenga "leer"). Inmuebles/Expedientes/Actuaciones no contienen datos personales de locadores directamente (eso vive en PERSONAS/ACTUACION_PARTES) — sin hallazgos.
- **Condiciones de carrera en escrituras concurrentes** — el mecanismo de ID (secuencia) y el control de versión optimista (R1/T20) están probados contra concurrencia real (`Promise.all` de 20). Hallazgo real encontrado y **corregido**: `POST /api/alquileres/actuaciones` solo validaba R3' cuando el cliente mandaba `actuacion_anterior_id`, dejando pasar una ADENDA/LEGITIMO_ABONO sin ese campo obligatorio — commit `f0d4d06`. Hallazgo encontrado y **documentado, no corregido** (riesgo aceptado a la escala de GAJ, igual criterio que ya usa el PRD v2.1 para el control de versión): las validaciones de unicidad en altas (partida de inmueble, nro_expediente, DNI/CUIT de persona) hacen "leer para chequear, después crear" sin ningún lock — dos altas casi simultáneas con el mismo valor podrían pasar ambas la validación. Comentarios `// TODO` en los 3 archivos de ruta correspondientes.
- **Manejo de fechas** — no se usan fechas de calendario todavía en el ABM construido en Fase 1 (Actuaciones.fecha_inicio/fecha_fin se cargan al formalizar, RF-12, que es Fase 2/3); `fechas.ts` ya tiene su batería de pruebas (T2-T5, T22) desde que se escribió. Sin hallazgos nuevos.
- **Casos borde de reglas de negocio** — cubiertos extensamente por las 200+ pruebas de `reglas/*.test.ts` escritas con TDD antes del código. Sin hallazgos nuevos más allá del de R3' ya corregido arriba.
- **Pendiente menor, sin corregir:** el ítem "Personas" del menú de Alquileres se oculta para LECTOR por código (`filtro: (rol) => rol !== "LECTOR"`, trivial) pero no se verificó en vivo contra `npm run dev` — no hay todavía un usuario mock con rol LECTOR de Alquileres (solo ADMINISTRADOR y GESTOR). No es un riesgo de seguridad (la ruta de API ya bloquea a LECTOR independientemente de lo que muestre el menú) — es solo verificación de UI pendiente. Si se agrega un usuario mock LECTOR en una fase siguiente, conviene aprovechar y verificarlo en vivo.

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
- Commit `f3d21ba`.

### 2026-10-01 — Menú propio de Alquileres en el sidebar (RF-41) — cierra la lista de "próximas tareas" de Fase 1

- `src/lib/alquileres/navegacion.ts`: `NAV_GROUPS_ALQUILERES`, independiente de `NAV_GROUPS` del CLM (D5/D2 — ni siquiera la navegación se comparte entre módulos). Por ahora solo lista Inmuebles/Expedientes/Actuaciones/Personas (las 4 páginas que existen); Dashboard/Calendario/Alertas/Reportes/Administración se agregan ahí mismo a medida que se construyan en Fases 2-4, para no dejar enlaces rotos en el menú. El ítem "Personas" se oculta para LECTOR (`filtro: (rol) => rol !== "LECTOR"`), reflejando que `MATRIZ_PERSONAS` no le da a ese rol ni "leer".
- `src/components/layout/sidebar.tsx` (compartido CLM/Alquileres — tercer archivo de este tipo tocado en la fase, junto con `topbar.tsx` y el `AppShell` que los envuelve, sin cambiar este último): antes `NAV_GROUPS` del CLM se renderizaba siempre, sin ningún filtro por sesión (ni para el propio CLM — hallazgo anotado más abajo, en la revisión adversarial). Ahora el grupo del CLM se muestra solo si `session.user.rolId` está presente, y el grupo de Alquileres solo si `session.user.rolAlquileres` está presente — un usuario con un solo rol no ve el menú del otro módulo. Esto es cosmético (la barrera real sigue siendo `authorized()` en `src/auth.ts`, ya probada con T19): ahora además coincide visualmente.
- Refactor interno sin cambio de comportamiento: se extrajo `EnlaceNav` (antes el `<Link>` se repetía inline) para no duplicar el markup entre los dos grupos de menú.
- **Verificado en vivo** (`npm run dev`): login como `gestora.alquileres@ejemplo.test` (GESTOR) en `/alquileres/inmuebles` → el HTML servido por el servidor ya incluye el grupo "Alquileres" completo (Inmuebles/Expedientes/Actuaciones/Personas) y ningún ítem del CLM. Login como `m.cardozo@epe.com.ar` (rol solo CLM) en `/contratos` → el HTML incluye "Bandeja de tareas"/"Contratos" y ningún ítem de Alquileres. No se verificó en vivo el caso LECTOR ocultando "Personas" (no hay un usuario de prueba LECTOR en el mock todavía) — la lógica del filtro es trivial (`rol !== "LECTOR"`) y queda cubierta solo a nivel de tipo/lectura de código, anotado como pendiente menor en la revisión adversarial.
- `npm test`: 309/309 OK (sin pruebas nuevas — es un cambio de UI, verificado en vivo y por `tsc`/build, no con una prueba de componente). `npx tsc --noEmit`: limpio. `npm run lint`: limpio. `npm run build`: OK.

**Con esto se completan todas las "próximas tareas" que tenía anotadas Fase 1.** Antes de declarar la fase cerrada falta: revisión adversarial formal (sección 6.3 del encargo) y una pasada de `docs/TRAZABILIDAD.md` para confirmar que no quedó ningún requisito de Fase 1 sin su fila.

### 2026-10-01 — Revisión adversarial y cierre formal de Fase 1 (commits `f0d4d06`, `23d2954`)

- Revisión adversarial completa (permisos, datos personales, condiciones de carrera, fechas, casos borde) — ver el detalle en la sección "Hallazgos de la revisión adversarial" más abajo. Encontró y corrigió un bug real: `POST /api/alquileres/actuaciones` no validaba R3' cuando faltaba `actuacion_anterior_id`, dejando pasar una ADENDA/LEGITIMO_ABONO sin ese campo (que R3' exige). Prueba nueva de la ruta (`actuaciones/route.test.ts`) reproduce el caso. Documentó (sin corregir, riesgo aceptado a la escala de GAJ) 3 ventanas de carrera "leer para chequear unicidad, después crear" en las altas de inmuebles/expedientes/personas, con comentarios `// TODO` en el código.
- Cierre formal: `docs/PROGRESO.md` y `docs/TRAZABILIDAD.md` actualizados, Fase 1 marcada "Cerrada", Fase 2 abierta como tarea actual.
- `npm test`: 312/312 OK.

### 2026-10-01 — Fase 2: generación de hitos (RF-19) y cumplimiento de hitos (RF-20)

- `reglas/rf19-generar-hitos.ts`: genera las filas de `ACTUACION_HITOS` al crear un CONTRATO, con `fecha_prevista` según R13. Punto no explícito en el PRD, resuelto por lectura cuidadosa de R7': los hitos `ANTES_FIN_CONTRATO` (H-01, H-04) de una actuación nueva se cuentan desde el vencimiento efectivo de la actuación ANTERIOR en la cadena (la actuación que se crea todavía no tiene `fecha_fin` — eso se carga al formalizar, RF-12), saltando un LEGITIMO_ABONO intermedio si lo hay (`buscarContratoPredecesor`, T8). Si la actuación es la primera del inmueble (sin predecesor), esos hitos quedan sin `fecha_prevista` — R13 ya devuelve `undefined` en ese caso, no se inventa nada. Los hitos `DESPUES_HITO` (H-02/H-21/H-03) usan la `fecha_prevista` de H-01 recién calculada como referencia (todavía no cumplido). 8 pruebas, incluida la reproducción de T3/T4/T8 encadenados a través de esta función (no solo de R13/R15 por separado).
- `reglas/rf20-cumplir-hito.ts`: registra el cumplimiento de un hito (fecha hoy o anterior, nunca futura) y recalcula los hitos `DESPUES_HITO` que dependen de él usando la fecha REAL de cumplimiento (no la prevista) — salvo que el dependiente esté `reprogramada = TRUE` o ya `CUMPLIDO` (R13). 6 pruebas, incluida la reproducción exacta de T4 a través de un cumplimiento real.
- `src/lib/alquileres/datos/actuacion-hitos.ts`: wiring del repositorio genérico para `ACTUACION_HITOS`.
- Rutas: `POST /api/alquileres/actuaciones` ahora genera los hitos automáticamente tras crear un CONTRATO (config activa: `CFG_HITOS_TIPO_SEED`, estático por ahora — RF-34/Administración con catálogo editable en runtime queda para Fase 4; feriados: lista vacía, sin RF-36/pantalla de carga todavía — R13 ya contempla ese caso con "cómputo aproximado", documentado, no inventado). `GET/PATCH /api/alquileres/actuaciones/[id]/hitos` (nueva): lista hitos de una actuación y registra el cumplimiento de uno, recalculando además el estado derivado de la actuación (R14) cuando corresponde (salvo que esté en un estado manual — DESISTIDA/NO_RENOVADO/ANULADA).
- **Verificado en vivo de punta a punta** (`npm run dev`): se creó un inmueble y una actuación CONTRATO (primera del inmueble) → se generaron 8 hitos, los `ANTES_FIN_CONTRATO` sin `fecha_prevista` (sin predecesor, correcto) → se cumplió H-01 con fecha `2026-09-15` → el servidor recalculó H-02/H-21 a `2026-09-22` (5 días hábiles después) y H-03 a `2026-09-24` (7 días hábiles después), y la actuación pasó automáticamente de `PENDIENTE_AVISO` a `AVISO_ENVIADO` (R14) — todo en una sola llamada `PATCH`, sin intervención manual sobre el estado. Sin errores en el log del servidor.
- `npm test`: 327/327 OK. `npx tsc --noEmit`: limpio. `npm run lint`: limpio. `npm run build`: OK (agrega `/api/alquileres/actuaciones/[id]/hitos`).

### 2026-10-02 — RF-21: reprogramar un hito y marcar NO_APLICA

- `reglas/rf21-reprogramar-hito.ts`: `reprogramarHito` (exige motivo y nueva fecha prevista; marca `reprogramada = TRUE`, con lo que R13 deja de recalcularlo solo) y `marcarHitoNoAplica` (exige motivo). Ambas rechazan actuar sobre un hito ya `CUMPLIDO`. 7 pruebas.
- `src/app/api/alquileres/actuaciones/[id]/hitos/route.ts`: el `PATCH` ahora acepta `accion: "cumplir" | "reprogramar" | "no_aplica"` (default `"cumplir"`, compatible con lo que ya usaba RF-20). Reprogramar/NO_APLICA actualizan un solo hito con control de versión (T20); no disparan el recálculo de R14 (ninguna de las dos acciones marca un hito `CUMPLIDO`, que es lo único que R14 mira). 5 pruebas nuevas de la ruta (`route.test.ts`), incluidos los dos rechazos por falta de motivo.
- No se verificó esta tanda contra `npm run dev` en vivo (ya se había verificado el mecanismo de persistencia/versión con RF-19/RF-20 en la tanda anterior, y las pruebas de la ruta cubren el mismo camino de código) — si en una revisión posterior aparece algo raro específico de estas dos acciones, revisar primero en vivo antes de asumir que es un problema de las pruebas.
- `npm test`: 339/339 OK. `npx tsc --noEmit`: limpio. `npm run lint`: limpio. `npm run build`: OK.

### 2026-10-02 — Dashboard del módulo (RF-40/sección 8 del PRD v1)

- `reglas/dashboard.ts` (`calcularDashboard`): agregación pura sobre las reglas ya implementadas en Fase 1 (alertas A1/A4/A5/A6, C4 renovación en curso, R16 canon neto) — ninguna cuenta nueva, solo orquestación de lo que ya estaba probado. Devuelve el resumen de tarjetas y la cola de trabajo, ordenada por urgencia (A5, A1, A4, A6 — PRD v1 sección 8). 7 pruebas, incluida T7 (canon neto excluye los contratos sin dato de IVA) y el orden de la cola.
- `src/app/alquileres/page.tsx` (nueva, en la raíz del módulo) + `alquileres-dashboard-client.tsx`: tarjetas (`KpiCard`, reutilizado del CLM) y tabla de cola de trabajo. Agregado como primer ítem del menú de Alquileres ("Dashboard", `src/lib/alquileres/navegacion.ts` + ícono nuevo en `sidebar.tsx`).
- Nota de alcance explícita en el código y acá: varios indicadores (situación de vigencia, semáforo de vencimiento, canon) dependen de `fecha_fin`, que recién se carga al formalizar una actuación (RF-12, todavía no construido) — con los datos de Fase 1/2 (altas rápidas, RF-11) esos indicadores dan 0 correctamente, no es un bug. A6 (formalizada sin escaneado) siempre da 0 porque no hay ABM de Documentos todavía (Fase 3).
- **Verificado en vivo** (`npm run dev`): se creó un inmueble y una actuación CONTRATO, se abrió `/alquileres` → la página muestra las 8 tarjetas y la cola de trabajo (vacía con estos datos, correctamente — la actuación recién creada no tiene `fecha_fin` todavía, así que ninguna alerta que dependa de ella puede evaluarse). Sidebar muestra "Dashboard" como primer ítem. Sin errores en el log del servidor.
- `npm test`: 346/346 OK. `npx tsc --noEmit`: limpio. `npm run lint`: limpio. `npm run build`: OK (agrega `/alquileres`).

---

## 2026-10-03 — Planilla real de Alquileres configurada y verificada (fuera del desarrollo autónomo)

Primer paso de `docs/PENDIENTES-HUMANOS.md` resuelto por Carlos junto con el coordinador, ya cerrado el desarrollo autónomo de las 4 fases:

- Planilla nueva creada y compartida con la cuenta de servicio del CLM (`clm-gaj-sheets@epe-clm.iam.gserviceaccount.com`, D11).
- `npm run setup:sheet:alquileres` corrido contra Google real por primera vez: 34 hojas creadas (20 tablas + 14 secuencias) con los encabezados correctos — confirma T21 también en la práctica, no solo contra `FakeSheetsApi`.
- Verificación end-to-end real (login `dev-bypass`, `POST /api/alquileres/inmuebles`, lectura directa de la planilla por API): la fila llega a `INMUEBLES` y queda auditada en `LOG_CAMBIOS` (`ALTA`). Fila de prueba borrada después de verificar; secuencias (`SEQ_INM`/`SEQ_LOG`) intactas a propósito.
- Detalle completo en `docs/PENDIENTES-HUMANOS.md`, punto 4 (marcado RESUELTO).
- No se corrió `npm test`/`lint`/`build` para esta tarea porque no hubo cambio de código — solo configuración externa + verificación manual. El estado de la suite sigue siendo el del cierre de Fase 4 (`docs/INFORME-FINAL.md`).

---

## 2026-10-03 — RF-25/26/27: generación de borrador de contrato en .docx (server-side, sin Google)

Tarea fuera de las 4 fases ya cerradas, hecha a pedido de Carlos tras evaluar la prueba técnica (c). Decisión completa en `docs/DECISIONES.md`.

- Nueva dependencia `docx` (runtime) + `jszip` (solo dev, para los tests) — justificadas en DECISIONES.md, sin vulnerabilidades nuevas (`npm audit`: mismas 5 preexistentes de `eslint-config-next`, nada de `docx`/`jszip`).
- `src/lib/alquileres/servicios/generar-contrato-docx.ts`: arma el .docx completo a partir de `armarValoresPlantillaContrato` (ya existente) — un párrafo por cada una de las 10 etiquetas de `ETIQUETAS_PLANTILLA_SEED`, con las dos cláusulas legales marcadas "A COMPLETAR POR EL ÁREA LEGAL" cuando no están cargadas.
- `GET /api/alquileres/actuaciones/[id]/documentos/generar-contrato`: descarga el .docx, regenerado en cada pedido (no se persiste nada — ver decisión sobre `origen: GENERADO` en DECISIONES.md).
- Verificado de punta a punta contra el mock: `route.test.ts` crea un inmueble, un área, una actuación y dos personas/partes reales vía las rutas de API existentes, pide el borrador, lo desarma con `jszip` y confirma que los dos locadores y el nombre del área aparecen en el XML del documento.
- `npm test`: 448/448 OK (+8 sobre el cierre de Fase 4). `npx tsc --noEmit`: limpio (dos errores de tipos encontrados y corregidos en el camino: `Buffer` vs `BodyInit` de `NextResponse`, y un tipo de catálogo mal elegido en un fixture de test). `npm run lint`: limpio. `npm run build`: OK, ruta nueva registrada.
- Pendiente, no bloqueante: sin botón en ninguna pantalla todavía (se opera vía API, mismo criterio que comunicaciones/documentos/partes de Fase 3) — ver `docs/PENDIENTES-HUMANOS.md` punto 11.

---

## 2026-10-03 — Botón "Generar borrador (.docx)" en la pantalla de Actuaciones

A pedido de Carlos, se agregó el único punto de UI que faltaba para RF-25/26/27 (hasta ahora se operaba solo vía API).

- `src/app/alquileres/actuaciones/page.tsx` + `alquileres-actuaciones-client.tsx`: columna nueva, visible solo si el rol tiene acceso de lectura a `MATRIZ_DOCUMENTOS` (mismo criterio que el resto de la UI condicionada por permiso). El link apunta directo a `GET .../documentos/generar-contrato` — descarga nativa del navegador, sin JS de por medio.
- **Verificado en vivo contra la planilla REAL de Alquileres** (no el mock): se creó un inmueble, un área y una actuación CONTRATO reales vía la UI/API, el botón apareció en la fila correspondiente, la descarga devolvió un `.docx` válido (`file` lo identifica como "Microsoft Word 2007+", 9.893 bytes) con el nombre del área real y la marca "A COMPLETAR POR EL ÁREA LEGAL" en las dos cláusulas sin cargar.
- **Hallazgo en la limpieza de datos de prueba** (no del código, de mi propio script de limpieza): al crear la actuación CONTRATO se generaron automáticamente 8 `ACTUACION_HITOS` (RF-19, comportamiento correcto) — mi primer intento de borrar las filas de prueba de la planilla real no contempló esto ni el ancho completo de columnas de `AREAS`/`ACTUACIONES`, dejando filas a medio borrar. Corregido con un segundo paso que limpió todo (`INMUEBLES`, `AREAS`, `ACTUACIONES`, `ACTUACION_HITOS`, `LOG_CAMBIOS` — confirmado en 0 filas de datos en los cinco).
- `npm test`: 448/448 (sin pruebas nuevas — es un cambio de UI sobre lógica ya probada). `npm run lint` y `npm run build`: limpios.

---

## 2026-10-03 — Prueba técnica (a): login real con Google, ejecutada parcialmente

Carlos cargó un `.env.local` con `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` reales (las mismas credenciales OAuth que ya usa el CLM) en este worktree, ya terminado el desarrollo autónomo.

- **Login autorizado**: Carlos inició sesión real con `paganinicg@gmail.com` → entró normal. OK.
- **Rechazo por baja lógica (T16')**: se marcó `activo: false` para esa cuenta en `mock-catalogos.ts` (cambio temporal, revertido después — confirmado con `git diff` sin diferencias), reinicio del servidor, Carlos cerró sesión y reintentó con la misma cuenta de Google → "Acceso no autorizado", aunque Google confirmó la identidad igual. OK — RA-1/T16' funciona como se diseñó.
- Revertido el cambio, reiniciado el servidor, Carlos volvió a entrar sin problema. OK.
- **No probado**: el caso con una cuenta de Workspace, y el caso de una cuenta que nunca estuvo en la lista (en vez de una dada de baja) — no había una segunda cuenta de Google real disponible. El código ejecuta la misma rama en ambos casos (`puedeIniciarSesion` en `src/lib/acceso-modulo.ts`), así que la cobertura real es alta, pero queda anotado como pendiente en `docs/PENDIENTES-HUMANOS.md` punto 5 para cuando haya una segunda cuenta.
- Detalle completo en `docs/runbooks/prueba-a-login.md` (actualizado con el resultado real).
- Sin cambios de código permanentes — no hay commit de `src/`, solo de documentación.

---

## 2026-10-03 — 10 casos de ejemplo cargados en la planilla real de Alquileres

A pedido de Carlos, se cargaron 10 actuaciones de ejemplo (todas con datos ficticios, marcados explícitamente como tales en `observaciones`) cubriendo distintos estados y los 3 tipos de actuación, para tener un demo representativo en el despliegue:

| # | ID | Tipo | Estado | Qué muestra |
| --- | --- | --- | --- | --- |
| 1 | ACT-0002 | CONTRATO | PENDIENTE_AVISO | Recién creado, sin avanzar |
| 2 | ACT-0005 | CONTRATO | AVISO_ENVIADO | RF-22/23: aviso preparado con destinatarios reales de CONTACTOS_EPE, marcado enviado |
| 3 | ACT-0006 | CONTRATO | PENDIENTE_AVISO | H-05 cumplido pero sin `expediente_id` vinculado — ver hallazgo abajo |
| 4 | ACT-0007 | CONTRATO | EN_TRAMITE | Expediente vinculado desde la creación + H-05 cumplido |
| 5 | ACT-0008 | CONTRATO | FORMALIZADA | 3 locadores (RF-26), formalización completa |
| 6 | ACT-0009 | CONTRATO | CERRADA | Ciclo completo H-15 → H-20 |
| 7 | ACT-0010 | CONTRATO | FORMALIZADA | `fecha_fin` a ~16 días — alimenta alertas/calendario |
| 8 | ACT-0011 | ADENDA | FORMALIZADA | Prórroga del caso 5 (`actuacion_anterior_id`) |
| 9 | ACT-0012 | LEGITIMO_ABONO | FORMALIZADA | Con acto administrativo (RF-29) |
| 10 | ACT-0013 | LEGITIMO_ABONO | EN_TRAMITE | Intento de formalizar SIN acto administrativo, rechazado a propósito (R29) |

Base compartida: 2 Áreas (`AR-0002` Sucursal, `AR-0003` Gerencia), 3 Contactos EPE (`CON-0001/0002/0003`), 12 Personas ficticias (`PER-0001` a `PER-0013`, con CUIT de dígito verificador válido generado ad hoc), 10 Inmuebles (`INM-0003` a `INM-0012` — `INM-0012` queda sin actuación, como "disponible"), 1 Expediente (`EXP-0002`, vinculado al caso 4).

**Verificado:** `/alquileres` (dashboard) muestra 2 contratos vigentes (coincide con los casos 5 y 7, los únicos FORMALIZADA con `fecha_fin` futura) — confirmado leyendo el HTML real, no solo asumido.

### Dos hallazgos reales encontrados al cargar los datos (no bugs del código nuevo, del módulo ya existente)

1. **Cuota de escritura de la API de Sheets (60/min) es un límite real y cercano.** Una sola alta de actuación CONTRATO genera 8 hitos automáticos (RF-19), y cada alta (actuación, hito, persona, etc.) hace ~3 escrituras reales (secuencia + fila + `LOG_CAMBIOS`) — una sola alta de CONTRATO consume ~27 de las 60 escrituras/minuto disponibles. Un uso real con varias personas cargando datos en simultáneo podría pisar este límite (la prueba técnica (b), que medía exactamente esto con una carga mayor, fue descartada por Carlos el mismo día — ver `docs/DECISIONES.md` — este hallazgo la vuelve más relevante de lo que parecía en ese momento, pero no cambia la decisión ya tomada, solo la deja mejor fundamentada). **Dos intentos fallidos por este límite dejaron registros huérfanos** (una actuación con menos hitos de los que corresponde, visible solo si se lista con `soloActivos: false` — nunca en el uso normal de la app, que filtra por `activo`) — se identificaron y limpiaron con `batchClear` antes de cerrar esta tarea.
2. **`expediente_id` de una actuación solo se puede fijar al crearla (`POST /api/alquileres/actuaciones`), no editarla después** — la ruta de formalización guiada (`PATCH /api/alquileres/actuaciones/[id]`, RF-12 parcial) no incluye ese campo entre los editables. Esto es real: no hay forma hoy de vincular un expediente a una actuación que ya se creó sin expediente. El caso de ejemplo 3 quedó así a propósito, relabeled para mostrar el caso real en vez de forzarlo. Queda anotado para quien continúe RF-12 (no es parte de las 4 fases ya cerradas, es un gap menor dentro de lo ya construido).

Sin cambios de código en esta tarea — solo datos reales en la planilla de Alquileres y esta documentación.
