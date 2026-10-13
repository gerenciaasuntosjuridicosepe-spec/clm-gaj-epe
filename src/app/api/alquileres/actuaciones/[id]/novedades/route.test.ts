import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { rolAlquileres: "ADMINISTRADOR", usuarioId: "u-test", name: "Prueba", email: "prueba@ejemplo.test" },
  })),
}));

function post(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/alquileres/actuaciones/x/novedades", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("GET/POST /api/alquileres/actuaciones/[id]/novedades", () => {
  let actuacionId: string;

  beforeEach(async () => {
    vi.resetModules();

    const { POST: crearArea } = await import("@/app/api/alquileres/areas/route");
    const resArea = await crearArea(
      new NextRequest("http://localhost/api/alquileres/areas", {
        method: "POST",
        body: JSON.stringify({ nombre: "Sucursal de Prueba", tipoArea: "SUCURSAL" }),
      })
    );
    const areaId = (await resArea.json()).areaId;

    const { POST: crearInmueble } = await import("@/app/api/alquileres/inmuebles/route");
    const resInmueble = await crearInmueble(
      new NextRequest("http://localhost/api/alquileres/inmuebles", {
        method: "POST",
        body: JSON.stringify({ domicilio: "Calle Novedades", localidadId: "LOC-TEST" }),
      })
    );
    const inmuebleId = (await resInmueble.json()).inmuebleId;

    const { POST: crearActuacion } = await import("@/app/api/alquileres/actuaciones/route");
    const resActuacion = await crearActuacion(
      new NextRequest("http://localhost/api/alquileres/actuaciones", {
        method: "POST",
        body: JSON.stringify({ tipoActuacion: "CONTRATO", inmuebleId, sectorInteresadoAreaId: areaId }),
      })
    );
    actuacionId = (await resActuacion.json()).actuacionId;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("GET: sin novedades cargadas, devuelve []", async () => {
    const { GET } = await import("./route");
    const res = await GET(new NextRequest("http://localhost/x"), { params: Promise.resolve({ id: actuacionId }) });
    expect(await res.json()).toEqual([]);
  });

  it("POST: rechaza sin texto", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({}), { params: Promise.resolve({ id: actuacionId }) });
    expect(res.status).toBe(400);
  });

  it("POST: rechaza un hitoId que no corresponde a esta actuación", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({ texto: "Una nota", hitoId: "H-99" }), { params: Promise.resolve({ id: actuacionId }) });
    expect(res.status).toBe(400);
  });

  it("POST: crea la novedad con la etapa actual de la actuación como foto, y queda visible en el GET", async () => {
    const { POST, GET } = await import("./route");
    const resPost = await POST(post({ texto: "Se habló con el sector, piden una semana más." }), {
      params: Promise.resolve({ id: actuacionId }),
    });
    expect(resPost.status).toBe(201);
    const novedad = await resPost.json();
    expect(novedad.estadoActuacion).toBe("PENDIENTE_AVISO"); // RF-19/R14: un CONTRATO nuevo arranca así
    expect(novedad.texto).toBe("Se habló con el sector, piden una semana más.");

    const resGet = await GET(new NextRequest("http://localhost/x"), { params: Promise.resolve({ id: actuacionId }) });
    const todas = await resGet.json();
    expect(todas).toHaveLength(1);
    expect(todas[0].novedadId).toBe(novedad.novedadId);
  });

  it("POST: acepta un hitoId real generado automáticamente para el CONTRATO (H-01)", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({ texto: "Aviso enviado por nota interna.", hitoId: "H-01" }), {
      params: Promise.resolve({ id: actuacionId }),
    });
    expect(res.status).toBe(201);
    const novedad = await res.json();
    expect(novedad.hitoId).toBe("H-01");
  });
});
