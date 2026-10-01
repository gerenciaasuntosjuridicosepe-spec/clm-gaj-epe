/**
 * R8 — Al menos un TITULAR y un FIRMANTE para CONTRATO y ADENDA. (El
 * LEGITIMO_ABONO no tiene partes propias — RF-10/DICCIONARIO no lo exige.)
 */
import type { ActuacionParte, TipoActuacion } from "../tipos";

export interface ResultadoValidacion {
  valida: boolean;
  error?: string;
}

export function validarPartesMinimas(tipoActuacion: TipoActuacion, partes: Pick<ActuacionParte, "rolParte" | "activo">[]): ResultadoValidacion {
  if (tipoActuacion === "LEGITIMO_ABONO") return { valida: true };

  const activas = partes.filter((p) => p.activo);
  const tieneTitular = activas.some((p) => p.rolParte === "TITULAR");
  const tieneFirmante = activas.some((p) => p.rolParte === "FIRMANTE");

  if (!tieneTitular && !tieneFirmante) {
    return { valida: false, error: "Falta al menos un titular y un firmante (R8)." };
  }
  if (!tieneTitular) return { valida: false, error: "Falta al menos un titular (R8)." };
  if (!tieneFirmante) return { valida: false, error: "Falta al menos un firmante (R8)." };
  return { valida: true };
}
