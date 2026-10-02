import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

async function sesionComo(rolAlquileres: string | undefined) {
  const { auth } = await import("@/auth");
  (auth as ReturnType<typeof vi.fn>).mockResolvedValue(
    rolAlquileres ? { user: { rolAlquileres, usuarioId: "u-test", name: "Prueba", email: "admin@ejemplo.test" } } : null
  );
}

describe("GET/POST /api/alquileres/administracion/respaldo — RF-39/A8", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("GESTOR/SUPERVISOR/LECTOR no pueden ver ni registrar el respaldo", async () => {
    for (const rol of ["GESTOR", "SUPERVISOR", "LECTOR"]) {
      await sesionComo(rol);
      const { GET, POST } = await import("./route");
      expect((await GET()).status).toBe(403);
      expect((await POST()).status).toBe(403);
    }
  });

  it("sin ningún respaldo registrado todavía, la alerta A8 está encendida", async () => {
    await sesionComo("ADMINISTRADOR");
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ultimoRespaldoEn).toBeUndefined();
    expect(data.alertaA8).toBe(true);
  });

  it("registrar un respaldo hoy apaga la alerta A8 y queda reflejado en LOG_CAMBIOS", async () => {
    await sesionComo("ADMINISTRADOR");
    const { POST, GET } = await import("./route");

    const resPost = await POST();
    expect(resPost.status).toBe(200);

    const resGet = await GET();
    const data = await resGet.json();
    expect(data.diasDesdeUltimoRespaldo).toBe(0);
    expect(data.alertaA8).toBe(false);

    const { listarLogCambios } = await import("@/lib/alquileres/repositorio/log-cambios");
    const log = await listarLogCambios();
    expect(log.some((l) => l.hoja === "PARAMETROS" && l.registroId === "ultimo_respaldo_en")).toBe(true);
  });
});
