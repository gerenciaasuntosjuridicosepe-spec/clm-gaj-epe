# Runbook — Prueba técnica (c): generación de contrato con tres locadores desde plantilla de Google Docs

PRD v2.1, sección 3. **No ejecutada por el desarrollo autónomo**: requiere una carpeta de Drive compartida con la cuenta de servicio y una plantilla de Google Docs real, que no existen en este worktree.

## Qué confirma

- Que la cuenta de servicio (la misma del CLM, D11) puede copiar una plantilla de Google Docs, reemplazar las etiquetas (`{{SECTOR_EPE}}`, `{{LOCADORES}}` como bloque repetible, etc. — ver `docs/Estructura_Datos_Gestion_Alquileres_RECONSTRUIDA.xlsx`, hoja `ETIQUETAS_PLANTILLA`) y guardar el resultado en Drive.
- Un contrato con **tres locadores** se renderiza con los tres (corrige el hallazgo 13 del PRD v1: AutoCrat solo mapeaba el Locador 1).
- Dónde queda la propiedad de los archivos generados (de la cuenta de servicio, no de un agente humano) y si eso es un problema para compartirlos después.

## Prerrequisitos

1. Alcances de Google habilitados para la cuenta de servicio: Docs API y Drive API (además de Sheets, que ya tiene).
2. Una plantilla de Google Docs real con las etiquetas de `ETIQUETAS_PLANTILLA` (contrato), compartida con el email de la cuenta de servicio como Editor.
3. Una carpeta de Drive (`carpeta_drive_documentos`, parámetro de `PARAMETROS`) compartida con la cuenta de servicio como Editor.
4. El servicio de generación de documentos implementado (`src/lib/alquileres/servicios/generar-documento.ts` — ver Fase 3 de este desarrollo; en este punto del trabajo puede no estar implementado todavía, revisar `docs/PROGRESO.md`).
5. Datos de un contrato de prueba **ficticio** con tres locadores (personas inventadas, nunca reales).

## Pasos

1. Confirmar que la plantilla es accesible para la cuenta de servicio (RF-35: "valida que el documento exista y sea accesible").
2. Generar el contrato de prueba desde la app (o, si la UI todavía no llegó a esa pantalla, invocando directamente el servicio de generación).
3. Abrir el documento resultante en Drive y verificar: los tres locadores aparecen con nombre, DNI o CUIT, domicilio y carácter (bloque repetible `{{LOCADORES}}`); `{{SECTOR_EPE}}` muestra el nombre del sector, no el de un representante (corrige el hallazgo 14).
4. Verificar quién figura como propietario del archivo en Drive (probablemente la cuenta de servicio) y si la carpeta de salida quedó con los permisos esperados (NF-S2: no se comparte con los agentes por Drive, solo con los administradores — RF-30 es ahora "posterior", administrado manualmente).

## Resultado esperado

Un documento de Google Docs generado automáticamente, con los tres locadores y el sector correctos, en la carpeta esperada, sin intervención manual de reemplazo de etiquetas.

## Quién puede correrlo

Un humano con acceso a Google Cloud Console (para habilitar los alcances de Docs/Drive) y a una cuenta de Drive para crear la plantilla y la carpeta.
