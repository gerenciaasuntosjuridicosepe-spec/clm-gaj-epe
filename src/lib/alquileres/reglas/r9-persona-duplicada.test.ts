import { describe, expect, it } from "vitest";
import { buscarPersonaDuplicada } from "./r9-persona-duplicada";
import { crearPersona } from "../test-fixtures";

describe("R9 — no duplicar personas", () => {
  it("encuentra una persona existente por CUIT", () => {
    const existente = crearPersona({ personaId: "PER-0001", cuitCuil: "20-12345678-6" });
    const r = buscarPersonaDuplicada([existente], { cuitCuil: "20-12345678-6" });
    expect(r?.personaId).toBe("PER-0001");
  });

  it("encuentra una persona existente por DNI", () => {
    const existente = crearPersona({ personaId: "PER-0001", dni: "12345678" });
    const r = buscarPersonaDuplicada([existente], { dni: "12345678" });
    expect(r?.personaId).toBe("PER-0001");
  });

  it("no encuentra nada si no hay coincidencia", () => {
    const existente = crearPersona({ personaId: "PER-0001", dni: "12345678" });
    expect(buscarPersonaDuplicada([existente], { dni: "99999999" })).toBeUndefined();
  });

  it("ignora personas dadas de baja", () => {
    const existente = crearPersona({ personaId: "PER-0001", dni: "12345678", activo: false });
    expect(buscarPersonaDuplicada([existente], { dni: "12345678" })).toBeUndefined();
  });

  it("sin datos para buscar, no encuentra nada", () => {
    const existente = crearPersona({ personaId: "PER-0001", dni: "12345678" });
    expect(buscarPersonaDuplicada([existente], {})).toBeUndefined();
  });
});
