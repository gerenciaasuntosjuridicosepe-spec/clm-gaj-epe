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

| ID | Qué exige | Archivo de implementación | Archivo de prueba | Estado |
| --- | --- | --- | --- | --- |
| D2 | Modelo de datos de Alquileres independiente del CLM | `src/lib/alquileres/tipos.ts` | (tipado estático — `npx tsc --noEmit`; usado y ejercitado por todas las pruebas de `reglas/`) | Hecho |
| M1'-M18 (esquema) | Columnas de cada tabla, fuente única | `src/lib/alquileres/esquema.ts` | `scripts/setup-sheet-alquileres.test.ts` (T21) | Hecho |
| R20 (catálogos) | Valores de catálogo, editables salvo sistema | `src/lib/alquileres/catalogos/catalogos-seed.ts`, `reglas/r20-catalogos-editables.ts` | `reglas/r20-catalogos-editables.test.ts` | Hecho |
| M14/PARAMETROS | Parámetros de configuración con valores por defecto del PRD | `src/lib/alquileres/catalogos/parametros-seed.ts` | (usado por `fechas.test.ts`/`alertas.test.ts` vía los umbrales) | Hecho |
| HITOS_SEMILLA/CFG_HITOS_TIPO | Hitos H-01 a H-05/H-15/H-20/H-21 con sus plazos | `src/lib/alquileres/catalogos/hitos-seed.ts` | `reglas/r13-fecha-prevista.test.ts` (usa la semilla real) | Hecho (H-06 a H-14/H-16 a H-19: ver PENDIENTES-HUMANOS.md punto 1) |
| T2 | fecha_fin por defecto (R5) | `reglas/r5-fecha-fin.ts` | `reglas/r5-fecha-fin.test.ts` | Hecho |
| T3, T4, T5 | Cálculo de fecha prevista con días hábiles/feriados (R13) | `fechas.ts`, `reglas/r13-fecha-prevista.ts` | `fechas.test.ts`, `reglas/r13-fecha-prevista.test.ts` | Hecho |
| T6 | Vencimiento efectivo con adendas (R15) | `reglas/r15-vencimiento-efectivo.ts` | `reglas/r15-vencimiento-efectivo.test.ts` | Hecho |
| T7 | Canon neto de IVA (R16) | `reglas/r16-canon-neto.ts` | `reglas/r16-canon-neto.test.ts` | Hecho |
| T8 | Insertar legítimo abono en la cadena (R3a) | `reglas/r3-cadena-actuaciones.ts` | `reglas/r3-cadena-actuaciones.test.ts` | Hecho |
| T9, T10 | Alertas A1/A5/C4 con NO_RENOVADO y sin sucesora | `reglas/alertas.ts`, `reglas/campos-calculados.ts` | `reglas/alertas.test.ts`, `reglas/campos-calculados.test.ts` | Hecho |
| T11 | Formatos de nro_expediente | `reglas/validaciones.ts` | `reglas/validaciones.test.ts` | Hecho |
| T12 | CUIT/CUIL módulo 11 | `reglas/validaciones.ts` | `reglas/validaciones.test.ts` | Hecho |
| T13 / NF-S4 | Protección contra inyección de fórmulas | `reglas/validaciones.ts` (`neutralizarFormula`), usado por `esquema.ts` (`objetoAFila`) | `reglas/validaciones.test.ts` | Hecho |
| T16 | Cuenta con `activo = false` no inicia sesión aunque tenga rol | `src/lib/acceso-modulo.ts` (`puedeIniciarSesion`) | `src/lib/acceso-modulo.test.ts` | Hecho |
| T17 | Cambio de tipo de actuación (R17) | `reglas/r17-cambio-tipo.ts` | `reglas/r17-cambio-tipo.test.ts` | Hecho |
| T19 | Acceso cruzado de módulo rechazado en ambas direcciones | `src/lib/acceso-modulo.ts` (`tieneAccesoARuta`), `src/auth.ts` (callback `authorized`), `src/app/sin-acceso/page.tsx` | `src/lib/acceso-modulo.test.ts` | Hecho (lógica pura probada; falta exhibir en un recorrido manual con `npm run dev`, ver Fase 1 pendiente) |
| T21 | Coherencia script de aprovisionamiento ↔ esquema | `scripts/setup-sheet-alquileres.mjs` | `scripts/setup-sheet-alquileres.test.ts` | Hecho |
| T22 | Zona horaria a las 22:00 (fechas del módulo) | `src/lib/alquileres/fechas.ts` | `src/lib/alquileres/fechas.test.ts` | Hecho |
| T23 | Marcar como enviado exige fecha no futura | `reglas/comunicaciones.ts` | `reglas/comunicaciones.test.ts` | Hecho |
| T25 | Alerta A8 por respaldo atrasado | `reglas/alertas.ts` | `reglas/alertas.test.ts` | Hecho |
| T28 | Diferencia monto_total_reconocido vs. meses × mensual | `reglas/legitimo-abono.ts` | `reglas/legitimo-abono.test.ts` | Hecho |
| D12 | Hoja Usuarios ampliada (`rol_alquileres`, `activo`), sin romper filas existentes | `src/lib/data/mock-catalogos.ts`, `src/lib/data/sheets-schema.ts` | `src/lib/data/sheets-schema.test.ts` (regresión de filas viejas) | Hecho |
| D3 | Rol por módulo independiente del rol del CLM | `src/auth.ts`, `src/lib/acceso-modulo.ts` | `src/lib/acceso-modulo.test.ts` | Hecho |
| R1 | IDs por secuencia atómica, nunca reutilizados | `src/lib/alquileres/repositorio/repositorio-sheets.ts`, `repositorio-mock.ts` | `repositorio-sheets.test.ts`, `repositorio-mock.test.ts` | Hecho |
| T1' | 20 altas simultáneas → IDs distintos y consecutivos | `repositorio-sheets.ts`, `repositorio-mock.ts` | `repositorio-sheets.test.ts`, `repositorio-mock.test.ts` (contra el fake y contra el mock) | Hecho |
| T18 | Petición anónima a `/api/alquileres/**` → 401 | `src/lib/alquileres/auth-guard.ts`, `src/app/api/alquileres/inmuebles/route.ts` | `src/app/api/rutas-guardia-sesion.test.ts` (genérica — cubre automáticamente cualquier ruta nueva bajo `app/api/alquileres/**`) | Hecho para la ruta que existe (Inmuebles); se extiende sola a cada ruta nueva |
| T20 | Control de versión optimista detecta conflicto | `repositorio-sheets.ts` (`actualizar`, `actualizarMultiple`), `repositorio-mock.ts` | `repositorio-sheets.test.ts`, `repositorio-mock.test.ts` | Hecho |
| T26 | Aislamiento total entre planilla del CLM y de Alquileres | `src/lib/alquileres/repositorio/*.ts` (nunca importan de `src/lib/data/*`) | `src/lib/alquileres/repositorio/aislamiento.test.ts` | Hecho |
| T27 | Escritura de Usuarios desde Alquileres solo puede tocar `rol_alquileres`/`activo` | `src/lib/alquileres/usuarios-alquileres.ts` | `usuarios-alquileres.test.ts` | Hecho |
| R6, R10, R11, R12 | (reglas del libro original v0.1, texto no disponible) | — | — | No se inventan — ver `docs/PENDIENTES-HUMANOS.md` punto 1 |
| RF-05 | Alta, edición y baja lógica de inmuebles (edición/baja: pendientes) | `src/app/api/alquileres/inmuebles/route.ts`, `src/app/alquileres/inmuebles/page.tsx` | Verificado en vivo contra `npm run dev` (ver `docs/PROGRESO.md`); falta una prueba automática de las validaciones de la ruta (partida duplicada, formato) | Alta hecha y verificada en vivo; prueba automática de la ruta todavía pendiente |
| RF-07/RF-08 | Alta de expedientes (dos formatos de numeración) y vínculo a un inmueble existente (edición/baja: pendientes) | `src/app/api/alquileres/expedientes/route.ts`, `src/app/alquileres/expedientes/page.tsx` | Verificado en vivo (ver `docs/PROGRESO.md`); validaciones de formato ya probadas en `reglas/validaciones.test.ts` (T11), falta una prueba de la ruta en sí | Alta hecha y verificada en vivo; prueba automática de la ruta pendiente |
| RF-09 / R9 | Alta de personas con búsqueda previa por CUIT/CUIL o DNI; LECTOR sin acceso (dato personal) | `src/app/api/alquileres/personas/route.ts`, `src/app/alquileres/personas/page.tsx`, `reglas/r9-persona-duplicada.ts` | `reglas/r9-persona-duplicada.test.ts` (la regla); verificado en vivo que LECTOR no puede entrar a la página (chequeo antes de leer el repositorio) | Alta y R9 hechos; falta una prueba automática de la ruta/página para el bloqueo de LECTOR |
| RF-11 | Alta rápida de una actuación (tipo, inmueble, sector, estado) | `src/app/api/alquileres/actuaciones/route.ts`, `src/app/alquileres/actuaciones/page.tsx` | Verificado en vivo; R3' probado en `reglas/r3-cadena-actuaciones.test.ts` (la regla) y en `src/app/api/alquileres/actuaciones/route.test.ts` (la ruta — agregada tras un hallazgo de la revisión adversarial: antes la ruta no validaba R3' si faltaba `actuacion_anterior_id`, corregido en `f0d4d06`) | Alta rápida hecha; RF-12 (formalización guiada, con R4' y generación de hitos vía R13) queda para Fase 2/3 |
| RF-41 | Ítem de menú "Alquileres" filtrado por rol | `src/lib/alquileres/navegacion.ts`, `src/components/layout/sidebar.tsx` | Verificado en vivo contra `npm run dev` (ver `docs/PROGRESO.md`): GESTOR ve los ítems y ningún ítem del CLM, rol-solo-CLM ve lo inverso | Hecho para Dashboard/Inmuebles/Expedientes/Actuaciones/Personas/Calendario/Alertas (las páginas que existen); Reportes/Administración se agregan en Fases 3-4. Caso LECTOR (oculta "Personas") no verificado en vivo, solo por lectura de código — sin usuario mock LECTOR todavía |
| RF-42 | Cobertura de guardia en `app/api/alquileres/**` | `src/lib/test-utils/recorrer-rutas-api.ts` (genérica) | `src/app/api/rutas-guardia-sesion.test.ts` — pasó de 14 a 15 casos al agregar la ruta de Inmuebles, sin tocar la prueba | Hecho, y se extiende sola a cada ruta nueva |

## Fase 2 — hitos, alertas y dashboard

| ID | Qué exige | Archivo de implementación | Archivo de prueba | Estado |
| --- | --- | --- | --- | --- |
| RF-19 | Generación automática de hitos al crear un CONTRATO | `reglas/rf19-generar-hitos.ts`, `src/app/api/alquileres/actuaciones/route.ts` | `reglas/rf19-generar-hitos.test.ts`; verificado en vivo (ver `docs/PROGRESO.md`) | Hecho (feriados: lista vacía, sin RF-36 todavía; config: `CFG_HITOS_TIPO_SEED` estático, sin RF-34 todavía — ambos documentados, no inventados) |
| RF-20 | Registrar el cumplimiento de un hito (fecha no futura, recalcula R13/R14) | `reglas/rf20-cumplir-hito.ts`, `src/app/api/alquileres/actuaciones/[id]/hitos/route.ts` | `reglas/rf20-cumplir-hito.test.ts` (incluye T4 a través de un cumplimiento real); verificado en vivo | Hecho |
| RF-21 | Reprogramar un hito / marcar NO_APLICA | `reglas/rf21-reprogramar-hito.ts`, `src/app/api/alquileres/actuaciones/[id]/hitos/route.ts` | `reglas/rf21-reprogramar-hito.test.ts`, `.../hitos/route.test.ts` | Hecho (verificado por pruebas de la ruta, no en vivo contra `npm run dev` — ver `docs/PROGRESO.md`) |
| RF-40 | Calendario propio del módulo: vencimientos efectivos (R15) e hitos previstos, con semáforo (C3) | `reglas/calendario.ts`, `src/app/alquileres/calendario/page.tsx`, `src/components/domain/calendario-mes-alquileres.tsx` | `reglas/calendario.test.ts` (6 pruebas); verificado en vivo (ver `docs/PROGRESO.md`) | Hecho — ver DECISIONES.md (2026-10-02) sobre por qué se construyó un componente propio en vez de reutilizar `calendario-mes.tsx` del CLM directamente (reutiliza solo la matemática de grilla, no el tipo de evento) |
| Alertas (menú RF-41, PRD v1 sección 6) | Pantalla propia y filtrable de A1/A4/A5/A6 | `src/app/alquileres/alertas/page.tsx`, `src/components/pages/alquileres-alertas-client.tsx` | Sin prueba propia — reutiliza `calcularDashboard` ya probado en `reglas/dashboard.test.ts`; verificado en vivo (ver `docs/PROGRESO.md`) | Hecho para A1/A4/A5/A6; A2/A3 necesitan datos de Partes/Propuesta del locador (sin ABM todavía), A7/A8 son de Administración — no incluidas |
| Dashboard (sección 8 PRD v1) | Tarjetas, cola de trabajo | `reglas/dashboard.ts`, `src/app/alquileres/page.tsx`, `src/components/pages/alquileres-dashboard-client.tsx` | `reglas/dashboard.test.ts` (7 pruebas, incluida T7); verificado en vivo con datos formalizados (ver `docs/PROGRESO.md`, entrada RF-12) | Hecho (gráficos de la sección 8 del PRD v1 no incluidos — no hay requisito explícito de gráfico puntual, solo "indicadores"; se deja para si una revisión posterior lo pide) |
| RF-12 (parcial) | Formalización guiada: carga de los campos que exige R4' (fecha_inicio, plazo, fecha_fin con R5, canon, IVA, destino, firmante), con control de versión (T20) | `src/app/api/alquileres/actuaciones/[id]/route.ts` | `.../[id]/route.test.ts` (5 pruebas); verificado en vivo de punta a punta (alta → formalización → 409 por versión vieja → cumplimiento de hitos → R14) | Parcial — falta la pantalla de edición (hoy solo la API) y el camino equivalente para LEGITIMO_ABONO |

## Fase 3 — comunicaciones y documentos

| ID | Qué exige | Archivo de implementación | Archivo de prueba | Estado |
| --- | --- | --- | --- | --- |
| RF-22/RF-23 [CAMBIO v2.1] | Preparar un borrador de AVISO con destinatarios armados desde CONTACTOS_EPE vigentes del área (sector SUCURSAL -> jefe+designado, resto -> gerente+responsable); "Marcar como enviado" cumple H-01 recién ahí (M16) | `reglas/comunicaciones.ts` (`armarDestinatarios`), `src/app/api/alquileres/actuaciones/[id]/comunicaciones/route.ts` (POST/PATCH), `src/lib/alquileres/servicios/cumplir-hito-servicio.ts` | `reglas/comunicaciones.test.ts` (4 pruebas nuevas); `.../comunicaciones/route.test.ts` (5 pruebas); verificado en vivo de punta a punta (ver `docs/PROGRESO.md`) | Hecho (sin UI de edición del borrador todavía, solo API — el flujo "copiar/abrir en Gmail" de RF-23 es de la pantalla, pendiente) |
| RF-24 [CAMBIO v2.1] | Reiteración (H-03) igual que AVISO; carta documento (H-04) se registra directo con el número, sin pasar por BORRADOR/ENVIADO | mismos archivos que RF-22/23 | mismas pruebas (casos CARTA_DOCUMENTO) | Hecho |
| RF-28 | Adjuntar enlace de documento (ej. escaneado firmado, que apaga A6) — solo `drive.google.com`/`docs.google.com` | `src/app/api/alquileres/actuaciones/[id]/documentos/route.ts`, `reglas/validaciones.ts` (`validarUrlDocumento`, ya existía) | `.../documentos/route.test.ts` (2 pruebas); verificado en vivo — A6 pasa de 1 a 0 al adjuntar el escaneado firmado | Hecho |
| RF-29 | Registrar actos administrativos; un LEGITIMO_ABONO no pasa a FORMALIZADA sin al menos uno (R4') | `src/app/api/alquileres/actuaciones/[id]/actos-admin/route.ts`, `src/app/api/alquileres/actuaciones/[id]/route.ts` (gate de `estadoActuacion: "FORMALIZADA"` para ADENDA/LEGITIMO_ABONO) | `.../[id]/route.test.ts` (3 pruebas nuevas); verificado en vivo (rechaza sin acto, acepta con acto) | Hecho |
| RF-33 (parcial) | Áreas y Contactos EPE — alta mínima para destrabar RF-22 | `src/app/api/alquileres/areas/route.ts`, `src/app/api/alquileres/contactos-epe/route.ts` | Sin prueba propia dedicada (ejercitadas indirectamente por `comunicaciones/route.test.ts`); verificado en vivo | Parcial — sin edición, ni el "cerrar vigencia del anterior" automático de RF-33 |
| RF-25/26/27 | Generar contrato/adenda desde plantilla de Google Docs (reemplazo de etiquetas, RF-26 bloque repetible de locadores, RF-27 SECTOR_EPE) | `reglas/datos-plantilla.ts` (`reemplazarEtiquetas`, `armarBloqueLocadores`, `armarValoresPlantillaContrato`), `catalogos/etiquetas-plantilla-seed.ts` | `reglas/datos-plantilla.test.ts` (6 pruebas) | **Parcial** — la lógica pura (arma los 10 valores de `ETIQUETAS_PLANTILLA`, probada, sin inventar la redacción legal de IVA/actualización — ver `docs/PENDIENTES-HUMANOS.md` punto 10) está hecha; la llamada real a la API de Google Docs/Drive (RF-25) requiere Google real, fuera de los límites duros de este desarrollo — ver `docs/PENDIENTES-HUMANOS.md` punto 11 |

Nota sobre el hallazgo de esta fase: durante la tarea se encontró y corrigió `[id]/hitos/route.ts` no capturaba `ConflictoVersionError` (daba 500 en vez de 409) — corregido reutilizando `esConflictoVersionError()` (ver `docs/DECISIONES.md`, 2026-10-02, "identidad de clase entre layers"). También se extrajo `cumplirHitoYRecalcularEstado` a un servicio compartido (`servicios/cumplir-hito-servicio.ts`) para que la ruta de hitos y la de comunicaciones no dupliquen la lógica de R13/R14.

## Fase 4 — reportes y operación

(Pendiente.)
