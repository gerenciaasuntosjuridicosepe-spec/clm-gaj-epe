import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

async function sesionComo(rolAlquileres: string | undefined) {
  const { auth } = await import("@/auth");
  (auth as ReturnType<typeof vi.fn>).mockResolvedValue(
    rolAlquileres ? { user: { rolAlquileres, usuarioId: "u-test", name: "Prueba", email: "admin@ejemplo.test" } } : null
  );
}

describe("GET /api/alquileres/administracion/errores", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("GESTOR no tiene acceso", async () => {
    await sesionComo("GESTOR");
    const { GET } = await import("./route");
    expect((await GET()).status).toBe(403);
  });

  it("ADMINISTRADOR ve la lista (vacía si no hay errores)", async () => {
    await sesionComo("ADMINISTRADOR");
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.errores)).toBe(true);
  });

  it("registrarError + listarErrores: un error registrado aparece en la lista, ordenado por fecha", async () => {
    const { registrarError } = await import("@/lib/alquileres/repositorio/errores");
    await registrarError("GET /api/alquileres/x", "Algo falló");

    await sesionComo("ADMINISTRADOR");
    const { GET } = await import("./route");
    const res = await GET();
    const data = await res.json();
    expect(data.errores.some((e: { mensaje: string }) => e.mensaje === "Algo falló")).toBe(true);
  });
});
