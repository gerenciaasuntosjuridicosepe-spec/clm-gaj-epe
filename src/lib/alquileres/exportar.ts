/**
 * Exportaciones de reportes (RP-01 a RP-12, PRD v2.1 sección 4: "XLSX y CSV
 * generados en el servidor; PDF mediante la impresión del navegador").
 *
 * Solo CSV, no un .xlsx binario real: se evaluó instalar el paquete `xlsx`
 * (SheetJS) para generar el binario real, y se descartó — tiene dos
 * vulnerabilidades de severidad alta sin parche disponible (Prototype
 * Pollution, ReDoS; `npm audit`, 2026-10-02). Aunque el uso previsto acá es
 * solo ESCRIBIR desde datos propios (nunca parsear un .xlsx ajeno, que es
 * el vector real de esas vulnerabilidades), se prefirió no cargar una
 * dependencia de runtime con vulnerabilidades sin arreglo por un beneficio
 * menor: CSV con BOM UTF-8 abre perfectamente en Excel y Google Sheets,
 * que es el uso real que le va a dar GAJ. Ver `docs/DECISIONES.md`.
 */
import { neutralizarFormula } from "./reglas/validaciones";

export interface ColumnaExport<T> {
  clave: keyof T;
  titulo: string;
}

function celdaATexto(valor: unknown): string {
  if (valor === undefined || valor === null) return "";
  if (typeof valor === "boolean") return valor ? "TRUE" : "FALSE";
  return String(valor);
}

/** Escapa una celda para CSV (RFC 4180: comillas dobles si tiene coma, comilla o salto de línea) y neutraliza fórmulas (T13/NF-S4 — un CSV abierto en Excel es tan vulnerable a esto como una celda de Sheets). */
function escaparCeldaCsv(valor: unknown): string {
  const texto = neutralizarFormula(celdaATexto(valor));
  if (/[",\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

/** Arma un CSV (con BOM UTF-8, para que Excel no rompa los acentos) a partir de filas y columnas con título. */
export function aCsv<T>(filas: T[], columnas: ColumnaExport<T>[]): string {
  const BOM_UTF8 = "﻿";
  const encabezado = columnas.map((c) => escaparCeldaCsv(c.titulo)).join(",");
  const cuerpo = filas.map((fila) => columnas.map((c) => escaparCeldaCsv(fila[c.clave])).join(","));
  return BOM_UTF8 + [encabezado, ...cuerpo].join("\r\n") + "\r\n";
}
