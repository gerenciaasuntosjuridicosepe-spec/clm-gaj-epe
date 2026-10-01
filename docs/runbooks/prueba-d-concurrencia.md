# Runbook — Prueba técnica (d): 20 IDs concurrentes + escritura multi-fila atómica

PRD v2.1, sección 3. **No ejecutada por el desarrollo autónomo contra Google real**: la lógica de generación de IDs y la escritura multi-fila sí están implementadas y probadas contra un doble/fake de la API de Sheets (ver `src/lib/alquileres/` — Fase 1 — y sus pruebas, incluida la reproducción de T1'/20 altas simultáneas con el fake). Esta prueba repite lo mismo contra la API real de Google, que no está disponible en este worktree.

## Qué confirma

- Que la hoja de secuencia por prefijo (`SEQ_ACT`, `SEQ_INM`, etc., PRD v2.1 sección 4: "el número del ID es la fila asignada por la propia API al agregar") no genera IDs repetidos cuando 20 procesos concurrentes piden un ID a la vez contra la API real (T1').
- Que una escritura multi-fila con `spreadsheets.batchUpdate` (por ejemplo, insertar un LEGITIMO_ABONO en la cadena, R3a) se aplica completa o no se aplica — nunca a medias — contra el comportamiento real de la API (no solo contra el fake).

## Prerrequisitos

1. Planilla real de Alquileres (ver `docs/PENDIENTES-HUMANOS.md`, punto 4).
2. El repositorio de Sheets de Alquileres implementado (`src/lib/alquileres/repositorio/` — Fase 1/2 de este desarrollo).
3. Un script que dispare 20 altas de actuación en paralelo (`Promise.all` de 20 llamadas al servicio de alta) contra la planilla real.

## Pasos

1. Vaciar (o usar una copia de prueba de) la hoja `SEQ_ACT`.
2. Lanzar las 20 altas concurrentes.
3. Verificar que los 20 `actuacion_id` resultantes (`ACT-####`) son todos distintos y consecutivos (sin huecos inesperados, sin repetidos).
4. Provocar a propósito un error a mitad de una escritura multi-fila (por ejemplo, cortando la conexión o usando una fila inválida en una de las filas del lote) y verificar que ninguna de las filas del lote quedó escrita a medias.

## Resultado esperado

0 IDs repetidos entre los 20; la escritura multi-fila es todo-o-nada también contra la API real, no solo contra el fake usado en las pruebas automáticas de este desarrollo.

## Quién puede correrlo

Un humano con acceso a la planilla real de Alquileres y a la cuenta de servicio.

## Qué ya quedó cubierto sin necesitar esto

La prueba automática `T1'` del código (contra el fake de Sheets) ya verifica el mecanismo de asignación de IDs con 20 solicitudes concurrentes simuladas — ver el archivo de pruebas correspondiente listado en `docs/TRAZABILIDAD.md`. Este runbook solo falta para la verificación contra la cuota/latencia/comportamiento real de la API de Google, que un fake no puede reproducir con fidelidad total (por ejemplo, el comportamiento exacto de `batchUpdate` ante errores parciales de red).
