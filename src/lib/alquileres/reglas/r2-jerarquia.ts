/**
 * R2 — Un expediente pertenece a un solo inmueble; una actuación solo se
 * vincula a expedientes del mismo inmueble que ella.
 */
import type { Expediente } from "../tipos";

export interface ResultadoValidacion {
  valida: boolean;
  error?: string;
}

/** RF-08: rechaza vincular una actuación a un expediente de otro inmueble. */
export function validarVinculoActuacionExpediente(
  inmuebleIdActuacion: string,
  expediente: Expediente | undefined
): ResultadoValidacion {
  if (!expediente) return { valida: true }; // la actuación puede existir sin expediente (aviso a 4 meses)
  if (expediente.inmuebleId !== inmuebleIdActuacion) {
    return {
      valida: false,
      error: "El expediente pertenece a otro inmueble — una actuación solo puede vincularse a expedientes de su propio inmueble (R2).",
    };
  }
  return { valida: true };
}
