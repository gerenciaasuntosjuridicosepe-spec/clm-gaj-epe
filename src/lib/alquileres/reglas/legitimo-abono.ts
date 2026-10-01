/**
 * D15 / M18 — Legítimo abono: se guarda el canon MENSUAL (`canon_inicial`,
 * igual que en un CONTRATO) y, además, el monto total reconocido
 * (`monto_total_reconocido`) que figura en el acto administrativo. RP-05
 * marca la diferencia cuando el total reconocido no coincide con
 * meses_del_período × mensual (T28) — puede pasar porque el acto
 * administrativo reconoce un monto distinto (por ejemplo, con un ajuste).
 */
import { parsearFecha } from "../fechas";
import type { Actuacion } from "../tipos";

/** Cantidad de meses calendario cubiertos por un período inicio..fin (ambos inclusive, asume meses completos). */
export function mesesDelPeriodo(fechaInicio: string, fechaFin: string): number {
  const inicio = parsearFecha(fechaInicio);
  const fin = parsearFecha(fechaFin);
  if (!inicio || !fin) throw new Error("Fechas inválidas en mesesDelPeriodo");
  return (fin.anio - inicio.anio) * 12 + (fin.mes - inicio.mes) + 1;
}

export interface DiferenciaMontoReconocido {
  mesesDelPeriodo: number;
  montoEsperado: number;
  montoDeclarado: number;
  difiere: boolean;
}

/**
 * T28: compara `monto_total_reconocido` contra meses_del_período ×
 * canon_inicial (mensual). Si no hay `monto_total_reconocido` informado,
 * no hay nada que comparar (es opcional, M18).
 */
export function diferenciaMontoReconocido(
  legitimoAbono: Pick<Actuacion, "fechaInicio" | "fechaFin" | "canonInicial" | "montoTotalReconocido">
): DiferenciaMontoReconocido | undefined {
  const { fechaInicio, fechaFin, canonInicial, montoTotalReconocido } = legitimoAbono;
  if (!fechaInicio || !fechaFin || canonInicial === undefined || montoTotalReconocido === undefined) {
    return undefined;
  }
  const meses = mesesDelPeriodo(fechaInicio, fechaFin);
  const montoEsperado = meses * canonInicial;
  return {
    mesesDelPeriodo: meses,
    montoEsperado,
    montoDeclarado: montoTotalReconocido,
    difiere: montoEsperado !== montoTotalReconocido,
  };
}
