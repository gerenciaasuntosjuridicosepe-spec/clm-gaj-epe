import { describe, expect, it } from "vitest";
import { comoRolAlquileres, puedeIniciarSesion, tieneAccesoARuta } from "./acceso-modulo";

describe("acceso-modulo — comoRolAlquileres", () => {
  it("acepta los 4 roles válidos", () => {
    expect(comoRolAlquileres("ADMINISTRADOR")).toBe("ADMINISTRADOR");
    expect(comoRolAlquileres("GESTOR")).toBe("GESTOR");
    expect(comoRolAlquileres("SUPERVISOR")).toBe("SUPERVISOR");
    expect(comoRolAlquileres("LECTOR")).toBe("LECTOR");
  });

  it("rechaza vacío, undefined o valores no reconocidos", () => {
    expect(comoRolAlquileres(undefined)).toBeUndefined();
    expect(comoRolAlquileres("")).toBeUndefined();
    expect(comoRolAlquileres("administrador_sistema")).toBeUndefined(); // rol del CLM, no de Alquileres
  });
});

describe("acceso-modulo — puedeIniciarSesion (D12, T16)", () => {
  it("permite a un usuario solo con rol del CLM", () => {
    expect(puedeIniciarSesion({ rolId: "abogado" })).toBe(true);
  });

  it("permite a un usuario solo con rol de Alquileres (D12: alcanza con un módulo)", () => {
    expect(puedeIniciarSesion({ rolAlquileres: "GESTOR" })).toBe(true);
  });

  it("permite a un usuario con ambos roles", () => {
    expect(puedeIniciarSesion({ rolId: "administrador_sistema", rolAlquileres: "ADMINISTRADOR" })).toBe(true);
  });

  it("rechaza a un usuario sin ningún rol en ningún módulo", () => {
    expect(puedeIniciarSesion({})).toBe(false);
  });

  it("rechaza si no hay usuario (no está en la tabla Usuarios)", () => {
    expect(puedeIniciarSesion(undefined)).toBe(false);
  });

  it("T16: rechaza a un usuario con rol pero activo = false", () => {
    expect(puedeIniciarSesion({ rolId: "abogado", activo: false })).toBe(false);
    expect(puedeIniciarSesion({ rolAlquileres: "GESTOR", activo: false })).toBe(false);
  });

  it("activo vacío/undefined se interpreta como activo (D12, no rompe usuarios existentes)", () => {
    expect(puedeIniciarSesion({ rolId: "abogado", activo: undefined })).toBe(true);
  });

  it("un rol de Alquileres no reconocido no habilita el acceso por sí solo", () => {
    expect(puedeIniciarSesion({ rolAlquileres: "SUPER_ADMIN_FALSO" })).toBe(false);
  });
});

describe("acceso-modulo — tieneAccesoARuta (T19)", () => {
  it("T19: un usuario solo con rol de Alquileres entra a /alquileres", () => {
    expect(tieneAccesoARuta("/alquileres", { rolAlquileres: "GESTOR" })).toBe(true);
  });

  it("T19: un usuario solo con rol de Alquileres NO entra a una ruta del CLM (ej. /contratos)", () => {
    expect(tieneAccesoARuta("/contratos", { rolAlquileres: "GESTOR" })).toBe(false);
  });

  it("T19: un usuario solo con rol del CLM NO entra a /alquileres", () => {
    expect(tieneAccesoARuta("/alquileres", { rolId: "abogado" })).toBe(false);
  });

  it("T19: un usuario solo con rol del CLM entra a rutas del CLM", () => {
    expect(tieneAccesoARuta("/contratos", { rolId: "abogado" })).toBe(true);
    expect(tieneAccesoARuta("/", { rolId: "abogado" })).toBe(true);
  });

  it("un usuario con ambos roles entra a todo", () => {
    const sesion = { rolId: "administrador_sistema" as const, rolAlquileres: "ADMINISTRADOR" as const };
    expect(tieneAccesoARuta("/alquileres", sesion)).toBe(true);
    expect(tieneAccesoARuta("/contratos", sesion)).toBe(true);
  });

  it("sin sesión, no hay acceso a ninguna ruta", () => {
    expect(tieneAccesoARuta("/contratos", undefined)).toBe(false);
  });

  it("subrutas de /alquileres también exigen rolAlquileres (ej. /alquileres/inmuebles)", () => {
    expect(tieneAccesoARuta("/alquileres/inmuebles", { rolId: "abogado" })).toBe(false);
    expect(tieneAccesoARuta("/alquileres/inmuebles", { rolAlquileres: "LECTOR" })).toBe(true);
  });
});
