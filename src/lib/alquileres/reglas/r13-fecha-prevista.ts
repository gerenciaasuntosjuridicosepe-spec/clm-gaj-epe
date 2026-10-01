/**
 * R13 — Cálculo de fechas previstas de hitos.
 *
 *  - Plazo en MESES: fecha calendario (EDATE).
 *  - Plazo en DIAS con HABILES: días de lunes a viernes que no estén en
 *    FERIADOS activos; el día de referencia es el día 0 (no cuenta).
 *  - DESPUES_HITO usa la `fecha_cumplimiento` del hito de referencia y, si
 *    todavía no se cumplió, su `fecha_prevista`.
 *  - R7' [CAMBIO]: los plazos ANTES_FIN_CONTRATO se cuentan desde el
 *    vencimiento efectivo (R15) del último CONTRATO de la cadena (salta el
 *    LEGITIMO_ABONO — ya lo hace vencimientoEfectivo() de R15, que solo
 *    opera sobre CONTRATO + sus ADENDAS).
 *  - Si el año no tiene feriados cargados, se calcula solo con fines de
 *    semana y se marca "cómputo aproximado" (delegado a fechas.ts).
 *
 * Esta función NO decide si corresponde recalcular (eso es responsabilidad
 * del llamador / servicio: "se recalcula al cumplirse o reprogramarse el
 * hito de referencia, o al cambiar el vencimiento efectivo, salvo
 * reprogramada = TRUE" — si `reprogramada` es true, el servicio no debe
 * llamar a esta función para sobreescribir `fecha_prevista`).
 */
import { sumarDiasCorridos, sumarDiasHabiles, sumarMeses } from "../fechas";
import type { CfgHitoTipo, Feriado } from "../tipos";

export interface ContextoFechaPrevista {
  /** R15 — requerido si cfg.referencia === "ANTES_FIN_CONTRATO". */
  vencimientoEfectivo?: string;
  /** Fecha efectiva del hito de referencia (fecha_cumplimiento si ya se cumplió, si no fecha_prevista) — requerido si cfg.referencia === "DESPUES_HITO". */
  fechaHitoReferencia?: string;
}

export interface ResultadoFechaPrevista {
  fecha?: string;
  aproximado: boolean;
}

export function calcularFechaPrevista(
  cfg: Pick<CfgHitoTipo, "plazoValor" | "plazoUnidad" | "computoDias" | "referencia">,
  contexto: ContextoFechaPrevista,
  feriados: Pick<Feriado, "fecha" | "activo">[]
): ResultadoFechaPrevista {
  // Hitos sin plazo configurado (H-05/H-15/H-20 en la semilla actual): se cumplen a mano, sin fecha prevista.
  if (cfg.plazoValor === undefined || !cfg.plazoUnidad || !cfg.referencia) {
    return { fecha: undefined, aproximado: false };
  }

  if (cfg.referencia === "ANTES_FIN_CONTRATO") {
    if (!contexto.vencimientoEfectivo) return { fecha: undefined, aproximado: false };
    if (cfg.plazoUnidad === "MESES") {
      return { fecha: sumarMeses(contexto.vencimientoEfectivo, -cfg.plazoValor), aproximado: false };
    }
    // DIAS restando desde el vencimiento efectivo hacia atrás: no hay caso
    // de uso en el PRD (H-01 y H-04 son siempre MESES) — se deja explícito
    // en vez de implementar una resta de días hábiles hacia atrás sin un
    // caso real que la valide.
    throw new Error("ANTES_FIN_CONTRATO con plazo en DIAS no está definido en ningún PRD — no implementado a propósito.");
  }

  // DESPUES_HITO
  if (!contexto.fechaHitoReferencia) return { fecha: undefined, aproximado: false };

  if (cfg.plazoUnidad === "MESES") {
    return { fecha: sumarMeses(contexto.fechaHitoReferencia, cfg.plazoValor), aproximado: false };
  }

  // DIAS
  if (cfg.computoDias === "CORRIDOS") {
    return { fecha: sumarDiasCorridos(contexto.fechaHitoReferencia, cfg.plazoValor), aproximado: false };
  }
  // HABILES (incluye el caso "computoDias" no informado — H-02/H-21/H-03 siempre lo traen).
  return sumarDiasHabiles(contexto.fechaHitoReferencia, cfg.plazoValor, feriados);
}
