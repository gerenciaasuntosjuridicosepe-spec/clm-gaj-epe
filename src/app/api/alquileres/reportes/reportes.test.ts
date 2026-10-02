import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

async function sesionComo(rolAlquileres: string | undefined) {
  const { auth } = await import("@/auth");
  (auth as ReturnType<typeof vi.fn>).mockResolvedValue(
    rolAlquileres ? { user: { rolAlquileres, usuarioId: "u-test", name: "Prueba", email: "prueba@ejemplo.test" } } : null
  );
}

function get(url: string) {
  return new NextRequest(`http://localhost${url}`);
}

describe("Permisos de reportes (MATRIZ_REPORTES)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("RP-01: accesible para los 4 roles, incluido LECTOR", async () => {
    await sesionComo("LECTOR");
    const { GET } = await import("./vencimientos/route");
    const res = await GET(get("/api/alquileres/reportes/vencimientos"));
    expect(res.status).toBe(200);
  });

  it("RP-02: LECTOR puede VER pero no EXPORTAR (dato personal)", async () => {
    await sesionComo("LECTOR");
    const { GET } = await import("./cartera/route");

    const verRes = await GET(get("/api/alquileres/reportes/cartera"));
    expect(verRes.status).toBe(200);

    const exportarRes = await GET(get("/api/alquileres/reportes/cartera?formato=csv"));
    expect(exportarRes.status).toBe(403);
  });

  it("RP-02: ADMINISTRADOR puede exportar", async () => {
    await sesionComo("ADMINISTRADOR");
    const { GET } = await import("./cartera/route");
    const res = await GET(get("/api/alquileres/reportes/cartera?formato=csv"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
  });

  it("RP-09: LECTOR no tiene acceso en absoluto", async () => {
    await sesionComo("LECTOR");
    const { GET } = await import("./calidad-datos/route");
    const res = await GET(get("/api/alquileres/reportes/calidad-datos"));
    expect(res.status).toBe(403);
  });

  it("RP-09: GESTOR sí tiene acceso", async () => {
    await sesionComo("GESTOR");
    const { GET } = await import("./calidad-datos/route");
    const res = await GET(get("/api/alquileres/reportes/calidad-datos"));
    expect(res.status).toBe(200);
  });

  it("RP-10: ni GESTOR ni LECTOR tienen acceso — solo ADMINISTRADOR y SUPERVISOR", async () => {
    const { GET } = await import("./actividad/route");

    await sesionComo("GESTOR");
    expect((await GET(get("/api/alquileres/reportes/actividad"))).status).toBe(403);

    await sesionComo("LECTOR");
    expect((await GET(get("/api/alquileres/reportes/actividad"))).status).toBe(403);

    await sesionComo("SUPERVISOR");
    expect((await GET(get("/api/alquileres/reportes/actividad"))).status).toBe(200);
  });

  it("sin sesión, cualquier reporte responde 401", async () => {
    await sesionComo(undefined);
    const { GET } = await import("./vencimientos/route");
    const res = await GET(get("/api/alquileres/reportes/vencimientos"));
    expect(res.status).toBe(401);
  });
});
