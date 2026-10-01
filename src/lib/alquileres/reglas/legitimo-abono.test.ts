import { describe, expect, it } from "vitest";
import { diferenciaMontoReconocido, mesesDelPeriodo } from "./legitimo-abono";

describe("legítimo abono — meses del período y diferencia de monto (T28, D15/M18)", () => {
  it("cuenta meses completos de un período de un año", () => {
    expect(mesesDelPeriodo("2026-01-01", "2026-12-31")).toBe(12);
  });

  it("T28: monto_total_reconocido coincide con meses x mensual — sin diferencia", () => {
    const r = diferenciaMontoReconocido({
      fechaInicio: "2026-01-01",
      fechaFin: "2026-06-30",
      canonInicial: 100_000,
      montoTotalReconocido: 600_000, // 6 meses x 100.000
    });
    expect(r?.mesesDelPeriodo).toBe(6);
    expect(r?.montoEsperado).toBe(600_000);
    expect(r?.difiere).toBe(false);
  });

  it("T28: monto_total_reconocido distinto de meses x mensual — se guardan ambos y se marca la diferencia", () => {
    const r = diferenciaMontoReconocido({
      fechaInicio: "2026-01-01",
      fechaFin: "2026-06-30",
      canonInicial: 100_000,
      montoTotalReconocido: 650_000, // el acto reconoce más que 6 x 100.000
    });
    expect(r?.montoEsperado).toBe(600_000);
    expect(r?.montoDeclarado).toBe(650_000);
    expect(r?.difiere).toBe(true);
  });

  it("sin monto_total_reconocido informado, no hay nada que comparar (es opcional)", () => {
    expect(
      diferenciaMontoReconocido({ fechaInicio: "2026-01-01", fechaFin: "2026-06-30", canonInicial: 100_000 })
    ).toBeUndefined();
  });
});
