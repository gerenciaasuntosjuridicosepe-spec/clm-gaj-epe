import { describe, expect, it } from "vitest";
import { filaAUsuario, usuarioAFila } from "./sheets-schema";

/**
 * D12 (PRD v2.1, sección 4): la hoja Usuarios del CLM se amplía con
 * `rol_alquileres` y `activo`, agregadas AL FINAL para no correr las
 * columnas existentes de una planilla ya aprovisionada. Esta prueba fija
 * esa compatibilidad: una fila "vieja" (sin esas dos columnas) debe seguir
 * interpretándose igual que antes de este cambio.
 */
describe("sheets-schema — Usuarios ampliado (D12)", () => {
  it("una fila vieja, sin rol_alquileres ni activo, se interpreta como sin acceso a Alquileres y activo", () => {
    const filaVieja = ["u1", "M. Cardozo", "abogado", "Asesoramiento General", "m.cardozo@epe.com.ar"];
    const usuario = filaAUsuario(filaVieja);
    expect(usuario.rolAlquileres).toBeUndefined();
    expect(usuario.activo).toBe(true); // vacío = activo, no rompe el acceso existente
  });

  it("una fila con rol_alquileres y activo=FALSE se interpreta correctamente", () => {
    const fila = ["u7", "Gestora", "", "GAJ", "gestora@ejemplo.test", "GESTOR", "FALSE"];
    const usuario = filaAUsuario(fila);
    expect(usuario.rolAlquileres).toBe("GESTOR");
    expect(usuario.activo).toBe(false);
  });

  it("round-trip usuarioAFila -> filaAUsuario conserva los datos", () => {
    const original = {
      id: "u7",
      nombre: "Gestora de Alquileres",
      rolId: "",
      area: "GAJ",
      email: "gestora@ejemplo.test",
      rolAlquileres: "GESTOR",
      activo: true,
    };
    const roundTrip = filaAUsuario(usuarioAFila(original).map(String));
    expect(roundTrip.rolAlquileres).toBe("GESTOR");
    expect(roundTrip.activo).toBe(true);
    expect(roundTrip.email).toBe("gestora@ejemplo.test");
  });
});
