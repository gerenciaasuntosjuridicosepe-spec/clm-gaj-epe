/**
 * Modelo de datos del módulo de Gestión de Alquileres — INDEPENDIENTE del
 * modelo del CLM (`src/lib/types.ts`): no lo extiende, no lo reutiliza, no
 * lo muta (D2 del PRD v2.1: "Las actuaciones de alquiler son independientes
 * de los contratos del CLM: sin vínculo de datos ni flujo compartido").
 *
 * Fuente: docs/prd-modulo-alquileres-v2.1.md (prevalece), luego
 * docs/prd-app-seguimiento-alquileres-v1.md, luego
 * docs/Estructura_Datos_Gestion_Alquileres_RECONSTRUIDA.xlsx (hoja
 * DICCIONARIO — reconstrucción, no el libro original; ver docs/DECISIONES.md
 * y docs/PENDIENTES-HUMANOS.md para cada campo marcado INFERIDO).
 *
 * Convenciones (iguales en todas las tablas, según DICCIONARIO):
 *  - Fechas de calendario: `string` en formato "yyyy-mm-dd", SIN hora.
 *    Nunca se interpretan con `new Date("yyyy-mm-dd")` (ver src/lib/alquileres/fechas.ts).
 *  - Marcas de tiempo (creado_en, modificado_en, fecha_hora, etc.): `string`
 *    ISO 8601 completo, con zona America/Argentina/Buenos_Aires.
 *  - `activo`: baja lógica — ninguna operación borra filas (RF-17).
 *  - `version`: entero, control optimista de concurrencia (M15), empieza en 1.
 *  - Todas las tablas con auditoría de fila llevan creadoEn/creadoPor/
 *    modificadoEn/modificadoPor (email verificado de la sesión, nunca del cliente).
 */

// ---------------------------------------------------------------------------
// Campos de auditoría comunes (M15 + sección 5 del PRD v1)
// ---------------------------------------------------------------------------

export interface CamposAuditoria {
  activo: boolean;
  creadoEn: string; // ISO con hora
  creadoPor: string; // email
  modificadoEn: string; // ISO con hora
  modificadoPor: string; // email
  /** Control optimista de concurrencia (M15, D14). Empieza en 1. */
  version: number;
}

// ---------------------------------------------------------------------------
// Catálogos (valores de lista) — los códigos de catálogo "cerrados" (es_sistema)
// se tipan como unión literal porque el propio PRD los fija; los catálogos
// abiertos o "a completar con el original" se tipan como `string` y viven en
// src/lib/alquileres/catalogos/ (una sola fuente de verdad, editable, nunca
// hardcodeada en la lógica de negocio) — ver docs/PENDIENTES-HUMANOS.md punto 1.
// ---------------------------------------------------------------------------

export type TipoActuacion = "CONTRATO" | "ADENDA" | "LEGITIMO_ABONO";

export type EstadoActuacion =
  | "PENDIENTE_AVISO"
  | "AVISO_ENVIADO"
  | "EN_TRAMITE"
  | "FORMALIZADA"
  | "CERRADA"
  | "DESISTIDA"
  | "NO_RENOVADO"
  | "ANULADA";

export type CondicionIvaCanon = "SIN_IVA" | "MAS_IVA" | "IVA_INCLUIDO";

export type TipoPersona = "FISICA" | "JURIDICA" | "SUCESION";

/** M7: opcional, no reemplaza a CondicionIvaCanon (que sigue siendo obligatoria al formalizar). */
export type CondicionFiscal = "RESPONSABLE_INSCRIPTO" | "MONOTRIBUTO" | "EXENTO" | "OTRA";

export type RolParte = "TITULAR" | "FIRMANTE";

export type EstadoHito = "PENDIENTE" | "CUMPLIDO" | "NO_APLICA";

export type PlazoUnidad = "MESES" | "DIAS";

export type ComputoDias = "HABILES" | "CORRIDOS";

export type ReferenciaPlazo = "ANTES_FIN_CONTRATO" | "DESPUES_HITO";

export type TipoComunicacion = "AVISO" | "REITERACION" | "CARTA_DOCUMENTO";

export type EstadoComunicacion = "BORRADOR" | "ENVIADO"; // M16: sin ERROR en v1

/**
 * Catálogo abierto, no cerrado por el PRD (DOCUMENTOS.tipo_documento: "Lista
 * completa a confirmar" en DICCIONARIO) — se tipa como `string` a propósito,
 * los 3 valores que sí constan viven como seed en catalogos/catalogos-seed.ts.
 */
export type TipoDocumento = string;

export type OrigenDocumento = "GENERADO" | "CARGADO";

export type AmbitoFeriado = "NACIONAL" | "PROVINCIAL" | "OTRO";

export type AccionLog =
  | "ALTA"
  | "MODIFICACION"
  | "BAJA"
  | "EXPORTACION"
  | "ACCESO_DENEGADO"
  | "CAMBIO_ROL"
  | "CONFLICTO_VERSION"; // agregado en v2.1, M17

/** D3: rol por módulo — independiente del rol del CLM (RolId en src/lib/types.ts). */
export type RolAlquileresId = "ADMINISTRADOR" | "GESTOR" | "SUPERVISOR" | "LECTOR";

// ---------------------------------------------------------------------------
// INMUEBLES
// ---------------------------------------------------------------------------

export interface Inmueble extends CamposAuditoria {
  inmuebleId: string; // PK, prefijo INM-
  domicilio: string;
  localidadId: string; // FK LOCALIDADES
  /** Formato NN-NN-NN-NNNNNN/NNNN-N. Única entre inmuebles activos cuando se informa. */
  partidaInmobiliaria?: string;
  observaciones?: string;
}

// ---------------------------------------------------------------------------
// EXPEDIENTES
// ---------------------------------------------------------------------------

export interface Expediente extends CamposAuditoria {
  expedienteId: string; // PK, prefijo EXP-
  inmuebleId: string; // FK INMUEBLES — un expediente pertenece a un solo inmueble (R2)
  /** Dos formatos válidos: ^1-\d{4}-\d+$ y ^EE-\d{4}-\d+-APPSF-OD$. */
  nroExpediente: string;
  fechaApertura?: string; // yyyy-mm-dd
  observaciones?: string;
}

// ---------------------------------------------------------------------------
// PERSONAS
// ---------------------------------------------------------------------------

export interface Persona extends CamposAuditoria {
  personaId: string; // PK, prefijo PER-
  tipoPersona: TipoPersona;
  apellidoNombreRazonSocial: string;
  /** Solo dígitos, 7 u 8. Dato personal: enmascarado para LECTOR. */
  dni?: string;
  /** 11 dígitos con guiones, dígito verificador módulo 11. Dato personal. */
  cuitCuil?: string;
  condicionFiscal?: CondicionFiscal;
  /** Dato personal. */
  domicilioLegal?: string;
  /** Dato personal. */
  mail?: string;
  /** Dato personal. */
  telefono?: string;
}

/** Campos de PERSONAS considerados datos personales (RA-3 equivalente, enmascarados para LECTOR). */
export const CAMPOS_PERSONALES_PERSONA = ["dni", "cuitCuil", "domicilioLegal", "mail", "telefono"] as const;

// ---------------------------------------------------------------------------
// ACTUACIONES
// ---------------------------------------------------------------------------

export interface Actuacion extends CamposAuditoria {
  actuacionId: string; // PK, código visible ACT-#### generado por el sistema (D15)
  /** ID D.#### del Excel anterior (no único). Oculto para usuarios comunes (M13). */
  codigoLegado?: string;
  tipoActuacion: TipoActuacion;
  inmuebleId: string; // FK INMUEBLES
  /** Puede estar vacío: la actuación existe antes del expediente (aviso a 4 meses). */
  expedienteId?: string;
  /** R3': obligatorio/opcional según tipo — ver reglas/r3-cadena-actuaciones.ts */
  actuacionAnteriorId?: string;
  estadoActuacion: EstadoActuacion;
  /** Obligatorio al pasar a DESISTIDA, NO_RENOVADO o ANULADA (M5). */
  motivoEstado?: string;
  /** FK email de Usuarios — solo activos con rol GESTOR o ADMINISTRADOR (M5, RF-18). */
  responsableEmail?: string;
  /** FK AREAS — sector que ocupa/solicita el inmueble; define destinatarios del aviso y si aplica H-02 (R18). */
  sectorInteresadoAreaId: string;
  /** Catálogo abierto ("a completar con el original" — ver PENDIENTES-HUMANOS.md). */
  destinoCategoria?: string;
  destinoDescripcion?: string;
  fechaInicio?: string; // yyyy-mm-dd, al formalizar
  plazoMeses?: number; // entero > 0, al formalizar
  /** Mayor o igual a fechaInicio. Por defecto fechaInicio + plazoMeses - 1 día (R5). Vacía en LA abierto. */
  fechaFin?: string; // yyyy-mm-dd
  /** Monto MENSUAL en pesos (M6), > 0. En legítimo abono: monto mensual (D15). */
  canonInicial?: number;
  /** M18/D15: solo LEGITIMO_ABONO — monto global del acto administrativo. */
  montoTotalReconocido?: number;
  condicionIvaCanon?: CondicionIvaCanon;
  reglaActualizacion?: string;
  /** FK CONTACTOS_EPE — firmante de EPE, al formalizar. */
  firmanteEpeContactoId?: string;
  observaciones?: string;
}

// ---------------------------------------------------------------------------
// ACTUACION_PARTES
// ---------------------------------------------------------------------------

export interface ActuacionParte extends CamposAuditoria {
  parteId: string; // PK, prefijo PAR-
  actuacionId: string; // FK ACTUACIONES
  personaId: string; // FK PERSONAS
  rolParte: RolParte;
  orden: number; // orden de aparición en el contrato
  /** A quién representa (ej. apoderado de un titular). */
  representaAPersonaId?: string;
  /** Carácter en que actúa — catálogo abierto ("a completar con el original"). */
  caracter?: string;
  /** Domicilio vigente en esa actuación (se conserva por contrato, no se actualiza retroactivamente). */
  domicilioVigente?: string;
  mailVigente?: string;
}

// ---------------------------------------------------------------------------
// HITOS (catálogo maestro de hitos del circuito)
// ---------------------------------------------------------------------------

export interface Hito extends CamposAuditoria {
  hitoId: string; // PK, formato H-NN
  codigo: string; // ej. RESPUESTA_SUCURSAL
  nombre: string;
  etapa: string; // PREVIA u otras etapas del circuito
  orden: number;
}

// ---------------------------------------------------------------------------
// CFG_HITOS_TIPO (configuración de hitos y plazos por tipo de actuación)
// ---------------------------------------------------------------------------

export interface CfgHitoTipo extends CamposAuditoria {
  cfgId: string; // PK, prefijo CFG-
  tipoActuacion: TipoActuacion; // solo CONTRATO genera hitos en la práctica
  hitoId: string; // FK HITOS
  /** Entero. Puede faltar en hitos sin plazo definido (H-05, H-15, H-20 — ver PENDIENTES-HUMANOS.md). */
  plazoValor?: number;
  plazoUnidad?: PlazoUnidad;
  /** Obligatorio si plazoUnidad = DIAS. H-02, H-21 y H-03 = HABILES (M9). */
  computoDias?: ComputoDias;
  referencia?: ReferenciaPlazo;
  /** Obligatorio si referencia = DESPUES_HITO. */
  hitoReferenciaId?: string;
  /** Si es TRUE, el atraso dispara la alerta A4. */
  generaAlerta: boolean;
  orden: number;
}

// ---------------------------------------------------------------------------
// ACTUACION_HITOS (hitos concretos de cada actuación)
// ---------------------------------------------------------------------------

export interface ActuacionHito extends CamposAuditoria {
  actuacionHitoId: string; // PK, prefijo AHI-
  actuacionId: string; // FK ACTUACIONES
  hitoId: string; // FK HITOS
  estadoHito: EstadoHito;
  fechaPrevista?: string; // yyyy-mm-dd, calculada según R13
  fechaCumplimiento?: string; // yyyy-mm-dd, hoy o anterior, nunca futura (RF-20)
  /** Si es TRUE, la app no recalcula fechaPrevista (M10, R13). */
  reprogramada: boolean;
  /** Referencia del cumplimiento (ej. número de nota). */
  referencia?: string;
  /** Motivo obligatorio al reprogramar o marcar NO_APLICA (RF-21). */
  observaciones?: string;
}

// ---------------------------------------------------------------------------
// ACTOS_ADMIN
// ---------------------------------------------------------------------------

export interface ActoAdmin extends CamposAuditoria {
  actoId: string; // PK, prefijo ACA-
  actuacionId: string; // FK ACTUACIONES — LEGITIMO_ABONO no pasa a FORMALIZADA sin al menos uno (RF-29)
  tipoActo: string;
  numeroActo: string;
  fechaActo: string; // yyyy-mm-dd
  organoEmisor: string;
  documentoId?: string; // FK DOCUMENTOS
}

// ---------------------------------------------------------------------------
// COMUNICACIONES
// ---------------------------------------------------------------------------

export interface Comunicacion extends CamposAuditoria {
  comunicacionId: string; // PK, prefijo COM-
  actuacionId: string; // FK ACTUACIONES
  hitoId?: string; // FK HITOS — hito que cumple
  tipoComunicacion: TipoComunicacion;
  asunto: string;
  /** Armados desde CONTACTOS_EPE vigentes (RF-22). */
  destinatarios: string;
  cuerpo: string;
  estadoComunicacion: EstadoComunicacion;
  /** No futura (T23). Obligatoria si estadoComunicacion = ENVIADO. */
  fechaEnvio?: string; // yyyy-mm-dd
  /** Vacío en v1 (M16): no hay envío automático, no hay ID de Gmail que registrar. */
  idMensajeGmail?: string;
  /** M16: quién declaró el envío. Obligatorio si ENVIADO. */
  envioDeclaradoPor?: string; // email
  /** M16. Obligatorio si ENVIADO. */
  envioDeclaradoEn?: string; // ISO con hora
  plantillaId?: string; // FK PLANTILLAS
  /** Para carta documento: número de la carta (RF-24). */
  observaciones?: string;
}

// ---------------------------------------------------------------------------
// DOCUMENTOS
// ---------------------------------------------------------------------------

export interface DocumentoAlquiler extends CamposAuditoria {
  documentoId: string; // PK, prefijo DOC-
  actuacionId: string; // FK ACTUACIONES
  tipoDocumento: TipoDocumento;
  origen: OrigenDocumento;
  /** Enlace https:// de drive.google.com o docs.google.com. */
  urlDocumento: string;
  /** TRUE en el escaneado firmado (RF-28, alerta A6). */
  firmado: boolean;
  plantillaId?: string; // FK PLANTILLAS
  fechaDocumento?: string; // yyyy-mm-dd
  observaciones?: string;
}

// ---------------------------------------------------------------------------
// AREAS
// ---------------------------------------------------------------------------

/** Catálogo abierto más allá de SUCURSAL/GERENCIA (DICCIONARIO: "lista completa a confirmar"). */
export type TipoArea = string;

export interface Area extends CamposAuditoria {
  areaId: string; // PK, formato AR-NN
  nombre: string;
  tipoArea: TipoArea;
  /** EIRBI (AR-24) y Área Asesoramiento (AR-25) tienen areaPadreId = AR-06 (M12). */
  areaPadreId?: string; // FK AREAS
}

// ---------------------------------------------------------------------------
// CONTACTOS_EPE
// ---------------------------------------------------------------------------

/** Catálogo abierto más allá de JEFE_SUCURSAL/DESIGNADO/GERENTE/RESPONSABLE_DESIGNADO. */
export type CargoContacto = string;

export interface ContactoEpe extends CamposAuditoria {
  contactoId: string; // PK, prefijo CON-
  areaId: string; // FK AREAS
  nombre: string;
  cargo: CargoContacto;
  /** Dominio epe.santafe.gov.ar. */
  mail: string;
  telefono?: string;
  vigenteDesde: string; // yyyy-mm-dd
  /** Al cargar un nuevo titular, la app propone cerrar la vigencia del anterior (RF-33). */
  vigenteHasta?: string; // yyyy-mm-dd
}

// ---------------------------------------------------------------------------
// PLANTILLAS
// ---------------------------------------------------------------------------

export type TipoPlantilla = "CONTRATO" | "ADENDA" | "MAIL_AVISO" | "MAIL_REITERACION";

export interface Plantilla extends CamposAuditoria {
  plantillaId: string; // PK, prefijo PLA-
  tipoPlantilla: TipoPlantilla;
  nombre: string;
  /** Debe existir y ser accesible para la cuenta de servicio (RF-35). */
  googleDocId: string;
  asuntoMail?: string; // para plantillas de mail
}

// ---------------------------------------------------------------------------
// LOCALIDADES
// ---------------------------------------------------------------------------

export interface Localidad extends CamposAuditoria {
  localidadId: string; // PK, prefijo LOC-
  nombre: string;
  departamento?: string;
  provincia?: string;
}

// ---------------------------------------------------------------------------
// CATALOGOS (valores de listas controladas, editables por ADMINISTRADOR salvo es_sistema)
// ---------------------------------------------------------------------------

export interface CatalogoValor extends CamposAuditoria {
  catalogo: string; // ej. "estado_actuacion"
  codigo: string;
  descripcion: string;
  orden: number;
  /** Los de sistema no se desactivan ni cambian de código (M11, R20). */
  esSistema: boolean;
}

// ---------------------------------------------------------------------------
// PARAMETROS
// ---------------------------------------------------------------------------

export interface Parametro extends CamposAuditoria {
  clave: string; // PK
  valor: string;
  descripcion?: string;
}

// ---------------------------------------------------------------------------
// LOG_CAMBIOS (auditoría, solo alta — RF-38)
// ---------------------------------------------------------------------------

export interface LogCambio {
  logId: string; // PK, prefijo LOG-
  fechaHora: string; // ISO con hora
  usuarioEmail: string;
  accion: AccionLog;
  hoja: string;
  registroId: string;
  /** Un registro por campo cambiado (MODIFICACION). */
  campo?: string;
  valorAnterior?: string;
  valorNuevo?: string;
  /** Obligatorio al cambiar fecha_inicio/fecha_fin/canon_inicial/estado de una FORMALIZADA. */
  motivo?: string;
}

// ---------------------------------------------------------------------------
// FERIADOS (M2 — base del cómputo de días hábiles, R13)
// ---------------------------------------------------------------------------

export interface Feriado {
  fecha: string; // PK, yyyy-mm-dd
  descripcion: string;
  ambito: AmbitoFeriado;
  activo: boolean;
}

// ---------------------------------------------------------------------------
// ERRORES (NF-08 — visible solo al ADMINISTRADOR, sin datos personales NF-S7)
// ---------------------------------------------------------------------------

export interface ErrorRegistrado {
  fechaHora: string; // ISO con hora
  funcion: string;
  mensaje: string;
}

// ---------------------------------------------------------------------------
// Prefijos de ID (sección 4 del PRD v2.1: "cada prefijo tiene una hoja de
// secuencia donde la app agrega una fila; el número del ID es la fila
// asignada por la propia API al agregar"). Única fuente de verdad: agregar
// un prefijo acá y en ESQUEMA_SECUENCIAS (esquema.ts) es lo único que hace
// falta para una tabla nueva con ID generado por el sistema.
// ---------------------------------------------------------------------------

export const PREFIJOS_ID = {
  actuacion: "ACT",
  inmueble: "INM",
  expediente: "EXP",
  persona: "PER",
  actuacionParte: "PAR",
  cfgHitoTipo: "CFG",
  actuacionHito: "AHI",
  actoAdmin: "ACA",
  comunicacion: "COM",
  documento: "DOC",
  area: "AR",
  contactoEpe: "CON",
  plantilla: "PLA",
  localidad: "LOC",
  logCambio: "LOG",
} as const;

export type PrefijoId = (typeof PREFIJOS_ID)[keyof typeof PREFIJOS_ID];
