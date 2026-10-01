/**
 * R16 — Canon neto de IVA para análisis.
 *
 * SIN_IVA y MAS_IVA: el canon ya es neto. IVA_INCLUIDO: se divide por
 * 1 + alicuota_iva/100. Sin condición informada: el contrato queda fuera de
 * los totales y se cuenta aparte como "sin dato de IVA".
 *
 *   canon_neto = canon_inicial / (1 + alicuota_iva / 100)   [IVA_INCLUIDO]
 */
import type { CondicionIvaCanon } from "../tipos";

export type ResultadoCanonNeto = { incluido: true; neto: number } | { incluido: false };

export function canonNeto(
  canonInicial: number | undefined,
  condicionIvaCanon: CondicionIvaCanon | undefined,
  alicuotaIva: number
): ResultadoCanonNeto {
  if (canonInicial === undefined || condicionIvaCanon === undefined) {
    return { incluido: false }; // "sin dato de IVA" — queda fuera de los totales
  }
  if (condicionIvaCanon === "SIN_IVA" || condicionIvaCanon === "MAS_IVA") {
    return { incluido: true, neto: canonInicial };
  }
  // IVA_INCLUIDO
  return { incluido: true, neto: canonInicial / (1 + alicuotaIva / 100) };
}

/**
 * Suma el canon neto de una lista de contratos, separando los que no tienen
 * condición de IVA informada (se cuentan pero no se suman) — usado por el
 * dashboard (indicador "Canon mensual inicial informado, neto de IVA").
 */
export function totalCanonNeto(
  contratos: { canonInicial?: number; condicionIvaCanon?: CondicionIvaCanon }[],
  alicuotaIva: number
): { total: number; sinDatoIva: number } {
  let total = 0;
  let sinDatoIva = 0;
  for (const c of contratos) {
    const r = canonNeto(c.canonInicial, c.condicionIvaCanon, alicuotaIva);
    if (r.incluido) total += r.neto;
    else sinDatoIva += 1;
  }
  return { total, sinDatoIva };
}
