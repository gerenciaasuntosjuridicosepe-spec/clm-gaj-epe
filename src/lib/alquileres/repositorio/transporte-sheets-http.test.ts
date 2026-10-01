import { describe, expect, it } from "vitest";
import { filaDeDatosDesdeRango, googleSheetsAlquileresConfigurado } from "./transporte-sheets-http";

/**
 * Este archivo NUNCA se conecta a Google real (no hay credenciales en este
 * worktree). Solo prueba la aritmética pura de conversión entre "rango A1
 * devuelto por la API" y "número de fila de datos (1-based)", que es la
 * base de R1 (el ID sale del número de fila) — un error de offset acá
 * generaría IDs corridos en producción sin que ninguna prueba contra el
 * fake lo detecte (el fake no pasa por este parseo).
 */
describe("transporte-sheets-http — filaDeDatosDesdeRango", () => {
  it("la primera fila de datos (fila 2 de la hoja, justo debajo del encabezado) da filaNumero=1", () => {
    expect(filaDeDatosDesdeRango("ACTUACIONES!A2:Z2")).toBe(1);
  });

  it("la fila 5 de la hoja (encabezado en la 1) da filaNumero=4", () => {
    expect(filaDeDatosDesdeRango("ACTUACIONES!A5:Z5")).toBe(4);
  });

  it("rechaza un rango sin número de fila reconocible", () => {
    expect(() => filaDeDatosDesdeRango("ACTUACIONES!A:Z")).toThrow();
  });
});

describe("transporte-sheets-http — googleSheetsAlquileresConfigurado (T26)", () => {
  it("es false en este entorno de desarrollo (sin .env.local, por diseño)", () => {
    // No se tocan variables de entorno acá a propósito: este test documenta
    // el estado real del worktree de desarrollo, no lo simula.
    expect(googleSheetsAlquileresConfigurado()).toBe(false);
  });
});
