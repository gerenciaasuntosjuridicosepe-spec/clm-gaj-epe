# Pendientes que solo puede resolver un humano

Cada ítem: qué falta, por qué no lo puede hacer el desarrollo autónomo, y el paso exacto (incluidos comandos) para cuando un humano tenga lo que falta. Se va completando a medida que aparecen a lo largo del desarrollo — no es una lista cerrada desde el principio.

---

## 1. Datos "a completar con el original" del xlsx reconstruido

La hoja `LEEME` del xlsx reconstruido dice explícitamente: *"'a completar con el original' = existió en el libro v0.1 y no consta en los PRD"*. El encargo prohíbe inventarlos. Quedan como catálogo/configuración editable (no hardcodeados), vacíos o con un placeholder claramente marcado, hasta que Carlos aporte el libro `Estructura_Datos_Gestion_Alquileres.xlsx` v0.1 original:

| Ítem | Dónde vive en el código | Acción humana |
| --- | --- | --- |
| Hitos H-06 a H-14 y H-16 a H-19 (su nombre, plazo, unidad, cómputo y referencia) | `src/lib/alquileres/catalogos/hitos-seed.ts` (seed de `CFG_HITOS_TIPO`) | Aportar el libro original o, en su defecto, decir qué hitos son esos 9 y sus plazos. Mientras tanto solo existen H-01, H-02, H-21, H-03, H-04, H-05, H-15, H-20 (los que sí constan en los PRD). |
| Valores del catálogo `destino_categoria` | `src/lib/alquileres/catalogos/catalogos-seed.ts` | Aportar la lista real de categorías de destino usadas en el Excel original. Hoy el catálogo existe vacío (editable desde Administración, no hardcodeado) con una entrada `(a completar)` para que no rompa los formularios. |
| Valores completos de `tipo_area` (más allá de SUCURSAL y GERENCIA, que sí constan) | ídem | Aportar la lista completa de tipos de área de EPE. |
| Reglas R6, R10, R11, R12 (existen en el libro original v0.1, R1-R12, pero su texto no consta en ningún PRD) | `src/lib/alquileres/reglas/*` (hueco documentado con comentario `// TODO R6/R10-R12`) | Aportar el texto de esas 4 reglas del libro original. |
| Valores completos de `caracter` (carácter de la parte en `ACTUACION_PARTES`) | catálogo editable, vacío | Aportar los valores reales usados (ej. "apoderado", "cónyuge", etc.) |
| Lista completa de `tipo_documento` más allá de CONTRATO_GENERADO/ESCANEADO/PROPUESTA_LOCADOR | catálogo editable | Aportar la lista completa. |
| Lista completa de `cargo` (CONTACTOS_EPE) más allá de JEFE_SUCURSAL/DESIGNADO/GERENTE/RESPONSABLE_DESIGNADO | catálogo editable | Aportar la lista completa. |
| Plazo de H-05 (inicio de expediente) y H-15/H-20 — existen (RP-11 los menciona) pero su `plazo_valor`/`plazo_unidad`/`referencia` no constan | `hitos-seed.ts` | Aportar el dato o confirmar que esos 3 hitos no llevan plazo (solo se cumplen a mano, sin alerta por atraso — ya se los marcó `genera_alerta = No` siguiendo lo que sí consta). |
| Las 18 preguntas abiertas originales (solo 5 constan reconstruidas en `PREGUNTAS_ABIERTAS`) | — | Aportar la hoja `PREGUNTAS_ABIERTAS` del libro v0.1 si hay algo relevante en las 13 restantes. |

**Nada de esto bloquea el desarrollo**: todo queda modelado como catálogo editable desde Administración (mismo patrón que `catalogos-provider.ts` del CLM), nunca como lógica que asuma un valor específico.

## 2. Casos UAT EJEMPLO_CARGA (D.7770 Arroyo Seco y D.7761 Alvarez)

La hoja `EJEMPLO_CARGA` del xlsx reconstruido dice literalmente: *"(a completar con el original: no constan en los PRD)"* y *"Son los dos casos de aceptación (UAT) del PRD v1. Sin sus datos concretos no pueden reproducirse: Carlos debe aportarlos."*

**Acción humana:** aportar los datos concretos de ambos expedientes (inmueble, locadores, fechas, canon, hitos reales) para poder cargarlos como datos de prueba y correr la UAT de la sección 9 del PRD v1. Mientras tanto, el desarrollo usa datos ficticios inventados (nunca reales) para probar los mismos flujos (renovación con hitos; tres locadores con hueco de cobertura), dejando claro en el seed de datos mock que son ficticios y no los casos reales.

## 3. Dictamen interno de GAJ sobre datos personales (D10, precondición dura de la Fase 5)

El PRD v2.1 fija una compuerta explícita: *"Antes de la Fase 5 (datos reales), GAJ emite un dictamen interno sobre base legal del tratamiento, transferencia internacional, confidencialidad, seguridad e inscripción de la base ante la AAIP, si correspondiera."* Esto es una decisión legal/institucional que no le corresponde tomar a un desarrollo de software.

**Acción humana:** Carlos (GAJ) debe redactar y aprobar ese dictamen antes de que se cargue cualquier dato real de locadores (DNI, CUIT, domicilio, mail, teléfono). El desarrollo autónomo **no avanza a la Fase 5** (carga de datos reales) de todos modos — se detiene en el cierre de Fase 4 según indica el encargo.

## 4. Planilla real de Google Sheets para Alquileres + cuenta de servicio

Para que el módulo deje de correr en modo mock hace falta, tal como describe el PRD v2.1 sección 4 y D11:

1. Crear una planilla de Google Sheets nueva, separada de la del CLM (D1).
2. Usar la **misma** cuenta de servicio que ya usa el CLM (D11: una sola, compartida) — su JSON de credenciales ya existe en el checkout principal (`C:\proyectos\clm-gaj-epe`), fuera del alcance de este worktree. Compartir la planilla nueva con el email de esa cuenta de servicio como Editor.
3. Copiar el ID de la planilla nueva.
4. Cargar en `.env.local` (del checkout que se vaya a usar para probar contra Google real — **no en este worktree**, por instrucción explícita de no crear `.env.local` acá):
   ```
   GOOGLE_SHEETS_ALQUILERES_ID=<ID de la planilla nueva>
   ```
   (las otras tres variables — `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — siguen siendo las del CLM, ya documentadas en `INSTRUCTIVO_CONFIGURACION.md`).
5. Correr el script de aprovisionamiento (**ya preparado y probado contra un doble/fake, nunca contra Google real, por este desarrollo**):
   ```
   npm run setup:sheet:alquileres
   ```
   Este script importa el esquema desde `src/lib/alquileres/esquema.ts` (fuente única, ver T21) — no duplica columnas a mano, así que no puede desincronizarse del código como pasó con `setup-sheet.mjs` del CLM (hallazgo F0-2).
6. Verificar manualmente que `npm run dev` (con `.env.local` cargado) lee/escribe en la planilla real: entrar al módulo de Alquileres, crear un inmueble de prueba ficticio y confirmar que aparece una fila nueva en la hoja `INMUEBLES` de la planilla.

## 5. Pruebas técnicas a-d de la Fase 0 (sección 3 del PRD v2.1) contra Google real

El encargo pide explícitamente que estas 4 pruebas se preparen como runbook pero **no se ejecuten** (requieren credenciales reales que no existen en este worktree):

| Prueba | Qué hace falta | Runbook preparado en |
| --- | --- | --- |
| a) Login con cuenta @gmail.com personal y una de Workspace, ambas en la lista blanca | Dos cuentas de Google reales de prueba + `.env.local` con `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` | `docs/runbooks/prueba-a-login.md` |
| b) Lectura/escritura de 4.000 filas simuladas de hitos con `batchGet`/batch, medir cuota con 10 usuarios simultáneos | Planilla real + cuenta de servicio | `docs/runbooks/prueba-b-carga.md` |
| c) Generación de un contrato con tres locadores desde plantilla de Google Docs (APIs Docs/Drive) | Carpeta de Drive compartida con la cuenta de servicio + plantilla de Google Docs real | `docs/runbooks/prueba-c-plantilla.md` |
| d) Generación simultánea de 20 IDs desde procesos concurrentes + escritura multi-fila con `batchUpdate` | Planilla real | `docs/runbooks/prueba-d-concurrencia.md` |

(Los runbooks se crean durante la Fase 0 — ver PROGRESO.md para su estado real; si todavía no existen cuando se lee este documento, es que el desarrollo no llegó a esa tarea.)

## 6. Términos del plan de Vercel (punto abierto remanente #2 del PRD v2.1)

El PRD deja anotado: *"El plan Hobby está pensado, según entiendo, para uso personal y no comercial; no lo verifiqué."*

**Acción humana:** Carlos debe revisar los Términos de Servicio de Vercel vigentes y decidir si el uso de EPE (organismo público, no personal) encaja en el plan Hobby o si corresponde pasar a un plan Pro antes de depender de ese despliegue para producción.

## 7. Verificar la planilla real del CLM existente (F0-2)

El hallazgo F0-2 dice que el instructivo del CLM no lista las hojas `Anotaciones` ni `Garantias` entre lo que crea `setup-sheet.mjs`, y que había un desfase de columnas (`link_texto_final`, `link_pdf`). Se corrigió el código para que el script **importe** el esquema de `sheets-schema.ts` (fuente única — ninguna de esas dos columnas fantasma existe ya ni en el código ni en el script).

**Acción humana que igual queda pendiente:** solo un humano con acceso a la planilla real del CLM (en `C:\proyectos\clm-gaj-epe`, fuera del alcance de este worktree) puede confirmar que las hojas reales ya tienen (o no) esas columnas fantasma cargadas a mano, y correr `npm run setup:sheet` corregido contra ella si hace falta agregar `Anotaciones`/`Garantias` que falten. Este desarrollo no tiene ni debe tener credenciales para tocar esa planilla.

## 8. Segunda persona con acceso documentado a cuentas (D9, mitigación recomendada no obligatoria)

El PRD acepta como riesgo que Google Cloud, Vercel, el repositorio y las planillas estén bajo cuentas personales de Carlos. La mitigación (una segunda persona con acceso documentado) es una decisión organizacional, no técnica.

**Acción humana:** Carlos decide quién es esa segunda persona y documenta el procedimiento de traspaso/acceso compartido.

## 9. Feriados reales (punto abierto remanente #4 del PRD v2.1)

El cómputo de días hábiles necesita la tabla `FERIADOS` cargada con los feriados nacionales y provinciales de Santa Fe de cada año en uso. El desarrollo deja el mecanismo listo (R13, con el aviso de "cómputo aproximado" cuando faltan) pero no inventa fechas de feriados reales.

**Acción humana:** el ADMINISTRADOR del módulo carga los feriados de cada año (RF-36, con importación desde CSV) a comienzos de año, como ya prevé el propio PRD.

---

## 10. Redacción legal de la condición de IVA y la regla de actualización, para los contratos generados (RF-27)

RF-27 pide que la plantilla de contrato muestre la "redacción" (el texto legal real, ej. "el canon se encuentra gravado con el Impuesto al Valor Agregado...") de la condición de IVA y de la regla de actualización — no el código interno (`MAS_IVA`/`SIN_IVA`, o el texto libre que se cargó en `regla_actualizacion`). Ningún PRD ni el xlsx reconstruido trae ese texto legal exacto, y es contenido contractual/legal — exactamente el tipo de cosa que el encargo pide no inventar (sección 3: "anything irreversible/security/personal-data/money-related... also goes to PENDIENTES-HUMANOS.md").

`src/lib/alquileres/reglas/datos-plantilla.ts` (`armarValoresPlantillaContrato`) deja pasar el valor crudo guardado como placeholder explícito para las etiquetas `{{CONDICION_IVA}}`/`{{REGLA_ACTUALIZACION}}`, sin redactarlo.

**Acción humana:** GAJ aporta la redacción exacta a usar para cada valor de `condicion_iva_canon` (hoy `MAS_IVA`/`SIN_IVA`) y el criterio de redacción para `regla_actualizacion` (texto libre) — una vez aportada, se carga como una función de mapeo código→texto en el mismo archivo (o, mejor, como un catálogo editable más, si la redacción puede variar).

## 11. Generación real de documentos desde Google Docs (RF-25) — requiere Google real

RF-25 (generar un contrato/adenda real desde una plantilla de Google Docs, guardarlo en Drive y crear el `DOCUMENTO` con origen GENERADO) necesita la API de Google Docs/Drive con la cuenta de servicio — prohibido en este desarrollo ("nunca hablar con Google real"). Se construyó y probó la parte que SÍ es posible sin Google: `reglas/datos-plantilla.ts` (`armarValoresPlantillaContrato`, `armarBloqueLocadores`, `reemplazarEtiquetas`) arma correctamente los 10 valores de `catalogos/etiquetas-plantilla-seed.ts` a partir del modelo de datos de Alquileres, con pruebas automáticas.

**Acción humana (igual criterio que las pruebas técnicas a-d, ver punto 5):** cuando haya credenciales reales, construir un `GeneradorDocumentos` (mismo patrón que `TransporteSheetsHttp` para Sheets: una interfaz + implementación real + una implementación falsa para seguir probando sin Google) cuyo método reciba `plantilla.googleDocId` + los valores ya armados por `armarValoresPlantillaContrato`, haga la copia + reemplazo con la API de Docs, y guarde el resultado en `carpeta_drive_documentos`. La ruta de API que lo invoque (`POST .../documentos/generar`, todavía no creada) puede reusar toda la lógica pura ya hecha sin cambios.

---

*(Este archivo se sigue completando a medida que avanza el desarrollo — ver docs/PROGRESO.md para el estado de cada fase.)*
