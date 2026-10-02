import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { rolAlquileres: "ADMINISTRADOR", usuarioId: "u-test", name: "Prueba", email: "prueba@ejemplo.test" },
  })),
}));

function patch(hitoId: string, body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/alquileres/actuaciones/x/hitos", {
    method: "PATCH",
    body: JSON.stringify({ hitoId, ...body }),
  });
}

describe("PATCH /api/alquileres/actuaciones/[id]/hitos — RF-20/RF-21", () => {
  let actuacionId: string;

  beforeEach(async () => {
    vi.resetModules();
    const { POST: crearInmueble } = await import("@/app/api/alquileres/inmuebles/route");
    const resInmueble = await crearInmueble(
      new NextRequest("http://localhost/api/alquileres/inmuebles", {
        method: "POST",
        body: JSON.stringify({ domicilio: "Calle RF-21", localidadId: "LOC-TEST" }),
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

  it("RF-20: cumplir un hito sin fecha_cumplimiento es rechazado", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(patch("H-01", {}), { params: Promise.resolve({ id: actuacionId }) });
    expect(res.status).toBe(400);
  });

  it("RF-21: reprogramar sin motivo es rechazado", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(patch("H-02", { accion: "reprogramar", nuevaFechaPrevista: "2030-01-01" }), {
      params: Promise.resolve({ id: actuacionId }),
    });
    expect(res.status).toBe(400);
  });

  it("RF-21: reprograma un hito con motivo — queda reprogramada=true y con la fecha nueva", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(
      patch("H-02", { accion: "reprogramar", nuevaFechaPrevista: "2030-01-01", motivo: "El sector pidió una extensión" }),
      { params: Promise.resolve({ id: actuacionId }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.hitos[0]).toMatchObject({ fechaPrevista: "2030-01-01", reprogramada: true, observaciones: "El sector pidió una extensión" });
  });

  it("RF-21: marca NO_APLICA con motivo", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(patch("H-04", { accion: "no_aplica", motivo: "Hay propuesta del locador" }), {
      params: Promise.resolve({ id: actuacionId }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.hitos[0]).toMatchObject({ estadoHito: "NO_APLICA", observaciones: "Hay propuesta del locador" });
  });

  it("RF-21: NO_APLICA sin motivo es rechazado", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(patch("H-04", { accion: "no_aplica" }), { params: Promise.resolve({ id: actuacionId }) });
    expect(res.status).toBe(400);
  });
});
