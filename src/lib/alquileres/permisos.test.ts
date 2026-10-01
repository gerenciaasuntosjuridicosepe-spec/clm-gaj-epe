import { describe, expect, it } from "vitest";
import { enmascararSiLector, MATRIZ_GESTION, MATRIZ_PERSONAS, puedeAlquileres } from "./permisos";

describe("permisos — matriz de Alquileres (PRD v1 sección 3)", () => {
  it("ADMINISTRADOR puede todo sobre inmuebles/expedientes/actuaciones", () => {
    for (const accion of ["leer", "crear", "editar", "baja"] as const) {
      expect(puedeAlquileres("ADMINISTRADOR", accion, MATRIZ_GESTION)).toBe(true);
    }
  });

  it("GESTOR puede leer/crear/editar pero no dar de baja", () => {
    expect(puedeAlquileres("GESTOR", "editar", MATRIZ_GESTION)).toBe(true);
    expect(puedeAlquileres("GESTOR", "baja", MATRIZ_GESTION)).toBe(false);
  });

  it("SUPERVISOR solo lee y da de baja (no crea ni edita)", () => {
    expect(puedeAlquileres("SUPERVISOR", "leer", MATRIZ_GESTION)).toBe(true);
    expect(puedeAlquileres("SUPERVISOR", "baja", MATRIZ_GESTION)).toBe(true);
    expect(puedeAlquileres("SUPERVISOR", "crear", MATRIZ_GESTION)).toBe(false);
  });

  it("LECTOR solo lee", () => {
    expect(puedeAlquileres("LECTOR", "leer", MATRIZ_GESTION)).toBe(true);
    expect(puedeAlquileres("LECTOR", "crear", MATRIZ_GESTION)).toBe(false);
  });

  it("LECTOR no tiene ningún acceso a Personas (dato personal)", () => {
    for (const accion of ["leer", "crear", "editar", "baja"] as const) {
      expect(puedeAlquileres("LECTOR", accion, MATRIZ_PERSONAS)).toBe(false);
    }
  });

  it("sin rol, no puede nada", () => {
    expect(puedeAlquileres(undefined, "leer", MATRIZ_GESTION)).toBe(false);
  });
});

describe("enmascararSiLector", () => {
  it("enmascara campos personales para LECTOR", () => {
    const persona = { personaId: "PER-0001", dni: "12345678", mail: "x@x.test", apellidoNombreRazonSocial: "Juan Pérez" };
    const enmascarada = enmascararSiLector(persona, "LECTOR");
    expect(enmascarada.dni).toBeUndefined();
    expect(enmascarada.mail).toBeUndefined();
    expect(enmascarada.apellidoNombreRazonSocial).toBe("Juan Pérez"); // no es un dato enmascarado
  });

  it("no enmascara nada para otros roles", () => {
    const persona = { personaId: "PER-0001", dni: "12345678" };
    expect(enmascararSiLector(persona, "GESTOR").dni).toBe("12345678");
    expect(enmascararSiLector(persona, undefined).dni).toBe("12345678");
  });
});
