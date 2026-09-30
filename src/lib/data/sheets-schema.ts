import {
  AnotacionSeguimiento,
  Contrato,
  Documento,
  EstadoAprobacionSolicitud,
  EstadoContrato,
  EtapaId,
  EventoHistorial,
  GarantiaExigida,
  HitoContractual,
  RolId,
  TipoContrato,
} from "../types";
import { Usuario } from "./mock-catalogos";

/**
 * Esquema de la planilla de Google Sheets — nombres de hoja y columnas.
 *
 * Este archivo es la ÚNICA fuente de verdad sobre cómo se traduce el modelo
 * de datos (src/lib/types.ts) a filas de Sheets. Si el día de mañana se
 * agrega un campo a `Contrato`, alcanza con sumarlo acá (en
 * `CONTRATOS_COLUMNS`) y en la hoja real — el resto del código no cambia.
 *
 * Se usan 4 hojas relacionadas por `id`/`contratoId` en vez de una sola hoja
 * ancha, porque `hitos` e `historial` son listas de largo variable por
 * contrato (no entran bien en columnas de una hoja "Contratos" plana).
 */

export const SHEET_NAMES = {
  contratos: "Contratos",
  historial: "Historial",
  hitos: "Hitos",
  anotaciones: "Anotaciones",
  garantias: "Garantias",
  sectores: "Sectores",
  tiposContrato: "TiposContrato",
  tiposAnotacion: "TiposAnotacion",
  tiposGarantia: "TiposGarantia",
  usuarios: "Usuarios",
} as const;

/** Columnas de la hoja "Contratos", en orden. El header es la fila 1 de la hoja. */
export const CONTRATOS_COLUMNS: { key: keyof Contrato; header: string }[] = [
  { key: "id", header: "id" },
  { key: "numeroExpedienteVinculado", header: "numero_expediente_vinculado" },
  { key: "areaSolicitante", header: "area_solicitante" },
  { key: "documento", header: "documento" },
  { key: "tipoContrato", header: "tipo_contrato" },
  { key: "objeto", header: "objeto" },
  { key: "contraparteRazonSocial", header: "contraparte_razon_social" },
  { key: "contraparteIdentificacion", header: "contraparte_identificacion" },
  { key: "adendaDeId", header: "adenda_de_id" },
  { key: "estadoAprobacionSolicitud", header: "estado_aprobacion_solicitud" },
  { key: "fechaLimitePlazoPrudencial", header: "fecha_limite_plazo_prudencial" },
  { key: "respaldoEnExpediente", header: "respaldo_en_expediente" },
  { key: "linkBorradorDrive", header: "link_seguimiento_modelo" },
  { key: "abogadoACargo", header: "abogado_a_cargo" },
  { key: "fechaDictamenLegal", header: "fecha_dictamen_legal" },
  { key: "responsableAnalisisFinanciero", header: "responsable_analisis_financiero" },
  { key: "fechaAnalisisFinanciero", header: "fecha_analisis_financiero" },
  { key: "numeroResolucion", header: "numero_resolucion" },
  { key: "sectorEmisor", header: "sector_emisor" },
  { key: "fechaFirma", header: "fecha_firma" },
  { key: "linkInstrumentoWord", header: "link_instrumento_word" },
  { key: "linkContratoFirmadoEscaneado", header: "link_contrato_firmado_escaneado" },
  { key: "fechaInicioVigencia", header: "fecha_inicio_vigencia" },
  { key: "fechaFinVigencia", header: "fecha_fin_vigencia" },
  { key: "montoTotal", header: "monto_total" },
  { key: "moneda", header: "moneda" },
  { key: "responsableSeguimiento", header: "responsable_seguimiento" },
  { key: "estadoContrato", header: "estado_contrato" },
  { key: "clausulaProrroga", header: "clausula_prorroga" },
  { key: "clausulaRescision", header: "clausula_rescision" },
  { key: "plazoRescisionDias", header: "plazo_rescision_dias" },
  { key: "clausulaPenalidad", header: "clausula_penalidad" },
  { key: "etapaActual", header: "etapa_actual" },
  { key: "gerenciaResponsable", header: "gerencia_responsable" },
];

export const HISTORIAL_COLUMNS = ["contrato_id", "fecha", "usuario", "rol", "descripcion"] as const;
export const HITOS_COLUMNS = ["contrato_id", "tipo", "fecha", "descripcion", "monto"] as const;
export const ANOTACIONES_COLUMNS = ["contrato_id", "fecha", "tipo", "observaciones", "usuario"] as const;
export const GARANTIAS_COLUMNS = ["contrato_id", "id", "tipo", "descripcion", "fecha_presentacion"] as const;
export const SECTORES_COLUMNS = ["id", "nombre"] as const;
export const TIPOS_CONTRATO_COLUMNS = ["nombre", "sector_asignado_id"] as const;
export const TIPOS_ANOTACION_COLUMNS = ["nombre"] as const;
export const TIPOS_GARANTIA_COLUMNS = ["nombre"] as const;
export const USUARIOS_COLUMNS = ["id", "nombre", "rol_id", "area", "email"] as const;

/** Convierte una fila cruda de la hoja "Contratos" en un objeto `Contrato` (sin hitos/historial: se completan aparte). */
export function filaAContrato(fila: string[]): Contrato {
  const get = (key: keyof Contrato): string | undefined => {
    const idx = CONTRATOS_COLUMNS.findIndex((c) => c.key === key);
    const v = fila[idx];
    return v === "" || v === undefined ? undefined : v;
  };
  return {
    id: get("id") ?? "",
    numeroExpedienteVinculado: get("numeroExpedienteVinculado"),
    areaSolicitante: get("areaSolicitante") ?? "",
    documento: (get("documento") ?? "Contrato") as Documento,
    tipoContrato: (get("tipoContrato") ?? "Contrato") as TipoContrato,
    objeto: get("objeto") ?? "",
    contraparteRazonSocial: get("contraparteRazonSocial") ?? "",
    contraparteIdentificacion: get("contraparteIdentificacion") ?? "",
    adendaDeId: get("adendaDeId"),
    estadoAprobacionSolicitud: (get("estadoAprobacionSolicitud") ?? "Pendiente") as EstadoAprobacionSolicitud,
    fechaLimitePlazoPrudencial: get("fechaLimitePlazoPrudencial"),
    respaldoEnExpediente: get("respaldoEnExpediente") === "TRUE" || get("respaldoEnExpediente") === "true",
    linkBorradorDrive: get("linkBorradorDrive"),
    abogadoACargo: get("abogadoACargo"),
    fechaDictamenLegal: get("fechaDictamenLegal"),
    responsableAnalisisFinanciero: get("responsableAnalisisFinanciero"),
    fechaAnalisisFinanciero: get("fechaAnalisisFinanciero"),
    numeroResolucion: get("numeroResolucion"),
    sectorEmisor: get("sectorEmisor"),
    fechaFirma: get("fechaFirma"),
    linkInstrumentoWord: get("linkInstrumentoWord"),
    linkContratoFirmadoEscaneado: get("linkContratoFirmadoEscaneado"),
    fechaInicioVigencia: get("fechaInicioVigencia"),
    fechaFinVigencia: get("fechaFinVigencia"),
    montoTotal: get("montoTotal") ? Number(get("montoTotal")) : undefined,
    moneda: get("moneda"),
    responsableSeguimiento: get("responsableSeguimiento"),
    estadoContrato: (get("estadoContrato") ?? "Vigente") as EstadoContrato,
    clausulaProrroga: get("clausulaProrroga") === "TRUE" || get("clausulaProrroga") === "true",
    clausulaRescision: get("clausulaRescision") === "TRUE" || get("clausulaRescision") === "true",
    plazoRescisionDias: get("plazoRescisionDias") ? Number(get("plazoRescisionDias")) : undefined,
    clausulaPenalidad: get("clausulaPenalidad") === "TRUE" || get("clausulaPenalidad") === "true",
    etapaActual: (get("etapaActual") ?? "solicitud") as EtapaId,
    gerenciaResponsable: get("gerenciaResponsable") ?? "",
    hitos: [],
    garantiasExigidas: [],
    anotacionesSeguimiento: [],
    historial: [],
  };
}

/** Convierte un `Contrato` a una fila para escribir en la hoja "Contratos", en el mismo orden que `CONTRATOS_COLUMNS`. */
export function contratoAFila(c: Contrato): (string | number | boolean)[] {
  return CONTRATOS_COLUMNS.map(({ key }) => {
    const v = c[key];
    if (v === undefined || v === null) return "";
    if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
    if (Array.isArray(v)) return ""; // hitos/historial no se serializan acá
    return v as string | number;
  });
}

export function filaAEvento(fila: string[]): EventoHistorial & { contratoId: string } {
  return {
    contratoId: fila[0] ?? "",
    fecha: fila[1] ?? "",
    usuario: fila[2] ?? "",
    rol: (fila[3] ?? "area_solicitante") as RolId,
    descripcion: fila[4] ?? "",
  };
}

export function eventoAFila(contratoId: string, ev: EventoHistorial): (string | number)[] {
  return [contratoId, ev.fecha, ev.usuario, ev.rol, ev.descripcion];
}

export function filaAHito(fila: string[]): HitoContractual & { contratoId: string } {
  return {
    contratoId: fila[0] ?? "",
    tipo: (fila[1] ?? "libre") as HitoContractual["tipo"],
    fecha: fila[2] ?? "",
    descripcion: fila[3] || undefined,
    monto: fila[4] ? Number(fila[4]) : undefined,
  };
}

export function hitoAFila(contratoId: string, h: HitoContractual): (string | number)[] {
  return [contratoId, h.tipo, h.fecha, h.descripcion ?? "", h.monto ?? ""];
}

export function filaAAnotacion(fila: string[]): AnotacionSeguimiento & { contratoId: string } {
  return {
    contratoId: fila[0] ?? "",
    fecha: fila[1] ?? "",
    tipo: fila[2] ?? "",
    observaciones: fila[3] ?? "",
    usuario: fila[4] || undefined,
  };
}

export function anotacionAFila(contratoId: string, a: AnotacionSeguimiento): (string | number)[] {
  return [contratoId, a.fecha, a.tipo, a.observaciones, a.usuario ?? ""];
}

export function filaAGarantia(fila: string[]): GarantiaExigida & { contratoId: string } {
  return {
    contratoId: fila[0] ?? "",
    id: fila[1] ?? "",
    tipo: fila[2] ?? "",
    descripcion: fila[3] ?? "",
    fechaPresentacion: fila[4] || undefined,
  };
}

export function garantiaAFila(contratoId: string, g: GarantiaExigida): (string | number)[] {
  return [contratoId, g.id, g.tipo, g.descripcion, g.fechaPresentacion ?? ""];
}

export function filaAUsuario(fila: string[]): Usuario {
  return { id: fila[0] ?? "", nombre: fila[1] ?? "", rolId: fila[2] ?? "", area: fila[3] || undefined, email: fila[4] ?? "" };
}
