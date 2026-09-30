/**
 * Modelo de datos del CLM — Gerencia de Asuntos Jurídicos (EPE)
 * Fuente: PRD_CLM_EPE.docx, sección 4 (Modelo de datos) y sección 5/6 (flujo y roles).
 *
 * Nota de arquitectura: este archivo define el modelo funcional, independiente
 * de dónde se persista. La v1 usa datos mock en memoria (ver lib/data/provider.ts).
 * Cuando se conecte Google Sheets, este modelo NO debería cambiar — solo cambia
 * la implementación de ContratosProvider.
 */

/** 4.1 — Documento: forma legal del instrumento. */
export type Documento = "Contrato" | "Convenio" | "Acta Acuerdo" | "Adenda";

/**
 * 4.1bis — Tipo de contrato: catálogo configurable e independiente de Documento.
 * `string`, no una unión fija: se administra en tiempo de ejecución desde
 * Administración > Tipos de contrato (ver src/lib/data/catalogos-provider.ts),
 * no está codificado en el software.
 */
export type TipoContrato = string;

/** 5 / 6 — Etapas del flujo funcional (BPMN de referencia textual del PRD). */
export type EtapaId =
  | "solicitud"
  | "aprobacion_solicitud"
  | "redaccion"
  | "negociacion"
  | "encuadre_legal"
  | "analisis_financiero"
  | "acto_administrativo"
  | "firma"
  | "repositorio"
  | "ejecucion"
  | "cumplimiento"
  | "cierre";

export const ETAPAS_ORDEN: { id: EtapaId; label: string }[] = [
  { id: "solicitud", label: "Solicitud" },
  { id: "aprobacion_solicitud", label: "Aprob. solicitud" },
  { id: "redaccion", label: "Redacción" },
  { id: "negociacion", label: "Negociación" },
  { id: "encuadre_legal", label: "Encuadre legal" },
  { id: "analisis_financiero", label: "An. financiero" },
  { id: "acto_administrativo", label: "Acto adm." },
  { id: "firma", label: "Firma" },
  { id: "repositorio", label: "Repositorio" },
  { id: "ejecucion", label: "Ejecución" },
  { id: "cumplimiento", label: "Cumplimiento" },
  { id: "cierre", label: "Renov. / Cierre" },
];

/** 3 — Roles (tabla de roles del PRD + correcciones acordadas con el usuario). */
export type RolId =
  | "gerencia_asuntos_juridicos"
  | "jefatura_asesoramiento"
  | "abogado"
  | "area_solicitante"
  | "gerencia_administracion"
  | "aprobador_nivel"
  | "autoridad_firmante"
  | "responsable_seguimiento"
  | "administrador_sistema";

export interface Rol {
  id: RolId;
  nombre: string;
  descripcion: string;
  /** true = ve todos los contratos en todas las etapas, sin restricción. */
  visibilidadTotal: boolean;
  /** true = puede ver todos los dashboards y KPIs sin restricción. */
  dashboardsTotal: boolean;
}

/** 3 — Estado de una solicitud/contrato (sección 4.2, etapa Renovación/Cierre + Aprobación de solicitud). */
export type EstadoAprobacionSolicitud = "Pendiente" | "Aprobada" | "Archivada";
export type EstadoContrato = "Vigente" | "Vencido" | "Prórroga" | "Rescindido";

export interface HitoContractual {
  tipo: "vencimiento_vigencia" | "pago" | "libre";
  fecha: string; // ISO
  descripcion?: string;
  monto?: number;
}

export interface EventoHistorial {
  fecha: string; // ISO
  usuario: string;
  rol: RolId;
  descripcion: string;
}

/**
 * Anotación de seguimiento durante Redacción/Negociación (agregado a pedido
 * del usuario, no viene del PRD original). "Tipo" es un catálogo
 * configurable en Administración > Tipos de anotación (mismo patrón que
 * Tipos de contrato o Sectores), no un enum cerrado en el código.
 */
export interface AnotacionSeguimiento {
  fecha: string; // ISO
  tipo: string; // valor del catálogo de tipos de anotación
  observaciones: string;
  usuario?: string;
}

/**
 * Garantía exigida (etapa Renovación/Cierre, PRD sección 4.2). Lista
 * estructurada en vez de texto libre único, para poder reportar por tipo de
 * garantía más adelante. "Tipo" es texto libre (no catálogo cerrado) porque
 * el PRD no define un listado fijo de tipos de garantía.
 */
export interface GarantiaExigida {
  id: string;
  tipo: string; // ej. "Seguro de caución", "Fianza bancaria", "Pagaré"
  descripcion: string; // monto, porcentaje y/o condiciones, en texto libre
  /** Se completa en la etapa de Firma. Sin esto en todas las garantías, no se puede avanzar a Repositorio. */
  fechaPresentacion?: string; // ISO
}

/**
 * Contrato — registro central del CLM.
 * Agrupa los campos mínimos por etapa definidos en la sección 4.2 del PRD.
 * No todos los campos están completos en todas las etapas: un expediente
 * recién creado solo tiene los campos de "Solicitud / Intake".
 */
export interface Contrato {
  id: string; // Nº de expediente CLM, ej. EXP-2026-0341
  numeroExpedienteVinculado?: string; // expediente electrónico (fuente legal)

  // Solicitud / Intake
  areaSolicitante: string;
  documento: Documento;
  tipoContrato: TipoContrato;
  objeto: string;
  contraparteRazonSocial: string;
  contraparteIdentificacion: string;
  adendaDeId?: string; // vincula una Adenda a su documento original

  // Aprobación de solicitud
  estadoAprobacionSolicitud: EstadoAprobacionSolicitud;
  fechaLimitePlazoPrudencial?: string; // ISO
  respaldoEnExpediente: boolean;

  // Redacción / Negociación
  /** Proyecto de contrato — documento de trabajo con control de cambios. */
  linkBorradorDrive?: string;
  anotacionesSeguimiento: AnotacionSeguimiento[];

  /**
   * Encuadre legal. `abogadoACargo` es el mismo abogado responsable de
   * Redacción, Negociación y Encuadre legal — se asigna una única vez, al
   * aprobar la solicitud (PRD tabla 3: asignación directa a un usuario).
   */
  abogadoACargo?: string;
  fechaDictamenLegal?: string;
  /** Modelo final del instrumento en Word — se completa al emitir el dictamen legal. */
  linkInstrumentoWord?: string;

  // Análisis financiero
  responsableAnalisisFinanciero?: string;
  fechaAnalisisFinanciero?: string;

  // Aprobación por Acto Administrativo
  numeroResolucion?: string;
  sectorEmisor?: string;

  // Firma
  fechaFirma?: string;
  /** Contrato firmado (y escaneado) — se completa en la etapa de Firma. */
  linkContratoFirmadoEscaneado?: string;

  // Ejecución / Gestión de obligaciones
  fechaInicioVigencia?: string;
  fechaFinVigencia?: string;
  montoTotal?: number;
  moneda?: string;
  responsableSeguimiento?: string;
  /** Hitos contractuales — se cargan en la etapa de Encuadre legal (definición temprana), aunque se activan durante Ejecución. */
  hitos: HitoContractual[];

  // Renovación / Cierre
  estadoContrato: EstadoContrato;
  clausulaProrroga: boolean;
  clausulaRescision: boolean;
  /** Días de preaviso exigidos para rescindir. Solo aplica si clausulaRescision es true. */
  plazoRescisionDias?: number;
  clausulaPenalidad: boolean;
  /** Se cargan (tipo/descripción) en Encuadre legal; la fecha de presentación de cada una se completa en Firma. */
  garantiasExigidas: GarantiaExigida[];

  // Meta
  etapaActual: EtapaId;
  gerenciaResponsable: string;
  historial: EventoHistorial[];
}
