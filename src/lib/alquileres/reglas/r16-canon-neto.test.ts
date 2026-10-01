import { describe, expect, it } from "vitest";
import { canonNeto, totalCanonNeto } from "./r16-canon-neto";

describe("R16 — canon neto de IVA", () => {
  it("T7: 1.210.000 IVA_INCLUIDO con alícuota 21 → neto 1.000.000", () => {
    const r = canonNeto(1_210_000, "IVA_INCLUIDO", 21);
    expect(r.incluido).toBe(true);
    if (r.incluido) expect(r.neto).toBeCloseTo(1_000_000, 5);
  });

  it("T7: 1.000.000 MAS_IVA → neto 1.000.000 (ya es neto)", () => {
    const r = canonNeto(1_000_000, "MAS_IVA", 21);
    expect(r).toEqual({ incluido: true, neto: 1_000_000 });
  });

  it("T7: SIN_IVA también es neto tal cual", () => {
    const r = canonNeto(500_000, "SIN_IVA", 21);
    expect(r).toEqual({ incluido: true, neto: 500_000 });
  });

  it("T7: sin condición informada, queda excluido ('sin dato de IVA')", () => {
    expect(canonNeto(1_000_000, undefined, 21)).toEqual({ incluido: false });
    expect(canonNeto(undefined, "SIN_IVA", 21)).toEqual({ incluido: false });
  });

  it("totalCanonNeto suma los netos y cuenta aparte los sin dato de IVA", () => {
    const { total, sinDatoIva } = totalCanonNeto(
      [
        { canonInicial: 1_210_000, condicionIvaCanon: "IVA_INCLUIDO" },
        { canonInicial: 1_000_000, condicionIvaCanon: "MAS_IVA" },
        { canonInicial: 800_000, condicionIvaCanon: undefined },
      ],
      21
    );
    expect(total).toBeCloseTo(2_000_000, 5);
    expect(sinDatoIva).toBe(1);
  });
});
