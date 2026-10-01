/**
 * R15 — Vencimiento efectivo = mayor `fecha_fin` entre el CONTRATO y sus
 * ADENDAS no anuladas. Es el dato que vigilan alertas (A1, A5) y dashboard.
 *
 * Una ADENDA "cuelga" de su CONTRATO vía `actuacion_anterior_id` (R3') y
 * nunca entra en la cadena de renovaciones — por eso esta función recibe el
 * contrato y la lista de TODAS las actuaciones (para encontrar sus adendas),
 * no una lista ya filtrada.
 */
import type { Actuacion } from "../tipos";

/**
 * @param contrato La actuación CONTRATO cuyo vencimiento efectivo se calcula.
 * @param todasLasActuaciones Todas las actuaciones del mismo inmueble (o del sistema — se filtra internamente).
 * @returns La fecha "yyyy-mm-dd" del vencimiento efectivo, o `undefined` si el contrato no tiene `fecha_fin` (ej. todavía no formalizado).
 */
export function vencimientoEfectivo(contrato: Actuacion, todasLasActuaciones: Actuacion[]): string | undefined {
  if (contrato.tipoActuacion !== "CONTRATO") {
    throw new Error("vencimientoEfectivo solo se calcula sobre actuaciones de tipo CONTRATO");
  }

  const adendasNoAnuladas = todasLasActuaciones.filter(
    (a) =>
      a.tipoActuacion === "ADENDA" &&
      a.actuacionAnteriorId === contrato.actuacionId &&
      a.estadoActuacion !== "ANULADA" &&
      a.fechaFin
  );

  const fechas = [contrato.fechaFin, ...adendasNoAnuladas.map((a) => a.fechaFin)].filter(
    (f): f is string => Boolean(f)
  );

  if (fechas.length === 0) return undefined;
  // Comparación lexicográfica de "yyyy-mm-dd" es correcta (mismo largo, orden = orden cronológico).
  return fechas.reduce((mayor, actual) => (actual > mayor ? actual : mayor));
}
