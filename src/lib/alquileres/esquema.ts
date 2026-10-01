/**
 * Esquema de la planilla de Google Sheets de Alquileres — nombres de hoja,
 * columnas y conversión fila↔objeto para TODAS las tablas de `tipos.ts` que
 * persisten en la planilla (incluidas CATALOGOS/PARAMETROS/HITOS/
 * CFG_HITOS_TIPO: son semillas de arranque pero editables en runtime, no
 * solo datos de ejemplo).
 *
 * Análogo a `src/lib/data/sheets-schema.ts` del CLM: este archivo es la
 * ÚNICA fuente de verdad sobre cómo se traduce `tipos.ts` a filas de Sheets.
 * `scripts/setup-sheet-alquileres.mjs` importa `SHEET_NAMES`/`ESQUEMA_TABLAS`
 * de acá en vez de duplicar columnas a mano (mismo patrón que corrigió F0-2
 * en el CLM) — ver `scripts/setup-sheet-alquileres.test.ts` (T21).
 *
 * El orden de columnas de cada tabla es el orden de los campos en la
 * interfaz correspondiente de `tipos.ts` (fuente única de ese orden),
 * seguido —salvo LOG_CAMBIOS/FERIADOS/ERRORES— de las columnas de
 * auditoría comunes (`activo, creado_en, creado_por, modificado_en,
 * modificado_por, version`).
 */
import type {
  Actuacion,
  ActuacionHito,
  ActuacionParte,
  ActoAdmin,
  Area,
  CamposAuditoria,
  CatalogoValor,
  CfgHitoTipo,
  Comunicacion,
  ContactoEpe,
  DocumentoAlquiler,
  ErrorRegistrado,
  Expediente,
  Feriado,
  Hito,
  Inmueble,
  Localidad,
  LogCambio,
  Parametro,
  Persona,
  Plantilla,
  PrefijoId,
} from "./tipos";

// ---------------------------------------------------------------------------
// Nombres de hoja — coinciden con los encabezados de sección de tipos.ts
// (que a su vez reproducen los nombres de tabla del xlsx reconstruido).
// ---------------------------------------------------------------------------

export const SHEET_NAMES = {
  inmuebles: "INMUEBLES",
  expedientes: "EXPEDIENTES",
  personas: "PERSONAS",
  actuaciones: "ACTUACIONES",
  actuacionPartes: "ACTUACION_PARTES",
  hitos: "HITOS",
  cfgHitosTipo: "CFG_HITOS_TIPO",
  actuacionHitos: "ACTUACION_HITOS",
  actosAdmin: "ACTOS_ADMIN",
  comunicaciones: "COMUNICACIONES",
  documentos: "DOCUMENTOS",
  areas: "AREAS",
  contactosEpe: "CONTACTOS_EPE",
  plantillas: "PLANTILLAS",
  localidades: "LOCALIDADES",
  catalogos: "CATALOGOS",
  parametros: "PARAMETROS",
  logCambios: "LOG_CAMBIOS",
  feriados: "FERIADOS",
  errores: "ERRORES",
} as const;

export type NombreTabla = keyof typeof SHEET_NAMES;

// ---------------------------------------------------------------------------
// Definición de columna y helpers de conversión fila↔objeto
// ---------------------------------------------------------------------------

export type TipoColumna = "string" | "number" | "boolean";

export interface ColumnaDef<T> {
  key: keyof T & string;
  header: string;
  tipo: TipoColumna;
}

/** Las seis columnas de auditoría comunes (M15), en el orden canónico. Reusadas por toda tabla que extiende `CamposAuditoria`. */
export function columnasAuditoria<T extends CamposAuditoria>(): ColumnaDef<T>[] {
  return [
    { key: "activo", header: "activo", tipo: "boolean" },
    { key: "creadoEn", header: "creado_en", tipo: "string" },
    { key: "creadoPor", header: "creado_por", tipo: "string" },
    { key: "modificadoEn", header: "modificado_en", tipo: "string" },
    { key: "modificadoPor", header: "modificado_por", tipo: "string" },
    { key: "version", header: "version", tipo: "number" },
  ] as ColumnaDef<T>[];
}

/** Convierte una fila cruda de Sheets (array de celdas en texto) a un objeto, según las columnas dadas. */
export function filaAObjeto<T>(columnas: ColumnaDef<T>[], fila: (string | undefined)[]): T {
  const obj: Record<string, unknown> = {};
  columnas.forEach((col, idx) => {
    const crudo = fila[idx];
    if (crudo === undefined || crudo === "") {
      obj[col.key] = undefined;
      return;
    }
    if (col.tipo === "number") obj[col.key] = Number(crudo);
    else if (col.tipo === "boolean") obj[col.key] = crudo === "TRUE" || crudo === "true";
    else obj[col.key] = crudo;
  });
  return obj as T;
}

/**
 * Convierte un objeto a una fila para escribir en Sheets, en el mismo orden
 * que `columnas`. Neutraliza inyección de fórmulas (T13/NF-S4) en todo valor
 * de texto — este es el punto donde el repositorio serializa una fila antes
 * de escribirla, tal como exige el encargo (no se reimplementa
 * `neutralizarFormula`, se importa de `reglas/validaciones.ts`).
 */
export function objetoAFila<T>(columnas: ColumnaDef<T>[], obj: T, neutralizar: (v: string) => string): (string | number | boolean)[] {
  const registro = obj as unknown as Record<string, unknown>;
  return columnas.map((col) => {
    const v = registro[col.key];
    if (v === undefined || v === null) return "";
    if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
    if (typeof v === "number") return v;
    return neutralizar(String(v));
  });
}

// ---------------------------------------------------------------------------
// INMUEBLES
// ---------------------------------------------------------------------------

export const INMUEBLES_COLUMNS: ColumnaDef<Inmueble>[] = [
  { key: "inmuebleId", header: "inmueble_id", tipo: "string" },
  { key: "domicilio", header: "domicilio", tipo: "string" },
  { key: "localidadId", header: "localidad_id", tipo: "string" },
  { key: "partidaInmobiliaria", header: "partida_inmobiliaria", tipo: "string" },
  { key: "observaciones", header: "observaciones", tipo: "string" },
  ...columnasAuditoria<Inmueble>(),
];

// ---------------------------------------------------------------------------
// EXPEDIENTES
// ---------------------------------------------------------------------------

export const EXPEDIENTES_COLUMNS: ColumnaDef<Expediente>[] = [
  { key: "expedienteId", header: "expediente_id", tipo: "string" },
  { key: "inmuebleId", header: "inmueble_id", tipo: "string" },
  { key: "nroExpediente", header: "nro_expediente", tipo: "string" },
  { key: "fechaApertura", header: "fecha_apertura", tipo: "string" },
  { key: "observaciones", header: "observaciones", tipo: "string" },
  ...columnasAuditoria<Expediente>(),
];

// ---------------------------------------------------------------------------
// PERSONAS
// ---------------------------------------------------------------------------

export const PERSONAS_COLUMNS: ColumnaDef<Persona>[] = [
  { key: "personaId", header: "persona_id", tipo: "string" },
  { key: "tipoPersona", header: "tipo_persona", tipo: "string" },
  { key: "apellidoNombreRazonSocial", header: "apellido_nombre_razon_social", tipo: "string" },
  { key: "dni", header: "dni", tipo: "string" },
  { key: "cuitCuil", header: "cuit_cuil", tipo: "string" },
  { key: "condicionFiscal", header: "condicion_fiscal", tipo: "string" },
  { key: "domicilioLegal", header: "domicilio_legal", tipo: "string" },
  { key: "mail", header: "mail", tipo: "string" },
  { key: "telefono", header: "telefono", tipo: "string" },
  ...columnasAuditoria<Persona>(),
];

// ---------------------------------------------------------------------------
// ACTUACIONES
// ---------------------------------------------------------------------------

export const ACTUACIONES_COLUMNS: ColumnaDef<Actuacion>[] = [
  { key: "actuacionId", header: "actuacion_id", tipo: "string" },
  { key: "codigoLegado", header: "codigo_legado", tipo: "string" },
  { key: "tipoActuacion", header: "tipo_actuacion", tipo: "string" },
  { key: "inmuebleId", header: "inmueble_id", tipo: "string" },
  { key: "expedienteId", header: "expediente_id", tipo: "string" },
  { key: "actuacionAnteriorId", header: "actuacion_anterior_id", tipo: "string" },
  { key: "estadoActuacion", header: "estado_actuacion", tipo: "string" },
  { key: "motivoEstado", header: "motivo_estado", tipo: "string" },
  { key: "responsableEmail", header: "responsable_email", tipo: "string" },
  { key: "sectorInteresadoAreaId", header: "sector_interesado_area_id", tipo: "string" },
  { key: "destinoCategoria", header: "destino_categoria", tipo: "string" },
  { key: "destinoDescripcion", header: "destino_descripcion", tipo: "string" },
  { key: "fechaInicio", header: "fecha_inicio", tipo: "string" },
  { key: "plazoMeses", header: "plazo_meses", tipo: "number" },
  { key: "fechaFin", header: "fecha_fin", tipo: "string" },
  { key: "canonInicial", header: "canon_inicial", tipo: "number" },
  { key: "montoTotalReconocido", header: "monto_total_reconocido", tipo: "number" },
  { key: "condicionIvaCanon", header: "condicion_iva_canon", tipo: "string" },
  { key: "reglaActualizacion", header: "regla_actualizacion", tipo: "string" },
  { key: "firmanteEpeContactoId", header: "firmante_epe_contacto_id", tipo: "string" },
  { key: "observaciones", header: "observaciones", tipo: "string" },
  ...columnasAuditoria<Actuacion>(),
];

// ---------------------------------------------------------------------------
// ACTUACION_PARTES
// ---------------------------------------------------------------------------

export const ACTUACION_PARTES_COLUMNS: ColumnaDef<ActuacionParte>[] = [
  { key: "parteId", header: "parte_id", tipo: "string" },
  { key: "actuacionId", header: "actuacion_id", tipo: "string" },
  { key: "personaId", header: "persona_id", tipo: "string" },
  { key: "rolParte", header: "rol_parte", tipo: "string" },
  { key: "orden", header: "orden", tipo: "number" },
  { key: "representaAPersonaId", header: "representa_a_persona_id", tipo: "string" },
  { key: "caracter", header: "caracter", tipo: "string" },
  { key: "domicilioVigente", header: "domicilio_vigente", tipo: "string" },
  { key: "mailVigente", header: "mail_vigente", tipo: "string" },
  ...columnasAuditoria<ActuacionParte>(),
];

// ---------------------------------------------------------------------------
// HITOS (catálogo maestro)
// ---------------------------------------------------------------------------

export const HITOS_COLUMNS: ColumnaDef<Hito>[] = [
  { key: "hitoId", header: "hito_id", tipo: "string" },
  { key: "codigo", header: "codigo", tipo: "string" },
  { key: "nombre", header: "nombre", tipo: "string" },
  { key: "etapa", header: "etapa", tipo: "string" },
  { key: "orden", header: "orden", tipo: "number" },
  ...columnasAuditoria<Hito>(),
];

// ---------------------------------------------------------------------------
// CFG_HITOS_TIPO
// ---------------------------------------------------------------------------

export const CFG_HITOS_TIPO_COLUMNS: ColumnaDef<CfgHitoTipo>[] = [
  { key: "cfgId", header: "cfg_id", tipo: "string" },
  { key: "tipoActuacion", header: "tipo_actuacion", tipo: "string" },
  { key: "hitoId", header: "hito_id", tipo: "string" },
  { key: "plazoValor", header: "plazo_valor", tipo: "number" },
  { key: "plazoUnidad", header: "plazo_unidad", tipo: "string" },
  { key: "computoDias", header: "computo_dias", tipo: "string" },
  { key: "referencia", header: "referencia", tipo: "string" },
  { key: "hitoReferenciaId", header: "hito_referencia_id", tipo: "string" },
  { key: "generaAlerta", header: "genera_alerta", tipo: "boolean" },
  { key: "orden", header: "orden", tipo: "number" },
  ...columnasAuditoria<CfgHitoTipo>(),
];

// ---------------------------------------------------------------------------
// ACTUACION_HITOS
// ---------------------------------------------------------------------------

export const ACTUACION_HITOS_COLUMNS: ColumnaDef<ActuacionHito>[] = [
  { key: "actuacionHitoId", header: "actuacion_hito_id", tipo: "string" },
  { key: "actuacionId", header: "actuacion_id", tipo: "string" },
  { key: "hitoId", header: "hito_id", tipo: "string" },
  { key: "estadoHito", header: "estado_hito", tipo: "string" },
  { key: "fechaPrevista", header: "fecha_prevista", tipo: "string" },
  { key: "fechaCumplimiento", header: "fecha_cumplimiento", tipo: "string" },
  { key: "reprogramada", header: "reprogramada", tipo: "boolean" },
  { key: "referencia", header: "referencia", tipo: "string" },
  { key: "observaciones", header: "observaciones", tipo: "string" },
  ...columnasAuditoria<ActuacionHito>(),
];

// ---------------------------------------------------------------------------
// ACTOS_ADMIN
// ---------------------------------------------------------------------------

export const ACTOS_ADMIN_COLUMNS: ColumnaDef<ActoAdmin>[] = [
  { key: "actoId", header: "acto_id", tipo: "string" },
  { key: "actuacionId", header: "actuacion_id", tipo: "string" },
  { key: "tipoActo", header: "tipo_acto", tipo: "string" },
  { key: "numeroActo", header: "numero_acto", tipo: "string" },
  { key: "fechaActo", header: "fecha_acto", tipo: "string" },
  { key: "organoEmisor", header: "organo_emisor", tipo: "string" },
  { key: "documentoId", header: "documento_id", tipo: "string" },
  ...columnasAuditoria<ActoAdmin>(),
];

// ---------------------------------------------------------------------------
// COMUNICACIONES
// ---------------------------------------------------------------------------

export const COMUNICACIONES_COLUMNS: ColumnaDef<Comunicacion>[] = [
  { key: "comunicacionId", header: "comunicacion_id", tipo: "string" },
  { key: "actuacionId", header: "actuacion_id", tipo: "string" },
  { key: "hitoId", header: "hito_id", tipo: "string" },
  { key: "tipoComunicacion", header: "tipo_comunicacion", tipo: "string" },
  { key: "asunto", header: "asunto", tipo: "string" },
  { key: "destinatarios", header: "destinatarios", tipo: "string" },
  { key: "cuerpo", header: "cuerpo", tipo: "string" },
  { key: "estadoComunicacion", header: "estado_comunicacion", tipo: "string" },
  { key: "fechaEnvio", header: "fecha_envio", tipo: "string" },
  { key: "idMensajeGmail", header: "id_mensaje_gmail", tipo: "string" },
  { key: "envioDeclaradoPor", header: "envio_declarado_por", tipo: "string" },
  { key: "envioDeclaradoEn", header: "envio_declarado_en", tipo: "string" },
  { key: "plantillaId", header: "plantilla_id", tipo: "string" },
  { key: "observaciones", header: "observaciones", tipo: "string" },
  ...columnasAuditoria<Comunicacion>(),
];

// ---------------------------------------------------------------------------
// DOCUMENTOS
// ---------------------------------------------------------------------------

export const DOCUMENTOS_COLUMNS: ColumnaDef<DocumentoAlquiler>[] = [
  { key: "documentoId", header: "documento_id", tipo: "string" },
  { key: "actuacionId", header: "actuacion_id", tipo: "string" },
  { key: "tipoDocumento", header: "tipo_documento", tipo: "string" },
  { key: "origen", header: "origen", tipo: "string" },
  { key: "urlDocumento", header: "url_documento", tipo: "string" },
  { key: "firmado", header: "firmado", tipo: "boolean" },
  { key: "plantillaId", header: "plantilla_id", tipo: "string" },
  { key: "fechaDocumento", header: "fecha_documento", tipo: "string" },
  { key: "observaciones", header: "observaciones", tipo: "string" },
  ...columnasAuditoria<DocumentoAlquiler>(),
];

// ---------------------------------------------------------------------------
// AREAS
// ---------------------------------------------------------------------------

export const AREAS_COLUMNS: ColumnaDef<Area>[] = [
  { key: "areaId", header: "area_id", tipo: "string" },
  { key: "nombre", header: "nombre", tipo: "string" },
  { key: "tipoArea", header: "tipo_area", tipo: "string" },
  { key: "areaPadreId", header: "area_padre_id", tipo: "string" },
  ...columnasAuditoria<Area>(),
];

// ---------------------------------------------------------------------------
// CONTACTOS_EPE
// ---------------------------------------------------------------------------

export const CONTACTOS_EPE_COLUMNS: ColumnaDef<ContactoEpe>[] = [
  { key: "contactoId", header: "contacto_id", tipo: "string" },
  { key: "areaId", header: "area_id", tipo: "string" },
  { key: "nombre", header: "nombre", tipo: "string" },
  { key: "cargo", header: "cargo", tipo: "string" },
  { key: "mail", header: "mail", tipo: "string" },
  { key: "telefono", header: "telefono", tipo: "string" },
  { key: "vigenteDesde", header: "vigente_desde", tipo: "string" },
  { key: "vigenteHasta", header: "vigente_hasta", tipo: "string" },
  ...columnasAuditoria<ContactoEpe>(),
];

// ---------------------------------------------------------------------------
// PLANTILLAS
// ---------------------------------------------------------------------------

export const PLANTILLAS_COLUMNS: ColumnaDef<Plantilla>[] = [
  { key: "plantillaId", header: "plantilla_id", tipo: "string" },
  { key: "tipoPlantilla", header: "tipo_plantilla", tipo: "string" },
  { key: "nombre", header: "nombre", tipo: "string" },
  { key: "googleDocId", header: "google_doc_id", tipo: "string" },
  { key: "asuntoMail", header: "asunto_mail", tipo: "string" },
  ...columnasAuditoria<Plantilla>(),
];

// ---------------------------------------------------------------------------
// LOCALIDADES
// ---------------------------------------------------------------------------

export const LOCALIDADES_COLUMNS: ColumnaDef<Localidad>[] = [
  { key: "localidadId", header: "localidad_id", tipo: "string" },
  { key: "nombre", header: "nombre", tipo: "string" },
  { key: "departamento", header: "departamento", tipo: "string" },
  { key: "provincia", header: "provincia", tipo: "string" },
  ...columnasAuditoria<Localidad>(),
];

// ---------------------------------------------------------------------------
// CATALOGOS
// ---------------------------------------------------------------------------

export const CATALOGOS_COLUMNS: ColumnaDef<CatalogoValor>[] = [
  { key: "catalogo", header: "catalogo", tipo: "string" },
  { key: "codigo", header: "codigo", tipo: "string" },
  { key: "descripcion", header: "descripcion", tipo: "string" },
  { key: "orden", header: "orden", tipo: "number" },
  { key: "esSistema", header: "es_sistema", tipo: "boolean" },
  ...columnasAuditoria<CatalogoValor>(),
];

// ---------------------------------------------------------------------------
// PARAMETROS
// ---------------------------------------------------------------------------

export const PARAMETROS_COLUMNS: ColumnaDef<Parametro>[] = [
  { key: "clave", header: "clave", tipo: "string" },
  { key: "valor", header: "valor", tipo: "string" },
  { key: "descripcion", header: "descripcion", tipo: "string" },
  ...columnasAuditoria<Parametro>(),
];

// ---------------------------------------------------------------------------
// LOG_CAMBIOS (sin columnas de auditoría — RF-38, solo alta)
// ---------------------------------------------------------------------------

export const LOG_CAMBIOS_COLUMNS: ColumnaDef<LogCambio>[] = [
  { key: "logId", header: "log_id", tipo: "string" },
  { key: "fechaHora", header: "fecha_hora", tipo: "string" },
  { key: "usuarioEmail", header: "usuario_email", tipo: "string" },
  { key: "accion", header: "accion", tipo: "string" },
  { key: "hoja", header: "hoja", tipo: "string" },
  { key: "registroId", header: "registro_id", tipo: "string" },
  { key: "campo", header: "campo", tipo: "string" },
  { key: "valorAnterior", header: "valor_anterior", tipo: "string" },
  { key: "valorNuevo", header: "valor_nuevo", tipo: "string" },
  { key: "motivo", header: "motivo", tipo: "string" },
];

// ---------------------------------------------------------------------------
// FERIADOS (sin columnas de auditoría — M2)
// ---------------------------------------------------------------------------

export const FERIADOS_COLUMNS: ColumnaDef<Feriado>[] = [
  { key: "fecha", header: "fecha", tipo: "string" },
  { key: "descripcion", header: "descripcion", tipo: "string" },
  { key: "ambito", header: "ambito", tipo: "string" },
  { key: "activo", header: "activo", tipo: "boolean" },
];

// ---------------------------------------------------------------------------
// ERRORES (sin columnas de auditoría — NF-08)
// ---------------------------------------------------------------------------

export const ERRORES_COLUMNS: ColumnaDef<ErrorRegistrado>[] = [
  { key: "fechaHora", header: "fecha_hora", tipo: "string" },
  { key: "funcion", header: "funcion", tipo: "string" },
  { key: "mensaje", header: "mensaje", tipo: "string" },
];

// ---------------------------------------------------------------------------
// Registro único hoja -> columnas (para el script de aprovisionamiento y
// para cualquier código que necesite recorrer todas las tablas genéricamente).
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- registro heterogéneo: cada tabla tiene su propio T.
export const ESQUEMA_TABLAS: Record<NombreTabla, { sheet: string; columns: ColumnaDef<any>[] }> = {
  inmuebles: { sheet: SHEET_NAMES.inmuebles, columns: INMUEBLES_COLUMNS },
  expedientes: { sheet: SHEET_NAMES.expedientes, columns: EXPEDIENTES_COLUMNS },
  personas: { sheet: SHEET_NAMES.personas, columns: PERSONAS_COLUMNS },
  actuaciones: { sheet: SHEET_NAMES.actuaciones, columns: ACTUACIONES_COLUMNS },
  actuacionPartes: { sheet: SHEET_NAMES.actuacionPartes, columns: ACTUACION_PARTES_COLUMNS },
  hitos: { sheet: SHEET_NAMES.hitos, columns: HITOS_COLUMNS },
  cfgHitosTipo: { sheet: SHEET_NAMES.cfgHitosTipo, columns: CFG_HITOS_TIPO_COLUMNS },
  actuacionHitos: { sheet: SHEET_NAMES.actuacionHitos, columns: ACTUACION_HITOS_COLUMNS },
  actosAdmin: { sheet: SHEET_NAMES.actosAdmin, columns: ACTOS_ADMIN_COLUMNS },
  comunicaciones: { sheet: SHEET_NAMES.comunicaciones, columns: COMUNICACIONES_COLUMNS },
  documentos: { sheet: SHEET_NAMES.documentos, columns: DOCUMENTOS_COLUMNS },
  areas: { sheet: SHEET_NAMES.areas, columns: AREAS_COLUMNS },
  contactosEpe: { sheet: SHEET_NAMES.contactosEpe, columns: CONTACTOS_EPE_COLUMNS },
  plantillas: { sheet: SHEET_NAMES.plantillas, columns: PLANTILLAS_COLUMNS },
  localidades: { sheet: SHEET_NAMES.localidades, columns: LOCALIDADES_COLUMNS },
  catalogos: { sheet: SHEET_NAMES.catalogos, columns: CATALOGOS_COLUMNS },
  parametros: { sheet: SHEET_NAMES.parametros, columns: PARAMETROS_COLUMNS },
  logCambios: { sheet: SHEET_NAMES.logCambios, columns: LOG_CAMBIOS_COLUMNS },
  feriados: { sheet: SHEET_NAMES.feriados, columns: FERIADOS_COLUMNS },
  errores: { sheet: SHEET_NAMES.errores, columns: ERRORES_COLUMNS },
};

// ---------------------------------------------------------------------------
// Hojas de secuencia (sección 4 del PRD v2.1): una por cada prefijo de
// PREFIJOS_ID, usadas por el repositorio para generar IDs correlativos sin
// reutilizarlos nunca (ver src/lib/alquileres/repositorio/). Columna única:
// una marca de tiempo, solo para que la fila exista — el valor no se lee,
// lo que importa es QUÉ número de fila le tocó al agregarla.
//
// Nota de diseño (ver el comentario de PREFIJOS_ID en tipos.ts): este mapa
// se mantiene A MANO en paralelo a PREFIJOS_ID, en vez de derivarse con un
// `import` de valor desde tipos.ts, a propósito — así este archivo (que
// `scripts/setup-sheet-alquileres.mjs` importa directamente con Node, sin
// bundler) solo necesita imports `import type` de tipos.ts, que el "type
// stripping" nativo de Node borra por completo antes de ejecutar (igual
// trámite que ya usa sheets-schema.ts del CLM, ver F0-2). El tipo
// `Record<PrefijoId, string>` de abajo obliga en tiempo de compilación a que
// las claves coincidan exactamente con `PREFIJOS_ID` — si se agrega un
// prefijo nuevo en tipos.ts y no se agrega acá, `tsc`/`next build` fallan.
// ---------------------------------------------------------------------------

export const SEQ_SHEET_NAMES: Record<PrefijoId, string> = {
  ACT: "SEQ_ACT",
  INM: "SEQ_INM",
  EXP: "SEQ_EXP",
  PER: "SEQ_PER",
  PAR: "SEQ_PAR",
  CFG: "SEQ_CFG",
  AHI: "SEQ_AHI",
  ACA: "SEQ_ACA",
  COM: "SEQ_COM",
  DOC: "SEQ_DOC",
  AR: "SEQ_AR",
  CON: "SEQ_CON",
  PLA: "SEQ_PLA",
  LOC: "SEQ_LOC",
  LOG: "SEQ_LOG",
};
