/**
 * Campos calculados C1, C4, C6 del PRD v1, sección 6 (C2 = R15, C3 = fechas.ts
 * nivelSemaforo + diferenciaDias, C5 queda documentado como pendiente de un
 * caso de uso real para no sobre-diseñar sin poder probarlo).
 */
import { diferenciaDias } from "../fechas";
import type { Actuacion } from "../tipos";
import { vencimientoEfectivo } from "./r15-vencimiento-efectivo";

export type SituacionVigencia = "VIGENTE" | "VENCIDA" | "FUTURA";

/** C1 — Situación de vigencia de un CONTRATO. Un LEGITIMO_ABONO abierto (sin fecha_fin) es VIGENTE. */
export function situacionVigencia(actuacion: Actuacion, todasLasActuaciones: Actuacion[], hoy: string): SituacionVigencia | undefined {
  if (actuacion.tipoActuacion === "LEGITIMO_ABONO" && !actuacion.fechaFin) return "VIGENTE";

  if (actuacion.tipoActuacion === "CONTRATO") {
    const venc = vencimientoEfectivo(actuacion, todasLasActuaciones);
    if (!actuacion.fechaInicio || !venc) return undefined;
    if (hoy < actuacion.fechaInicio) return "FUTURA";
    return hoy > venc ? "VENCIDA" : "VIGENTE";
  }

  // ADENDA y LEGITIMO_ABONO con fecha_fin: usan sus propias fechas directamente (no tienen vencimiento efectivo propio, R15 es solo de CONTRATO).
  if (!actuacion.fechaInicio || !actuacion.fechaFin) return undefined;
  if (hoy < actuacion.fechaInicio) return "FUTURA";
  return hoy > actuacion.fechaFin ? "VENCIDA" : "VIGENTE";
}

/**
 * C4 — Renovación en curso: existe una actuación posterior que apunta a
 * `actuacion` (vía `actuacion_anterior_id`) y no está DESISTIDA, ANULADA ni
 * NO_RENOVADO.
 */
export function tieneSucesoraActiva(actuacion: Actuacion, todasLasActuaciones: Actuacion[]): boolean {
  return todasLasActuaciones.some(
    (a) =>
      a.actuacionAnteriorId === actuacion.actuacionId &&
      a.estadoActuacion !== "DESISTIDA" &&
      a.estadoActuacion !== "ANULADA" &&
      a.estadoActuacion !== "NO_RENOVADO"
  );
}

export interface HuecoCobertura {
  dias: number;
  desde: string; // vencimiento efectivo de la actuación anterior
  hasta: string; // fecha_inicio de la siguiente
}

/**
 * C6 — Hueco de cobertura: días sin contrato entre el vencimiento efectivo
 * de una actuación y el inicio de la siguiente (con y sin LA: el llamador
 * decide si pasa el CONTRATO sucesor directo o el que sigue al LA).
 */
export function huecoCobertura(
  actuacionAnterior: Actuacion,
  actuacionSiguiente: Actuacion,
  todasLasActuaciones: Actuacion[]
): HuecoCobertura | undefined {
  const venc = vencimientoEfectivo(actuacionAnterior, todasLasActuaciones);
  if (!venc || !actuacionSiguiente.fechaInicio) return undefined;
  const dias = diferenciaDias(venc, actuacionSiguiente.fechaInicio) - 1; // el día del vencimiento no es "hueco" todavía
  return { dias: Math.max(dias, 0), desde: venc, hasta: actuacionSiguiente.fechaInicio };
}
