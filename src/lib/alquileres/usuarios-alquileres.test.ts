import { describe, expect, it } from "vitest";
import { actualizarAccesoAlquileres, listarUsuariosConAccesoAlquileres } from "./usuarios-alquileres";
import { buscarUsuarioPorEmail } from "@/lib/data/usuarios-provider";

/**
 * T27: el módulo de Alquileres solo puede escribir `rol_alquileres` y
 * `activo` en Usuarios — nunca otro campo, ni siquiera si el llamador
 * intenta mandarlo (bug o `as never`).
 */
describe("actualizarAccesoAlquileres (T27)", () => {
  it("actualiza rolAlquileres y activo normalmente", async () => {
    const antes = await buscarUsuarioPorEmail("gestora.alquileres@ejemplo.test");
    expect(antes).toBeDefined();

    const actualizado = await actualizarAccesoAlquileres(antes!.id, { rolAlquileres: "SUPERVISOR", activo: true });
    expect(actualizado?.rolAlquileres).toBe("SUPERVISOR");
    expect(actualizado?.activo).toBe(true);
  });

  it("T27: ignora cualquier otro campo que el llamador intente mandar (rolId, nombre, email)", async () => {
    const antes = await buscarUsuarioPorEmail("gestora.alquileres@ejemplo.test");
    const nombreOriginal = antes!.nombre;
    const emailOriginal = antes!.email;

    // Simula un llamador que bypassea el tipo (bug, o código JS sin tipos) e intenta tocar otros campos.
    const intentoMalicioso = {
      rolAlquileres: "ADMINISTRADOR",
      activo: true,
      rolId: "administrador_sistema",
      nombre: "Nombre cambiado sin permiso",
      email: "otro@ejemplo.test",
    } as unknown as Parameters<typeof actualizarAccesoAlquileres>[1];

    const resultado = await actualizarAccesoAlquileres(antes!.id, intentoMalicioso);

    expect(resultado?.rolAlquileres).toBe("ADMINISTRADOR"); // esto sí se aplica
    expect(resultado?.nombre).toBe(nombreOriginal); // esto NO se aplica
    expect(resultado?.email).toBe(emailOriginal); // esto NO se aplica
    expect(resultado?.rolId).toBe(antes!.rolId); // esto NO se aplica (rolId del CLM intacto)
  });

  it("listarUsuariosConAccesoAlquileres devuelve solo usuarios con rolAlquileres", async () => {
    const lista = await listarUsuariosConAccesoAlquileres();
    expect(lista.every((u) => Boolean(u.rolAlquileres))).toBe(true);
    expect(lista.some((u) => u.email === "gestora.alquileres@ejemplo.test")).toBe(true);
    expect(lista.some((u) => u.email === "j.perez@epe.com.ar")).toBe(false); // sin rolAlquileres
  });
});
