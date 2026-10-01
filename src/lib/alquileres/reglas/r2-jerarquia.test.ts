import { describe, expect, it } from "vitest";
import { validarVinculoActuacionExpediente } from "./r2-jerarquia";
import { crearExpediente } from "../test-fixtures";

describe("R2 — jerarquía inmueble/expediente/actuación", () => {
  it("acepta vincular a un expediente del mismo inmueble", () => {
    const exp = crearExpediente({ expedienteId: "EXP-0001", inmuebleId: "INM-0001" });
    expect(validarVinculoActuacionExpediente("INM-0001", exp).valida).toBe(true);
  });

  it("rechaza vincular a un expediente de otro inmueble", () => {
    const exp = crearExpediente({ expedienteId: "EXP-0001", inmuebleId: "INM-9999" });
    const r = validarVinculoActuacionExpediente("INM-0001", exp);
    expect(r.valida).toBe(false);
    expect(r.error).toMatch(/R2/);
  });

  it("acepta una actuación sin expediente todavía (aviso a 4 meses)", () => {
    expect(validarVinculoActuacionExpediente("INM-0001", undefined).valida).toBe(true);
  });
});
