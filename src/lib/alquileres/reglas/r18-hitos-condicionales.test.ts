import { describe, expect, it } from "vitest";
import {
  h02NoAplicaPorTipoDeArea,
  h03NoAplicaPorRespuestasCumplidas,
  h04NoAplicaPorPropuestaLocador,
} from "./r18-hitos-condicionales";

describe("R18 — hitos condicionales", () => {
  it("H-02 no aplica si el sector interesado no es SUCURSAL", () => {
    expect(h02NoAplicaPorTipoDeArea("GERENCIA")).toBe(true);
    expect(h02NoAplicaPorTipoDeArea("SUCURSAL")).toBe(false);
  });

  it("H-03 no aplica cuando H-02 y H-21 están ambos cumplidos", () => {
    expect(h03NoAplicaPorRespuestasCumplidas("CUMPLIDO", "CUMPLIDO")).toBe(true);
    expect(h03NoAplicaPorRespuestasCumplidas("CUMPLIDO", "PENDIENTE")).toBe(false);
    expect(h03NoAplicaPorRespuestasCumplidas("PENDIENTE", "PENDIENTE")).toBe(false);
    expect(h03NoAplicaPorRespuestasCumplidas("NO_APLICA", "CUMPLIDO")).toBe(false);
  });

  it("H-04 no aplica si hay un documento PROPUESTA_LOCADOR cargado", () => {
    expect(h04NoAplicaPorPropuestaLocador(["PROPUESTA_LOCADOR"])).toBe(true);
    expect(h04NoAplicaPorPropuestaLocador(["ESCANEADO"])).toBe(false);
    expect(h04NoAplicaPorPropuestaLocador([])).toBe(false);
  });
});
