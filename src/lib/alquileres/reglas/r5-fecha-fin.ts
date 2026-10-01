/**
 * R5 — `fecha_fin` por defecto = `fecha_inicio` + `plazo_meses` − 1 día;
 * editable a mano, pero corregirla exige un motivo en `observaciones`.
 */
import { sumarDiasCorridos, sumarMeses } from "../fechas";

/** T2: inicio 01/04/2026 + 24 meses → fecha_fin propuesta 31/03/2028. */
export function fechaFinPorDefecto(fechaInicio: string, plazoMeses: number): string {
  if (plazoMeses <= 0) throw new Error("plazo_meses debe ser un entero mayor que 0");
  return sumarDiasCorridos(sumarMeses(fechaInicio, plazoMeses), -1);
}

export interface ResultadoValidacionFechaFin {
  valida: boolean;
  error?: string;
}

/**
 * Valida una `fecha_fin` provista a mano: debe ser >= fecha_inicio, y si no
 * coincide con la propuesta por defecto, exige un motivo no vacío en
 * `observaciones` (R5).
 */
export function validarFechaFinManual(
  fechaInicio: string,
  plazoMeses: number,
  fechaFinPropuesta: string,
  observaciones: string | undefined
): ResultadoValidacionFechaFin {
  if (fechaFinPropuesta < fechaInicio) {
    return { valida: false, error: "fecha_fin debe ser mayor o igual que fecha_inicio" };
  }
  const porDefecto = fechaFinPorDefecto(fechaInicio, plazoMeses);
  if (fechaFinPropuesta !== porDefecto && !observaciones?.trim()) {
    return {
      valida: false,
      error: "Corregir fecha_fin del valor por defecto exige un motivo en observaciones (R5).",
    };
  }
  return { valida: true };
}
