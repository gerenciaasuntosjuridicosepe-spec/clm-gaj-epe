/**
 * RF-21 — Reprogramar un hito y marcar NO_APLICA. Reprogramar marca
 * `reprogramada = TRUE` (R13: a partir de ahí, nadie vuelve a recalcular
 * su `fecha_prevista` automáticamente) y pide motivo; NO_APLICA también
 * pide motivo. Ambas son funciones puras sobre un solo hito — la ruta que
 * las usa es la que decide si además hay que recalcular R14 (en general
 * no: reprogramar o marcar NO_APLICA un hito que no es H-01/H-05/H-15/H-20
 * no cambia el estado derivado de la actuación).
 */
import type { ActuacionHito } from "../tipos";

type HitoParcial = Pick<ActuacionHito, "hitoId" | "estadoHito" | "fechaPrevista" | "reprogramada" | "observaciones">;

export interface ResultadoAccionHito {
  valido: boolean;
  error?: string;
  hitoActualizado?: HitoParcial;
}

/** RF-21: reprogramar — exige motivo y una fecha prevista nueva; marca reprogramada=TRUE para que R13 deje de recalcularlo solo. */
export function reprogramarHito(hito: HitoParcial, nuevaFechaPrevista: string, motivo: string): ResultadoAccionHito {
  if (!motivo?.trim()) {
    return { valido: false, error: "Reprogramar un hito exige un motivo (RF-21)." };
  }
  if (!nuevaFechaPrevista?.trim()) {
    return { valido: false, error: "Reprogramar un hito exige la nueva fecha prevista." };
  }
  if (hito.estadoHito === "CUMPLIDO") {
    return { valido: false, error: "No se puede reprogramar un hito ya cumplido." };
  }
  return {
    valido: true,
    hitoActualizado: { ...hito, fechaPrevista: nuevaFechaPrevista, reprogramada: true, observaciones: motivo.trim() },
  };
}

/** RF-21: marcar NO_APLICA — exige motivo. */
export function marcarHitoNoAplica(hito: HitoParcial, motivo: string): ResultadoAccionHito {
  if (!motivo?.trim()) {
    return { valido: false, error: "Marcar un hito como NO_APLICA exige un motivo (RF-21)." };
  }
  if (hito.estadoHito === "CUMPLIDO") {
    return { valido: false, error: "No se puede marcar NO_APLICA un hito ya cumplido." };
  }
  return {
    valido: true,
    hitoActualizado: { ...hito, estadoHito: "NO_APLICA", observaciones: motivo.trim() },
  };
}
