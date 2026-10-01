import { describe, expect, it } from "vitest";
import { canonVigente } from "./r19-canon-vigente";
import { crearActuacion } from "../test-fixtures";

describe("R19 — canon vigente (canon inicial informado)", () => {
  it("sin adendas, es el canon del propio contrato", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001", fechaInicio: "2026-01-01", canonInicial: 100_000 });
    expect(canonVigente(contrato, [contrato])).toBe(100_000);
  });

  it("con una adenda posterior que informa canon, toma el de la adenda", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001", fechaInicio: "2026-01-01", canonInicial: 100_000 });
    const adenda = crearActuacion({
      actuacionId: "ACT-0002",
      tipoActuacion: "ADENDA",
      actuacionAnteriorId: "ACT-0001",
      fechaInicio: "2027-01-01",
      canonInicial: 150_000,
    });
    expect(canonVigente(contrato, [contrato, adenda])).toBe(150_000);
  });

  it("ignora adendas anuladas", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001", fechaInicio: "2026-01-01", canonInicial: 100_000 });
    const adendaAnulada = crearActuacion({
      actuacionId: "ACT-0002",
      tipoActuacion: "ADENDA",
      actuacionAnteriorId: "ACT-0001",
      fechaInicio: "2027-01-01",
      canonInicial: 999_999,
      estadoActuacion: "ANULADA",
    });
    expect(canonVigente(contrato, [contrato, adendaAnulada])).toBe(100_000);
  });

  it("ignora adendas que no informan canon (toma la más reciente que sí lo informe)", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001", fechaInicio: "2026-01-01", canonInicial: 100_000 });
    const adendaSinCanon = crearActuacion({
      actuacionId: "ACT-0002",
      tipoActuacion: "ADENDA",
      actuacionAnteriorId: "ACT-0001",
      fechaInicio: "2027-01-01",
      canonInicial: undefined,
    });
    expect(canonVigente(contrato, [contrato, adendaSinCanon])).toBe(100_000);
  });

  it("undefined si nada informa canon todavía", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001" });
    expect(canonVigente(contrato, [contrato])).toBeUndefined();
  });
});
