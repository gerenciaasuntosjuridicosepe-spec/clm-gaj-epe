import { describe, expect, it } from "vitest";
import { validarEdicionCatalogo } from "./r20-catalogos-editables";

describe("R20 — catálogos editables", () => {
  it("permite cambiar descripción y orden sin restricción", () => {
    const r = validarEdicionCatalogo(
      { codigo: "SIN_IVA", esSistema: true },
      { descripcion: "nueva descripción", orden: 5 },
      true
    );
    expect(r.valida).toBe(true);
  });

  it("rechaza cambiar el código de un valor en uso", () => {
    const r = validarEdicionCatalogo({ codigo: "SIN_IVA", esSistema: false }, { codigo: "OTRO" }, true);
    expect(r.valida).toBe(false);
  });

  it("rechaza cambiar el código de un valor de sistema aunque no esté en uso", () => {
    const r = validarEdicionCatalogo({ codigo: "SIN_IVA", esSistema: true }, { codigo: "OTRO" }, false);
    expect(r.valida).toBe(false);
  });

  it("permite cambiar el código de un valor NO de sistema y sin uso", () => {
    const r = validarEdicionCatalogo({ codigo: "OTRA", esSistema: false }, { codigo: "OTRA_V2" }, false);
    expect(r.valida).toBe(true);
  });

  it("rechaza desactivar un valor de sistema", () => {
    const r = validarEdicionCatalogo({ codigo: "SIN_IVA", esSistema: true }, { activo: false }, false);
    expect(r.valida).toBe(false);
  });

  it("permite desactivar un valor que no es de sistema", () => {
    const r = validarEdicionCatalogo({ codigo: "OTRA", esSistema: false }, { activo: false }, false);
    expect(r.valida).toBe(true);
  });
});
