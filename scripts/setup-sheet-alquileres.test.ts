import { describe, expect, it } from "vitest";
import { HOJAS, HOJAS_SECUENCIA } from "./setup-sheet-alquileres.mjs";
import { ESQUEMA_TABLAS, SEQ_SHEET_NAMES, SHEET_NAMES } from "../src/lib/alquileres/esquema";
import { PREFIJOS_ID } from "../src/lib/alquileres/tipos";

/**
 * T21 — "Comparación de encabezados del script de creación contra el
 * esquema. Idénticos." Mismo patrón que `scripts/setup-sheet.test.ts`
 * (F0-2 del CLM): el script de Alquileres importa las columnas desde
 * `src/lib/alquileres/esquema.ts` en vez de duplicarlas a mano, así que no
 * puede desincronizarse — esta prueba lo confirma y queda como regresión.
 */
describe("setup-sheet-alquileres.mjs — coherencia de columnas con esquema.ts (T21)", () => {
  it("usa exactamente los mismos nombres de hoja de datos que SHEET_NAMES", () => {
    expect(Object.keys(HOJAS).sort()).toEqual(Object.values(SHEET_NAMES).sort());
  });

  it.each(Object.entries(ESQUEMA_TABLAS))("%s: mismas columnas, mismo orden, que ESQUEMA_TABLAS", (_clave, def) => {
    expect(HOJAS[def.sheet]).toEqual(def.columns.map((c) => c.header));
  });

  it("crea una hoja de secuencia por cada prefijo de PREFIJOS_ID", () => {
    const prefijos = Object.values(PREFIJOS_ID);
    expect(Object.keys(HOJAS_SECUENCIA).sort()).toEqual(prefijos.map((p) => SEQ_SHEET_NAMES[p]).sort());
  });

  it("cada hoja de secuencia tiene una única columna de marca de tiempo", () => {
    for (const columnas of Object.values(HOJAS_SECUENCIA)) {
      expect(columnas).toEqual(["marca_tiempo"]);
    }
  });

  it("no hay nombres de hoja repetidos entre datos y secuencias", () => {
    const todos = [...Object.keys(HOJAS), ...Object.keys(HOJAS_SECUENCIA)];
    expect(new Set(todos).size).toBe(todos.length);
  });
});
