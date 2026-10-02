/**
 * Alertas A1-A8 del PRD (v1 sección 6 + A8 nuevo en v2.1, RF-39). Se
 * calculan al vuelo, nunca se guardan. Cada función es independiente y pura
 * — el servicio que arma el dashboard/cola de trabajo las combina.
 */
import { diferenciaDias, sumarMeses } from "../fechas";
import type { Actuacion, ActuacionHito, DocumentoAlquiler } from "../tipos";
import { vencimientoEfectivo } from "./r15-vencimiento-efectivo";
import { tieneSucesoraActiva } from "./campos-calculados";

function faltanNMesesOMenos(hoy: string, fechaObjetivo: string, meses: number): boolean {
  return hoy >= sumarMeses(fechaObjetivo, -meses);
}

/** Exportada (además de usarse acá adentro) porque `reglas/calendario.ts` necesita el mismo criterio para no ofrecer un evento de vencimiento de un CONTRATO ya cerrado/desistido/anulado/no renovado. */
export function esTerminal(estado: Actuacion["estadoActuacion"]): boolean {
  return estado === "DESISTIDA" || estado === "ANULADA" || estado === "NO_RENOVADO" || estado === "CERRADA";
}

/**
 * A1 — Iniciar aviso: faltan 4 meses o menos para el vencimiento efectivo de
 * un CONTRATO vigente y no existe actuación sucesora activa.
 */
export function alertaA1IniciarAviso(contrato: Actuacion, todasLasActuaciones: Actuacion[], hoy: string): boolean {
  if (contrato.tipoActuacion !== "CONTRATO") return false;
  if (esTerminal(contrato.estadoActuacion)) return false;
  const venc = vencimientoEfectivo(contrato, todasLasActuaciones);
  if (!venc) return false;
  if (!faltanNMesesOMenos(hoy, venc, 4)) return false;
  return !tieneSucesoraActiva(contrato, todasLasActuaciones);
}

/** A2 — Sector sin respuesta: H-02 o H-21 PENDIENTE con fecha_prevista vencida. */
export function alertaA2SectorSinRespuesta(hito: Pick<ActuacionHito, "hitoId" | "estadoHito" | "fechaPrevista">, hoy: string): boolean {
  if (hito.hitoId !== "H-02" && hito.hitoId !== "H-21") return false;
  if (hito.estadoHito !== "PENDIENTE") return false;
  if (!hito.fechaPrevista) return false;
  return hito.fechaPrevista < hoy;
}

/** A3 — Carta documento: faltan 3 meses o menos para el vencimiento y H-04 sigue PENDIENTE sin PROPUESTA_LOCADOR. */
export function alertaA3CartaDocumento(
  contrato: Actuacion,
  todasLasActuaciones: Actuacion[],
  hitoH04: Pick<ActuacionHito, "estadoHito"> | undefined,
  hayPropuestaLocador: boolean,
  hoy: string
): boolean {
  if (contrato.tipoActuacion !== "CONTRATO") return false;
  const venc = vencimientoEfectivo(contrato, todasLasActuaciones);
  if (!venc) return false;
  if (!faltanNMesesOMenos(hoy, venc, 3)) return false;
  if (hayPropuestaLocador) return false;
  return hitoH04?.estadoHito === "PENDIENTE";
}

/** A4 — Hito atrasado: cualquier hito con genera_alerta = TRUE y fecha_prevista vencida. */
export function alertaA4HitoAtrasado(
  hito: Pick<ActuacionHito, "estadoHito" | "fechaPrevista">,
  generaAlerta: boolean,
  hoy: string
): boolean {
  if (!generaAlerta) return false;
  if (hito.estadoHito !== "PENDIENTE") return false;
  if (!hito.fechaPrevista) return false;
  return hito.fechaPrevista < hoy;
}

/**
 * A5 — Ocupación sin contrato (riesgo alto): CONTRATO vencido, sin sucesora
 * activa y sin marca NO_RENOVADO ni LEGITIMO_ABONO en curso (T9, T10).
 */
export function alertaA5OcupacionSinContrato(contrato: Actuacion, todasLasActuaciones: Actuacion[], hoy: string): boolean {
  if (contrato.tipoActuacion !== "CONTRATO") return false;
  if (contrato.estadoActuacion === "NO_RENOVADO") return false; // T9
  const venc = vencimientoEfectivo(contrato, todasLasActuaciones);
  if (!venc) return false;
  if (venc >= hoy) return false; // todavía no venció
  return !tieneSucesoraActiva(contrato, todasLasActuaciones); // T10
}

/** A6 — Formalizada sin escaneado: estado FORMALIZADA sin DOCUMENTO ESCANEADO con firmado = TRUE. */
export function alertaA6FormalizadaSinEscaneado(
  contrato: Actuacion,
  documentos: Pick<DocumentoAlquiler, "tipoDocumento" | "firmado">[]
): boolean {
  if (contrato.estadoActuacion !== "FORMALIZADA") return false;
  return !documentos.some((d) => d.tipoDocumento === "ESCANEADO" && d.firmado);
}

/** A7 — Feriados sin cargar: no hay ningún feriado cargado para el año próximo. */
export function alertaA7FeriadosSinCargar(anioProximo: number, feriados: { fecha: string }[]): boolean {
  const prefijo = String(anioProximo);
  return !feriados.some((f) => f.fecha.startsWith(prefijo));
}

/** A8 (v2.1) — Sin respaldo hace más días que `dias_alerta_respaldo` (T25). */
export function alertaA8SinRespaldoReciente(ultimoRespaldoEn: string | undefined, hoy: string, diasAlertaRespaldo: number): boolean {
  if (!ultimoRespaldoEn) return true; // nunca se hizo un respaldo
  const dias = diferenciaDias(ultimoRespaldoEn.slice(0, 10), hoy);
  return dias > diasAlertaRespaldo;
}
