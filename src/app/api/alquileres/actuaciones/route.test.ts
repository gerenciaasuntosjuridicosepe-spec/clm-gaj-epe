import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Prueba de la ruta en sí (no solo de la regla pura): confirma el hallazgo
 * de la revisión adversarial de Fase 1 — antes, R3' solo se validaba
 * cuando el cliente mandaba `actuacionAnteriorId`, así que una ADENDA sin
 * ese campo (que R3' exige obligatoriamente) se creaba igual, sin pasar
 * por `validarCadenaActuacion` en absoluto. Corregido para validar siempre.
 */
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { rolAlquileres: "ADMINISTRADOR", usuarioId: "u-test", name: "Prueba", email: "prueba@ejemplo.test" },
  })),
}));

function post(body: unknown) {
  return new NextRequest("http://localhost/api/alquileres/actuaciones", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/alquileres/actuaciones — R3' siempre se valida", () => {
  let inmuebleId: string;

  beforeEach(async () => {
    vi.resetModules();
    const { POST: crearInmueble } = await import("@/app/api/alquileres/inmuebles/route");
    const resInmueble = await crearInmueble(
      new NextRequest("http://localhost/api/alquileres/inmuebles", {
        method: "POST",
        body: JSON.stringify({ domicilio: "Calle de prueba 1", localidadId: "LOC-TEST" }),
      })
    );
    const inmueble = await resInmueble.json();
    inmuebleId = inmueble.inmuebleId;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("acepta un CONTRATO sin actuacion_anterior_id (primero del inmueble)", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({ tipoActuacion: "CONTRATO", inmuebleId, sectorInteresadoAreaId: "AR-06" }));
    expect(res.status).toBe(201);
    const creada = await res.json();
    expect(creada.estadoActuacion).toBe("PENDIENTE_AVISO");
  });

  it("rechaza una ADENDA sin actuacion_anterior_id (R3' lo exige)", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({ tipoActuacion: "ADENDA", inmuebleId, sectorInteresadoAreaId: "AR-06" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/actuacion_anterior_id/);
  });

  it("rechaza un LEGITIMO_ABONO sin actuacion_anterior_id (R3' lo exige)", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({ tipoActuacion: "LEGITIMO_ABONO", inmuebleId, sectorInteresadoAreaId: "AR-06" }));
    expect(res.status).toBe(400);
  });
});
