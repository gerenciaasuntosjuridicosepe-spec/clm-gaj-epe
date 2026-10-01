/**
 * R3' — Cadena de actuaciones por tipo (`actuacion_anterior_id`):
 *  - CONTRATO: vacío (primero del inmueble) o apunta a un CONTRATO o
 *    LEGITIMO_ABONO del mismo inmueble.
 *  - ADENDA: obligatorio, apunta al CONTRATO que modifica. Ninguna
 *    actuación puede tomar una ADENDA como anterior (las adendas no entran
 *    en la cadena de renovaciones, "cuelgan" de su contrato).
 *  - LEGITIMO_ABONO: obligatorio, apunta al CONTRATO cuyo vencimiento
 *    originó el período.
 *  - Mismo inmueble siempre, sin ciclos.
 *
 * R3a — Insertar un legítimo abono entre un contrato vencido (A) y su
 * renovación en trámite (B), de forma atómica: `LA.anterior = A`,
 * `B.anterior = LA` (cadena A → LA → B).
 */
import type { Actuacion } from "../tipos";

interface ResultadoValidacion {
  valida: boolean;
  error?: string;
}

function buscarPorId(actuaciones: Actuacion[], id: string): Actuacion | undefined {
  return actuaciones.find((a) => a.actuacionId === id);
}

/** Recorre la cadena desde `desdeId` siguiendo `actuacionAnteriorId`; true si se vuelve a pasar por el mismo id (ciclo). */
function tieneCiclo(desdeId: string, actuaciones: Actuacion[]): boolean {
  const visitados = new Set<string>();
  let actual: string | undefined = desdeId;
  while (actual) {
    if (visitados.has(actual)) return true;
    visitados.add(actual);
    actual = buscarPorId(actuaciones, actual)?.actuacionAnteriorId;
  }
  return false;
}

/**
 * Valida R3' para una actuación (nueva o editada). `actuaciones` debe
 * incluir a la propia actuación si ya existe (para la detección de ciclos).
 */
export function validarCadenaActuacion(actuacion: Actuacion, actuaciones: Actuacion[]): ResultadoValidacion {
  const { tipoActuacion, actuacionAnteriorId, inmuebleId, actuacionId } = actuacion;

  if (tipoActuacion === "CONTRATO") {
    if (!actuacionAnteriorId) return { valida: true }; // primero del inmueble
    const anterior = buscarPorId(actuaciones, actuacionAnteriorId);
    if (!anterior) return { valida: false, error: "actuacion_anterior_id no existe." };
    if (anterior.tipoActuacion !== "CONTRATO" && anterior.tipoActuacion !== "LEGITIMO_ABONO") {
      return {
        valida: false,
        error: "Un CONTRATO solo puede apuntar a un CONTRATO o LEGITIMO_ABONO anterior (R3').",
      };
    }
    if (anterior.inmuebleId !== inmuebleId) {
      return { valida: false, error: "La actuación anterior debe ser del mismo inmueble (R3')." };
    }
  } else if (tipoActuacion === "ADENDA") {
    if (!actuacionAnteriorId) {
      return { valida: false, error: "ADENDA exige actuacion_anterior_id (el CONTRATO que modifica)." };
    }
    const anterior = buscarPorId(actuaciones, actuacionAnteriorId);
    if (!anterior) return { valida: false, error: "actuacion_anterior_id no existe." };
    if (anterior.tipoActuacion !== "CONTRATO") {
      return { valida: false, error: "Una ADENDA solo puede apuntar al CONTRATO que modifica (R3')." };
    }
    if (anterior.inmuebleId !== inmuebleId) {
      return { valida: false, error: "La actuación anterior debe ser del mismo inmueble (R3')." };
    }
  } else if (tipoActuacion === "LEGITIMO_ABONO") {
    if (!actuacionAnteriorId) {
      return {
        valida: false,
        error: "LEGITIMO_ABONO exige actuacion_anterior_id (el CONTRATO cuyo vencimiento originó el período).",
      };
    }
    const anterior = buscarPorId(actuaciones, actuacionAnteriorId);
    if (!anterior) return { valida: false, error: "actuacion_anterior_id no existe." };
    if (anterior.tipoActuacion !== "CONTRATO") {
      return { valida: false, error: "LEGITIMO_ABONO solo puede apuntar a un CONTRATO anterior (R3')." };
    }
    if (anterior.inmuebleId !== inmuebleId) {
      return { valida: false, error: "La actuación anterior debe ser del mismo inmueble (R3')." };
    }
  }

  // Regla general, válida para los tres tipos: nunca se puede tomar una
  // ADENDA como anterior (ya cubierto arriba para ADENDA/LEGITIMO_ABONO,
  // pero CONTRATO también lo tiene prohibido implícitamente por el chequeo
  // de tipo de arriba). Queda esta verificación explícita por claridad y
  // como red de seguridad si se agregan tipos nuevos en el futuro.
  if (actuacionAnteriorId) {
    const anterior = buscarPorId(actuaciones, actuacionAnteriorId);
    if (anterior?.tipoActuacion === "ADENDA") {
      return { valida: false, error: "Ninguna actuación puede tomar una ADENDA como anterior (R3')." };
    }
  }

  const conSimulacion = actuaciones.some((a) => a.actuacionId === actuacionId)
    ? actuaciones.map((a) => (a.actuacionId === actuacionId ? actuacion : a))
    : [...actuaciones, actuacion];
  if (tieneCiclo(actuacionId, conSimulacion)) {
    return { valida: false, error: "La cadena de actuaciones no puede tener ciclos (R3')." };
  }

  return { valida: true };
}

export interface InsercionLegitimoAbono {
  contratoAActualizado: Actuacion; // sin cambios, se devuelve para que el llamador escriba el lote completo si quiere
  legitimoAbonoActualizado: Actuacion;
  renovacionBActualizada: Actuacion;
}

/**
 * R3a — Calcula las actualizaciones necesarias para insertar un LEGITIMO_ABONO
 * entre un contrato vencido (A) y su renovación en trámite (B) que ya
 * apuntaba a A: `LA.anterior = A`, `B.anterior = LA`. Es una función pura:
 * no escribe nada — el repositorio aplica las dos actualizaciones (la del
 * LA y la de B) en una única llamada atómica (`batchUpdate`, prueba d).
 */
export function insertarLegitimoAbonoEnCadena(
  contratoA: Actuacion,
  legitimoAbono: Actuacion,
  renovacionB: Actuacion
): InsercionLegitimoAbono {
  if (legitimoAbono.tipoActuacion !== "LEGITIMO_ABONO") {
    throw new Error("insertarLegitimoAbonoEnCadena espera una actuación de tipo LEGITIMO_ABONO");
  }
  if (renovacionB.actuacionAnteriorId !== contratoA.actuacionId) {
    throw new Error("La renovación B no apuntaba al contrato A — no hay nada que reinsertar");
  }
  return {
    contratoAActualizado: contratoA,
    legitimoAbonoActualizado: { ...legitimoAbono, actuacionAnteriorId: contratoA.actuacionId },
    renovacionBActualizada: { ...renovacionB, actuacionAnteriorId: legitimoAbono.actuacionId },
  };
}
