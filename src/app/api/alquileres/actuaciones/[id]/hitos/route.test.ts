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

describe("R8 (vía R14): un CONTRATO sin partes mínimas no llega a FORMALIZADA aunque cumpla H-15", () => {
  let actuacionId: string;

  beforeEach(async () => {
    vi.resetModules();
    const { POST: crearInmueble } = await import("@/app/api/alquileres/inmuebles/route");
    const resInmueble = await crearInmueble(
      new NextRequest("http://localhost/api/alquileres/inmuebles", { method: "POST", body: JSON.stringify({ domicilio: "Calle R8-CONTRATO", localidadId: "LOC-TEST" }) })
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

    const { PATCH: patchFormalizacion } = await import("../route");
    await patchFormalizacion(
      new NextRequest("http://localhost/api/alquileres/actuaciones/x", {
        method: "PATCH",
        body: JSON.stringify({
          version: actuacion.version,
          fechaInicio: "2026-01-01",
          plazoMeses: 12,
          canonInicial: 50_000,
          condicionIvaCanon: "SIN_IVA",
          destinoCategoria: "COMERCIAL",
          destinoDescripcion: "Local",
          firmanteEpeContactoId: "CON-0001",
        }),
      }),
      { params: Promise.resolve({ id: actuacionId }) }
    );
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("sin ninguna parte cargada, cumplir H-15 deja el estado en EN_TRAMITE, no en FORMALIZADA", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(patch("H-15", { accion: "cumplir", fechaCumplimiento: "2026-01-10" }), {
      params: Promise.resolve({ id: actuacionId }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.actuacion.estadoActuacion).not.toBe("FORMALIZADA");
  });

  it("con un titular y un firmante cargados (RF-10), cumplir H-15 sí lleva a FORMALIZADA", async () => {
    const { POST: crearPersona } = await import("@/app/api/alquileres/personas/route");
    const resPersona = await crearPersona(
      new NextRequest("http://localhost/api/alquileres/personas", {
        method: "POST",
        body: JSON.stringify({ tipoPersona: "FISICA", apellidoNombreRazonSocial: "Pérez, Juan" }),
      })
    );
    const persona = await resPersona.json();

    const { POST: crearParte } = await import("@/app/api/alquileres/actuaciones/[id]/partes/route");
    for (const rolParte of ["TITULAR", "FIRMANTE"]) {
      await crearParte(
        new NextRequest("http://localhost/api/alquileres/actuaciones/x/partes", {
          method: "POST",
          body: JSON.stringify({ personaId: persona.personaId, rolParte, orden: 1 }),
        }),
        { params: Promise.resolve({ id: actuacionId }) }
      );
    }

    const { PATCH } = await import("./route");
    const res = await PATCH(patch("H-15", { accion: "cumplir", fechaCumplimiento: "2026-01-10" }), {
      params: Promise.resolve({ id: actuacionId }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.actuacion.estadoActuacion).toBe("FORMALIZADA");
  });
});
