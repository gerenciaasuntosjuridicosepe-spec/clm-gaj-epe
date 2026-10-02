/**
 * RF-20 — Registrar el cumplimiento de un hito: acepta fecha de hoy o
 * anterior (nunca futura), guarda `referencia`, y recalcula las fechas
 * previstas de los hitos que dependen de este (R13: "se recalcula al
 * cumplirse... el hito de referencia... salvo reprogramada = TRUE").
 *
 * El recálculo de ESTADO de la actuación (R14) es responsabilidad de quien
 * llama a esto (el servicio/ruta tiene el resto de los hitos y el contexto
 * de la actuación) — esta función solo toca la tabla ACTUACION_HITOS.
 */
import { calcularFechaPrevista } from "./r13-fecha-prevista";
import type { ActuacionHito, CfgHitoTipo, Feriado } from "../tipos";

type HitoParcial = Pick<ActuacionHito, "hitoId" | "estadoHito" | "fechaPrevista" | "fechaCumplimiento" | "reprogramada" | "referencia">;

export interface ParametrosCumplirHito {
  /** Todos los hitos de la actuación (se necesitan para recalcular los que dependen del que se cumple). */
  hitos: HitoParcial[];
  hitoId: string;
  fechaCumplimiento: string;
  referencia?: string;
  /** Config de hitos de la actuación (ej. CFG_HITOS_TIPO_SEED filtrado por tipoActuacion). */
  cfgHitosTipo: Pick<CfgHitoTipo, "hitoId" | "plazoValor" | "plazoUnidad" | "computoDias" | "referencia" | "hitoReferenciaId">[];
  feriados: Pick<Feriado, "fecha" | "activo">[];
  hoy: string;
}

export interface ResultadoCumplirHito {
  valido: boolean;
  error?: string;
  /** Solo los hitos que cambiaron (el cumplido + los recalculados) — para no reescribir los que no cambiaron. */
  hitosActualizados: HitoParcial[];
}

export function marcarHitoCumplido(params: ParametrosCumplirHito): ResultadoCumplirHito {
  const { hitos, hitoId, fechaCumplimiento, referencia, cfgHitosTipo, feriados, hoy } = params;

  if (fechaCumplimiento > hoy) {
    return { valido: false, error: "La fecha de cumplimiento no puede ser futura (RF-20).", hitosActualizados: [] };
  }

  const hito = hitos.find((h) => h.hitoId === hitoId);
  if (!hito) {
    return { valido: false, error: `No existe el hito ${hitoId} en esta actuación.`, hitosActualizados: [] };
  }

  const hitoCumplido: HitoParcial = { ...hito, estadoHito: "CUMPLIDO", fechaCumplimiento, referencia };
  const actualizados: HitoParcial[] = [hitoCumplido];

  // Recalcula los hitos DESPUES_HITO que dependen de este, salvo que estén reprogramados a mano.
  for (const cfg of cfgHitosTipo) {
    if (cfg.referencia !== "DESPUES_HITO" || cfg.hitoReferenciaId !== hitoId) continue;
    const dependiente = hitos.find((h) => h.hitoId === cfg.hitoId);
    if (!dependiente || dependiente.reprogramada) continue; // reprogramada=TRUE: no se recalcula (R13)
    if (dependiente.estadoHito === "CUMPLIDO") continue; // ya cumplido, no se recalcula hacia atrás

    const { fecha } = calcularFechaPrevista(cfg, { fechaHitoReferencia: fechaCumplimiento }, feriados);
    actualizados.push({ ...dependiente, fechaPrevista: fecha });
  }

  return { valido: true, hitosActualizados: actualizados };
}
