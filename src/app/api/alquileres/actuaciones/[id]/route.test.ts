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

describe("PATCH /api/alquileres/actuaciones/[id] — RF-29 (acto administrativo exige LEGITIMO_ABONO para FORMALIZADA)", () => {
  let actuacionId: string;
  let version: number;

  beforeEach(async () => {
    vi.resetModules();
    const { POST: crearInmueble } = await import("@/app/api/alquileres/inmuebles/route");
    const resInmueble = await crearInmueble(
      new NextRequest("http://localhost/api/alquileres/inmuebles", {
        method: "POST",
        body: JSON.stringify({ domicilio: "Calle RF-29", localidadId: "LOC-TEST" }),
      })
    );
    const inmueble = await resInmueble.json();

    const { POST: crearActuacion } = await import("@/app/api/alquileres/actuaciones/route");
    // LEGITIMO_ABONO exige actuacion_anterior_id apuntando a un CONTRATO del mismo inmueble (R3').
    const resContratoPredecesor = await crearActuacion(
      new NextRequest("http://localhost/api/alquileres/actuaciones", {
        method: "POST",
        body: JSON.stringify({ tipoActuacion: "CONTRATO", inmuebleId: inmueble.inmuebleId, sectorInteresadoAreaId: "AR-06" }),
      })
    );
    const contratoPredecesor = await resContratoPredecesor.json();

    const resActuacion = await crearActuacion(
      new NextRequest("http://localhost/api/alquileres/actuaciones", {
        method: "POST",
        body: JSON.stringify({
          tipoActuacion: "LEGITIMO_ABONO",
          inmuebleId: inmueble.inmuebleId,
          sectorInteresadoAreaId: "AR-06",
          actuacionAnteriorId: contratoPredecesor.actuacionId,
        }),
      })
    );
    const actuacion = await resActuacion.json();
    actuacionId = actuacion.actuacionId;
    version = actuacion.version;
  });

  afterEach(() => {
    vi.resetModules();
  });

  const camposComunes = {
    fechaInicio: "2026-01-01",
    fechaFin: "2026-06-30",
    canonInicial: 50_000,
    condicionIvaCanon: "SIN_IVA",
  };

  it("un CONTRATO no puede pasar a FORMALIZADA editando el estado directamente (debe cumplir H-15)", async () => {
    const { POST: crearInmueble } = await import("@/app/api/alquileres/inmuebles/route");
    const resInmueble = await crearInmueble(
      new NextRequest("http://localhost/api/alquileres/inmuebles", { method: "POST", body: JSON.stringify({ domicilio: "X", localidadId: "LOC-TEST" }) })
    );
    const inmueble = await resInmueble.json();
    const { POST: crearActuacion } = await import("@/app/api/alquileres/actuaciones/route");
    const resContrato = await crearActuacion(
      new NextRequest("http://localhost/api/alquileres/actuaciones", {
        method: "POST",
        body: JSON.stringify({ tipoActuacion: "CONTRATO", inmuebleId: inmueble.inmuebleId, sectorInteresadoAreaId: "AR-06" }),
      })
    );
    const contrato = await resContrato.json();

    const { PATCH } = await import("./route");
    const res = await PATCH(patchActuacion({ version: contrato.version, estadoActuacion: "FORMALIZADA" }), {
      params: Promise.resolve({ id: contrato.actuacionId }),
    });
    expect(res.status).toBe(400);
  });

  it("sin acto administrativo, rechaza pasar un LEGITIMO_ABONO a FORMALIZADA aunque el resto de R4' esté completo", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(patchActuacion({ version, ...camposComunes, estadoActuacion: "FORMALIZADA" }), {
      params: Promise.resolve({ id: actuacionId }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/acto administrativo/);
  });

  it("con al menos un acto administrativo registrado (RF-29), permite pasar el LEGITIMO_ABONO a FORMALIZADA", async () => {
    const { POST: crearActo } = await import("@/app/api/alquileres/actuaciones/[id]/actos-admin/route");
    const resActo = await crearActo(
      new NextRequest("http://localhost/api/alquileres/actuaciones/x/actos-admin", {
        method: "POST",
        body: JSON.stringify({ tipoActo: "RESOLUCION", numeroActo: "123/2026", fechaActo: "2026-01-05", organoEmisor: "Directorio" }),
      }),
      { params: Promise.resolve({ id: actuacionId }) }
    );
    expect(resActo.status).toBe(201);

    const { PATCH } = await import("./route");
    const res = await PATCH(patchActuacion({ version, ...camposComunes, estadoActuacion: "FORMALIZADA" }), {
      params: Promise.resolve({ id: actuacionId }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.estadoActuacion).toBe("FORMALIZADA");
  });
});

describe("PATCH /api/alquileres/actuaciones/[id] — R8 (una ADENDA exige al menos un titular y un firmante para FORMALIZADA)", () => {
  let actuacionId: string;
  let version: number;

  beforeEach(async () => {
    vi.resetModules();
    const { POST: crearInmueble } = await import("@/app/api/alquileres/inmuebles/route");
    const resInmueble = await crearInmueble(
      new NextRequest("http://localhost/api/alquileres/inmuebles", { method: "POST", body: JSON.stringify({ domicilio: "Calle R8", localidadId: "LOC-TEST" }) })
    );
    const inmueble = await resInmueble.json();

    const { POST: crearActuacion } = await import("@/app/api/alquileres/actuaciones/route");
    const resContrato = await crearActuacion(
      new NextRequest("http://localhost/api/alquileres/actuaciones", {
        method: "POST",
        body: JSON.stringify({ tipoActuacion: "CONTRATO", inmuebleId: inmueble.inmuebleId, sectorInteresadoAreaId: "AR-06" }),
      })
    );
    const contrato = await resContrato.json();

    const resAdenda = await crearActuacion(
      new NextRequest("http://localhost/api/alquileres/actuaciones", {
        method: "POST",
        body: JSON.stringify({
          tipoActuacion: "ADENDA",
          inmuebleId: inmueble.inmuebleId,
          sectorInteresadoAreaId: "AR-06",
          actuacionAnteriorId: contrato.actuacionId,
        }),
      })
    );
    const adenda = await resAdenda.json();
    actuacionId = adenda.actuacionId;
    version = adenda.version;
  });

  afterEach(() => {
    vi.resetModules();
  });

  const camposComunes = {
    fechaInicio: "2026-01-01",
    plazoMeses: 12,
    canonInicial: 50_000,
    condicionIvaCanon: "SIN_IVA",
    destinoCategoria: "COMERCIAL",
    destinoDescripcion: "Local",
    firmanteEpeContactoId: "CON-0001",
  };

  it("sin partes cargadas, rechaza pasar la ADENDA a FORMALIZADA", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(patchActuacion({ version, ...camposComunes, estadoActuacion: "FORMALIZADA" }), {
      params: Promise.resolve({ id: actuacionId }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/titular|firmante/);
  });

  it("con un titular y un firmante cargados (RF-10), permite pasar la ADENDA a FORMALIZADA", async () => {
    const { POST: crearPersona } = await import("@/app/api/alquileres/personas/route");
    const resPersona = await crearPersona(
      new NextRequest("http://localhost/api/alquileres/personas", {
        method: "POST",
        body: JSON.stringify({ tipoPersona: "FISICA", apellidoNombreRazonSocial: "Pérez, Juan" }),
      })
    );
    const persona = await resPersona.json();

    const { POST: crearParte } = await import("@/app/api/alquileres/actuaciones/[id]/partes/route");
    await crearParte(
      new NextRequest("http://localhost/api/alquileres/actuaciones/x/partes", {
        method: "POST",
        body: JSON.stringify({ personaId: persona.personaId, rolParte: "TITULAR", orden: 1 }),
      }),
      { params: Promise.resolve({ id: actuacionId }) }
    );
    await crearParte(
      new NextRequest("http://localhost/api/alquileres/actuaciones/x/partes", {
        method: "POST",
        body: JSON.stringify({ personaId: persona.personaId, rolParte: "FIRMANTE", orden: 2 }),
      }),
      { params: Promise.resolve({ id: actuacionId }) }
    );

    const { PATCH } = await import("./route");
    const res = await PATCH(patchActuacion({ version, ...camposComunes, estadoActuacion: "FORMALIZADA" }), {
      params: Promise.resolve({ id: actuacionId }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.estadoActuacion).toBe("FORMALIZADA");
  });
});
