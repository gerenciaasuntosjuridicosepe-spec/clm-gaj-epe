import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { rolAlquileres: "ADMINISTRADOR", usuarioId: "u-test", name: "Prueba", email: "prueba@ejemplo.test" },
  })),
}));

function post(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/alquileres/actuaciones/x/documentos", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/alquileres/actuaciones/[id]/documentos — RF-28", () => {
  let actuacionId: string;

  beforeEach(async () => {
    vi.resetModules();
    const { POST: crearInmueble } = await import("@/app/api/alquileres/inmuebles/route");
    const resInmueble = await crearInmueble(
      new NextRequest("http://localhost/api/alquileres/inmuebles", {
        method: "POST",
        body: JSON.stringify({ domicilio: "Calle Documentos", localidadId: "LOC-TEST" }),
      })
    );
    const inmueble = await resInmueble.json();

    const { POST: crearActuacion } = await import("@/app/api/alquileres/actuaciones/route");
    const resActuacion = await crearActuacion(
      new NextRequest("http://localhost/api/alquileres/actuaciones", {
        method: "POST",
        body: JSON.stringify({ tipoActuacion: "CONTRATO", inmuebleId: inmueble.inmuebleId, sectorInteresadoAreaId: "AR-06" }),
      })
    );
    const actuacion = await resActuacion.json();
    actuacionId = actuacion.actuacionId;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("rechaza un enlace que no sea de drive.google.com ni docs.google.com", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({ tipoDocumento: "ESCANEADO", urlDocumento: "https://ejemplo.com/doc", firmado: true }), {
      params: Promise.resolve({ id: actuacionId }),
    });
    expect(res.status).toBe(400);
  });

  it("acepta un enlace de drive.google.com y lo guarda con origen CARGADO", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      post({ tipoDocumento: "ESCANEADO", urlDocumento: "https://drive.google.com/file/d/abc", firmado: true }),
      { params: Promise.resolve({ id: actuacionId }) }
    );
    expect(res.status).toBe(201);
    const documento = await res.json();
    expect(documento).toMatchObject({ tipoDocumento: "ESCANEADO", origen: "CARGADO", firmado: true });
  });
});
