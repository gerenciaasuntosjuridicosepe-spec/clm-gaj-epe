/**
 * R19 — Canon vigente de un contrato con adendas = `canon_inicial` de la
 * actuación más reciente (por `fecha_inicio`, no anulada) que lo informe,
 * entre el contrato y sus adendas. Siempre se rotula "canon inicial
 * informado", nunca "canon actual" (el canon guardado es el inicial, no el
 * actualizado por ICL u otra regla — riesgo documentado en el PRD v1,
 * sección 12).
 */
import type { Actuacion } from "../tipos";

export function canonVigente(contrato: Actuacion, todasLasActuaciones: Actuacion[]): number | undefined {
  if (contrato.tipoActuacion !== "CONTRATO") {
    throw new Error("canonVigente solo se calcula sobre actuaciones de tipo CONTRATO");
  }

  const adendasNoAnuladas = todasLasActuaciones.filter(
    (a) => a.tipoActuacion === "ADENDA" && a.actuacionAnteriorId === contrato.actuacionId && a.estadoActuacion !== "ANULADA"
  );

  const candidatos = [contrato, ...adendasNoAnuladas].filter(
    (a) => a.canonInicial !== undefined && a.fechaInicio !== undefined
  );

  if (candidatos.length === 0) return undefined;

  const masReciente = candidatos.reduce((acc, actual) => (actual.fechaInicio! > acc.fechaInicio! ? actual : acc));
  return masReciente.canonInicial;
}
