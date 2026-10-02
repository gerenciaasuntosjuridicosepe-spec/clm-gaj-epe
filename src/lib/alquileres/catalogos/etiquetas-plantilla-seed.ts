/**
 * RF-25/26/27 — Catálogo de etiquetas de plantilla (hoja `ETIQUETAS_PLANTILLA`
 * del xlsx reconstruido, leída completa con un script Node puntual el
 * 2026-10-02 — mismo método que en Paso 0, sin instalar `xlsx` como
 * dependencia del repositorio, ver `docs/DECISIONES.md`).
 *
 * Solo 3 de las 10 etiquetas están "Constatado en el PRD" (texto literal
 * del PRD v1): `{{SECTOR_EPE}}` (RF-27, corrige hallazgo 14), `{{LOCADORES}}`
 * (RF-26, corrige hallazgo 13) y, parcialmente, `{{CONDICION_IVA}}` /
 * `{{REGLA_ACTUALIZACION}}` (RF-27). Las otras 7 están marcadas "PROPUESTA"
 * en la hoja — razonables (nombres de campo que ya existen 1:1 en el
 * modelo) pero no texto literal del PRD. Se usan igual (regla de la sección
 * 3 del encargo: lo INFERIDO se puede usar, registrando acá de dónde sale
 * cada una) — nunca hardcodeadas sueltas en la función de armado, siempre
 * contra esta única lista.
 */
export type EstadoEtiqueta = "CONSTATADO" | "PROPUESTA";

export interface EtiquetaPlantilla {
  etiqueta: string; // ej. "{{SECTOR_EPE}}"
  contenido: string;
  campoOrigen: string;
  estado: EstadoEtiqueta;
}

export const ETIQUETAS_PLANTILLA_SEED: EtiquetaPlantilla[] = [
  {
    etiqueta: "{{SECTOR_EPE}}",
    contenido: "Nombre del sector (no del representante)",
    campoOrigen: "ACTUACIONES.sector_interesado_area_id -> AREAS.nombre",
    estado: "CONSTATADO",
  },
  {
    etiqueta: "{{LOCADORES}}",
    contenido: "Bloque repetible: nombre, DNI o CUIT, domicilio y carácter de cada locador",
    campoOrigen: "ACTUACION_PARTES + PERSONAS",
    estado: "CONSTATADO",
  },
  {
    etiqueta: "{{INMUEBLE_DOMICILIO}}",
    contenido: "Domicilio del inmueble",
    campoOrigen: "INMUEBLES.domicilio",
    estado: "PROPUESTA",
  },
  { etiqueta: "{{FECHA_INICIO}}", contenido: "Fecha de inicio", campoOrigen: "ACTUACIONES.fecha_inicio", estado: "PROPUESTA" },
  { etiqueta: "{{PLAZO_MESES}}", contenido: "Plazo en meses", campoOrigen: "ACTUACIONES.plazo_meses", estado: "PROPUESTA" },
  { etiqueta: "{{FECHA_FIN}}", contenido: "Fecha de finalización", campoOrigen: "ACTUACIONES.fecha_fin", estado: "PROPUESTA" },
  { etiqueta: "{{CANON_INICIAL}}", contenido: "Canon mensual inicial", campoOrigen: "ACTUACIONES.canon_inicial", estado: "PROPUESTA" },
  {
    etiqueta: "{{CONDICION_IVA}}",
    contenido: "Redacción de la condición de IVA",
    campoOrigen: "ACTUACIONES.condicion_iva_canon",
    estado: "CONSTATADO",
  },
  {
    etiqueta: "{{REGLA_ACTUALIZACION}}",
    contenido: "Redacción de la regla de actualización",
    campoOrigen: "ACTUACIONES.regla_actualizacion",
    estado: "CONSTATADO",
  },
  { etiqueta: "{{FIRMANTE_EPE}}", contenido: "Firmante de EPE", campoOrigen: "CONTACTOS_EPE.nombre", estado: "PROPUESTA" },
];
