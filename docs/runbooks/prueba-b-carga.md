# Runbook — Prueba técnica (b): carga de 4.000 filas de hitos y cuota con 10 usuarios simultáneos

PRD v2.1, sección 3. **No ejecutada por el desarrollo autónomo**: requiere la planilla real de Alquileres (ver `docs/PENDIENTES-HUMANOS.md`, punto 4) y conexión a la API real de Google Sheets.

## Qué confirma

- Que leer/escribir ~4.000 filas de `ACTUACION_HITOS` con `batchGet`/escritura por lotes anda dentro de límites razonables de tiempo.
- Que la cuota de la API de Sheets (lecturas/escrituras por minuto por proyecto y por usuario — ver la documentación oficial vigente al momento de correr esta prueba, las cuotas cambian) alcanza para 10 usuarios concurrentes del tamaño esperado por el PRD (~200 gestiones, 15 usuarios).
- Si hace falta, confirma la necesidad de la caché corta (60 s) que ya prevé el PRD v2.1 sección 4.

## Prerrequisitos

1. Planilla de Alquileres real, aprovisionada con `npm run setup:sheet:alquileres` (ver Fase 1 de este desarrollo).
2. Script de carga masiva de datos de prueba **ficticios** (se deja preparado en `scripts/generar-datos-prueba-alquileres.mjs`, ver Fase 1 — genera ~200 inmuebles/expedientes/actuaciones y ~4.000 hitos, todos con nombres y documentos inventados, nunca reales).
3. 10 procesos o pestañas simulando 10 usuarios reales (puede ser un script con 10 llamadas concurrentes a un endpoint de lectura del módulo).

## Pasos

1. Cargar los datos de prueba con el script de carga masiva.
2. Medir el tiempo de un `batchGet` de las ~4.000 filas de `ACTUACION_HITOS` (y de las demás tablas relacionadas que arma el dashboard).
3. Lanzar 10 llamadas concurrentes al dashboard (o a la ruta de API equivalente) y medir latencia y errores de cuota (HTTP 429 de la API de Sheets).
4. Si aparecen 429, ajustar la vigencia de la caché en memoria (hoy fijada en 60 s, PRD v2.1 sección 4) o introducir reintentos con backoff.
5. Documentar el resultado medido (tiempos, si hubo 429, qué cambio hizo falta) en este mismo runbook o en un anexo.

## Resultado esperado

Dashboard y listados cargan dentro de los criterios de aceptación del PRD v1 (sección 8: menos de 3 s con caché, menos de 8 s sin ella) con el volumen de datos esperado, sin errores de cuota sostenidos.

## Quién puede correrlo

Un humano con acceso a la planilla real de Alquileres y a la cuenta de servicio (Google Cloud).
