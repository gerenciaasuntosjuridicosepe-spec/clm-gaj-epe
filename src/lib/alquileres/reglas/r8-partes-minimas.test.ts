import { describe, expect, it } from "vitest";
import { validarPartesMinimas } from "./r8-partes-minimas";

describe("R8 — al menos un titular y un firmante", () => {
  it("rechaza CONTRATO sin partes", () => {
    expect(validarPartesMinimas("CONTRATO", []).valida).toBe(false);
  });

  it("rechaza CONTRATO con solo titular, sin firmante", () => {
    const r = validarPartesMinimas("CONTRATO", [{ rolParte: "TITULAR", activo: true }]);
    expect(r.valida).toBe(false);
    expect(r.error).toMatch(/firmante/);
  });

  it("acepta CONTRATO con un titular y un firmante (pueden ser la misma persona en dos filas)", () => {
    const r = validarPartesMinimas("CONTRATO", [
      { rolParte: "TITULAR", activo: true },
      { rolParte: "FIRMANTE", activo: true },
    ]);
    expect(r.valida).toBe(true);
  });

  it("ignora partes dadas de baja (activo = false)", () => {
    const r = validarPartesMinimas("CONTRATO", [
      { rolParte: "TITULAR", activo: true },
      { rolParte: "FIRMANTE", activo: false },
    ]);
    expect(r.valida).toBe(false);
  });

  it("aplica igual a ADENDA", () => {
    expect(validarPartesMinimas("ADENDA", []).valida).toBe(false);
  });

  it("LEGITIMO_ABONO no exige partes", () => {
    expect(validarPartesMinimas("LEGITIMO_ABONO", []).valida).toBe(true);
  });
});
