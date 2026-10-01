/**
 * R17 — Al cambiar el tipo de una actuación de CONTRATO a ADENDA o
 * LEGITIMO_ABONO, los hitos ya CUMPLIDOS se conservan tal cual y los
 * PENDIENTES pasan a NO_APLICA con la observación "cambio de tipo" (RF-14).
 */
import type { ActuacionHito } from "../tipos";

const OBSERVACION_CAMBIO_TIPO = "cambio de tipo";

/** Aplica R17 sobre los hitos de una actuación que cambia de tipo. Devuelve una copia nueva (no muta el array recibido). */
export function aplicarCambioTipoActuacion(hitos: ActuacionHito[]): ActuacionHito[] {
  return hitos.map((h) =>
    h.estadoHito === "PENDIENTE"
      ? { ...h, estadoHito: "NO_APLICA", observaciones: OBSERVACION_CAMBIO_TIPO }
      : h
  );
}

/** Cantidad de hitos que R17 va a pasar a NO_APLICA — para avisar al usuario antes de confirmar (RF-14). */
export function contarHitosQuePasaranANoAplica(hitos: ActuacionHito[]): number {
  return hitos.filter((h) => h.estadoHito === "PENDIENTE").length;
}
