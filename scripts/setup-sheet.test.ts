import { describe, expect, it } from "vitest";
import { HOJAS } from "./setup-sheet.mjs";
import {
  SHEET_NAMES,
  CONTRATOS_COLUMNS,
  HISTORIAL_COLUMNS,
  HITOS_COLUMNS,
  ANOTACIONES_COLUMNS,
  GARANTIAS_COLUMNS,
  SECTORES_COLUMNS,
  TIPOS_CONTRATO_COLUMNS,
  TIPOS_ANOTACION_COLUMNS,
  TIPOS_GARANTIA_COLUMNS,
  USUARIOS_COLUMNS,
} from "../src/lib/data/sheets-schema";

/**
 * F0-2: el script de creación de la planilla del CLM (scripts/setup-sheet.mjs)
 * debe importar el esquema de src/lib/data/sheets-schema.ts, no duplicarlo a
 * mano — esta prueba compara los encabezados que el script va a escribir
 * contra el esquema real que usa la app para leer/escribir, y falla si
 * alguna vez vuelven a divergir (como pasaba con "link_texto_final" y
 * "link_pdf", dos columnas que el script creaba y el esquema no conocía).
 */
describe("setup-sheet.mjs — coherencia de columnas con sheets-schema.ts (F0-2)", () => {
  it("usa exactamente los mismos nombres de hoja que SHEET_NAMES", () => {
    expect(Object.keys(HOJAS).sort()).toEqual(Object.values(SHEET_NAMES).sort());
  });

  it("Contratos: mismas columnas, mismo orden, que CONTRATOS_COLUMNS", () => {
    expect(HOJAS[SHEET_NAMES.contratos]).toEqual(CONTRATOS_COLUMNS.map((c) => c.header));
  });

  it.each([
    [SHEET_NAMES.historial, HISTORIAL_COLUMNS],
    [SHEET_NAMES.hitos, HITOS_COLUMNS],
    [SHEET_NAMES.anotaciones, ANOTACIONES_COLUMNS],
    [SHEET_NAMES.garantias, GARANTIAS_COLUMNS],
    [SHEET_NAMES.sectores, SECTORES_COLUMNS],
    [SHEET_NAMES.tiposContrato, TIPOS_CONTRATO_COLUMNS],
    [SHEET_NAMES.tiposAnotacion, TIPOS_ANOTACION_COLUMNS],
    [SHEET_NAMES.tiposGarantia, TIPOS_GARANTIA_COLUMNS],
    [SHEET_NAMES.usuarios, USUARIOS_COLUMNS],
  ])("%s: mismas columnas que el esquema", (hoja, columnasEsquema) => {
    expect(HOJAS[hoja as keyof typeof HOJAS]).toEqual([...columnasEsquema]);
  });

  it("regresión F0-2: no reaparecen columnas fantasma (link_texto_final, link_pdf)", () => {
    const todasLasColumnas = Object.values(HOJAS).flat();
    expect(todasLasColumnas).not.toContain("link_texto_final");
    expect(todasLasColumnas).not.toContain("link_pdf");
  });
});
