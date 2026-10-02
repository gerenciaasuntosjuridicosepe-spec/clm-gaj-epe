import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { rolAlquileres: "ADMINISTRADOR", usuarioId: "u-test", name: "Prueba", email: "prueba@ejemplo.test" },
  })),
}));

function patchActuacion(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/alquileres/actuaciones/x", { method: "PATCH", body: JSON.stringify(body) });
}

describe("PATCH /api/alquileres/actuaciones/[id] — RF-12 (formalización, parcial)", () => {
  let actuacionId: string;
  let version: number;

  beforeEach(async () => {
    vi.resetModules();
    const { POST: crearInmueble } = await import("@/app/api/alquileres/inmuebles/route");
    const resInmueble = await crearInmueble(
      new NextRequest("http://localhost/api/alquileres/inmuebles", {
        method: "POST",
        body: JSON.stringify({ domicilio: "Calle RF-12", localidadId: "LOC-TEST" }),
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
    version = actuacion.version;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("exige version (control de concurrencia)", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(patchActuacion({ fechaInicio: "2026-01-01" }), { params: Promise.resolve({ id: actuacionId }) });
    expect(res.status).toBe(400);
  });

  it("T2: con inicio + plazo sin fecha_fin explícita, propone la fecha_fin por defecto (R5)", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(
      patchActuacion({ version, fechaInicio: "2026-04-01", plazoMeses: 24 }),
      { params: Promise.resolve({ id: actuacionId }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.fechaFin).toBe("2028-03-31");
  });

  it("R5: una fecha_fin distinta de la propuesta sin motivo es rechazada", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(
      patchActuacion({ version, fechaInicio: "2026-04-01", plazoMeses: 24, fechaFin: "2028-04-15" }),
      { params: Promise.resolve({ id: actuacionId }) }
    );
    expect(res.status).toBe(400);
  });

  it("R5: con motivo, acepta la fecha_fin distinta de la propuesta", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(
      patchActuacion({
        version,
        fechaInicio: "2026-04-01",
        plazoMeses: 24,
        fechaFin: "2028-04-15",
        motivoCambioFecha: "Se acordó extender 15 días",
      }),
      { params: Promise.resolve({ id: actuacionId }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.fechaFin).toBe("2028-04-15");
  });

  it("T20: una version vieja es rechazada con 409, sin perder el cambio anterior", async () => {
    const { PATCH } = await import("./route");
    const primero = await PATCH(patchActuacion({ version, canonInicial: 100_000 }), {
      params: Promise.resolve({ id: actuacionId }),
    });
    expect(primero.status).toBe(200);

    // Reintento con la MISMA version vieja (como si otro usuario la hubiera leído antes del cambio de arriba).
    const segundo = await PATCH(patchActuacion({ version, canonInicial: 999_999 }), {
      params: Promise.resolve({ id: actuacionId }),
    });
    expect(segundo.status).toBe(409);

    const { GET } = await import("./route");
    const verificacion = await GET(new NextRequest("http://localhost/x"), { params: Promise.resolve({ id: actuacionId }) });
    const actual = await verificacion.json();
    expect(actual.canonInicial).toBe(100_000); // el cambio exitoso no se perdió
  });
});
