/**
 * R14 — Estado derivado de los hitos (solo CONTRATO):
 *   PENDIENTE_AVISO al crear
 *   AVISO_ENVIADO con H-01 cumplido
 *   EN_TRAMITE con expediente asignado y H-05 cumplido
 *   FORMALIZADA con H-15 cumplido (si R4' lo permite)
 *   CERRADA con H-20 cumplido
 * Si se borra una fecha de cumplimiento, el estado retrocede — por eso esta
 * función es una recomputación pura desde el estado actual de los hitos,
 * sin memoria de "cómo se llegó" ahí.
 *
 * DESISTIDA, NO_RENOVADO y ANULADA se marcan a mano con `motivo_estado`;
 * esta función NO los calcula — el llamador debe chequear
 * `esEstadoManual(estadoActual)` ANTES de invocarla y, si es un estado
 * manual, no sobreescribirlo (solo un ADMINISTRADOR los reabre, fuera del
 * alcance de esta función pura — ver permisos).
 *
 * ADENDA y LEGITIMO_ABONO no tienen hitos: usan EN_TRAMITE, FORMALIZADA,
 * CERRADA y ANULADA cargados a mano (no pasan por esta función).
 */
import type { EstadoActuacion } from "../tipos";

export const ESTADOS_MANUALES: EstadoActuacion[] = ["DESISTIDA", "NO_RENOVADO", "ANULADA"];

export function esEstadoManual(estado: EstadoActuacion): boolean {
  return ESTADOS_MANUALES.includes(estado);
}

export interface InsumosEstadoDerivado {
  tieneExpedienteAsignado: boolean;
  h01Cumplido: boolean;
  h05Cumplido: boolean;
  h15Cumplido: boolean;
  h20Cumplido: boolean;
  /** Resultado de R4' (validarObligatoriosFormalizacion) — sin esto, no pasa a FORMALIZADA aunque H-15 esté cumplido. */
  puedeFormalizar: boolean;
}

/** Calcula el estado derivado de un CONTRATO según sus hitos — ver reglas arriba. */
export function calcularEstadoDerivado(insumos: InsumosEstadoDerivado): EstadoActuacion {
  if (insumos.h20Cumplido) return "CERRADA";
  if (insumos.h15Cumplido && insumos.puedeFormalizar) return "FORMALIZADA";
  if (insumos.tieneExpedienteAsignado && insumos.h05Cumplido) return "EN_TRAMITE";
  if (insumos.h01Cumplido) return "AVISO_ENVIADO";
  return "PENDIENTE_AVISO";
}
