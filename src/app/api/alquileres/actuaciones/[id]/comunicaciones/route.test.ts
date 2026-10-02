import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { rolAlquileres: "ADMINISTRADOR", usuarioId: "u-test", name: "Prueba", email: "prueba@ejemplo.test" },
  })),
}));

function post(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/alquileres/actuaciones/x/comunicaciones", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function patch(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/alquileres/actuaciones/x/comunicaciones", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("POST/PATCH /api/alquileres/actuaciones/[id]/comunicaciones — RF-22/RF-23/RF-24", () => {
  let actuacionId: string;
  let areaId: string;

  beforeEach(async () => {
    vi.resetModules();

    const { POST: crearArea } = await import("@/app/api/alquileres/areas/route");
    const resArea = await crearArea(
      new NextRequest("http://localhost/api/alquileres/areas", {
        method: "POST",
        body: JSON.stringify({ nombre: "Sucursal de Prueba", tipoArea: "SUCURSAL" }),
      })
    );
    const area = await resArea.json();
    areaId = area.areaId;

    const { POST: crearInmueble } = await import("@/app/api/alquileres/inmuebles/route");
    const resInmueble = await crearInmueble(
      new NextRequest("http://localhost/api/alquileres/inmuebles", {
        method: "POST",
        body: JSON.stringify({ domicilio: "Calle Comunicaciones", localidadId: "LOC-TEST" }),
      })
    );
    const inmueble = await resInmueble.json();

    const { POST: crearActuacion } = await import("@/app/api/alquileres/actuaciones/route");
    const resActuacion = await crearActuacion(
      new NextRequest("http://localhost/api/alquileres/actuaciones", {
        method: "POST",
        body: JSON.stringify({ tipoActuacion: "CONTRATO", inmuebleId: inmueble.inmuebleId, sectorInteresadoAreaId: areaId }),
      })
    );
    const actuacion = await resActuacion.json();
    actuacionId = actuacion.actuacionId;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("RF-22: rechaza preparar un AVISO si no hay contactos EPE vigentes para el área", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({ tipoComunicacion: "AVISO" }), { params: Promise.resolve({ id: actuacionId }) });
    expect(res.status).toBe(400);
  });

  it("RF-22/RF-23: prepara un borrador de AVISO con destinatarios armados desde CONTACTOS_EPE vigentes (sector SUCURSAL)", async () => {
    const { POST: crearContacto } = await import("@/app/api/alquileres/contactos-epe/route");
    await crearContacto(
      new NextRequest("http://localhost/api/alquileres/contactos-epe", {
        method: "POST",
        body: JSON.stringify({ areaId, nombre: "Jefe de prueba", cargo: "JEFE_SUCURSAL", mail: "jefe@epe.santafe.gov.ar" }),
      })
    );
    await crearContacto(
      new NextRequest("http://localhost/api/alquileres/contactos-epe", {
        method: "POST",
        body: JSON.stringify({ areaId, nombre: "Designado de prueba", cargo: "DESIGNADO", mail: "designado@epe.santafe.gov.ar" }),
      })
    );
    // Un contacto de otro cargo (GERENTE) no debería aparecer para un sector SUCURSAL.
    await crearContacto(
      new NextRequest("http://localhost/api/alquileres/contactos-epe", {
        method: "POST",
        body: JSON.stringify({ areaId, nombre: "Gerente de prueba", cargo: "GERENTE", mail: "gerente@epe.santafe.gov.ar" }),
      })
    );

    const { POST } = await import("./route");
    const res = await POST(post({ tipoComunicacion: "AVISO" }), { params: Promise.resolve({ id: actuacionId }) });
    expect(res.status).toBe(201);
    const comunicacion = await res.json();
    expect(comunicacion.estadoComunicacion).toBe("BORRADOR");
    expect(comunicacion.hitoId).toBe("H-01");
    expect(comunicacion.destinatarios).toContain("jefe@epe.santafe.gov.ar");
    expect(comunicacion.destinatarios).toContain("designado@epe.santafe.gov.ar");
    expect(comunicacion.destinatarios).not.toContain("gerente@epe.santafe.gov.ar");
  });

  it("RF-23/T23/M16: marcar como enviado sin fecha es rechazado, y cumple H-01 cuando sí se informa", async () => {
    const { POST: crearContacto } = await import("@/app/api/alquileres/contactos-epe/route");
    await crearContacto(
      new NextRequest("http://localhost/api/alquileres/contactos-epe", {
        method: "POST",
        body: JSON.stringify({ areaId, nombre: "Jefe", cargo: "JEFE_SUCURSAL", mail: "jefe@epe.santafe.gov.ar" }),
      })
    );

    const { POST, PATCH } = await import("./route");
    const resBorrador = await POST(post({ tipoComunicacion: "AVISO" }), { params: Promise.resolve({ id: actuacionId }) });
    const borrador = await resBorrador.json();

    const resSinFecha = await PATCH(patch({ comunicacionId: borrador.comunicacionId, version: borrador.version }), {
      params: Promise.resolve({ id: actuacionId }),
    });
    expect(resSinFecha.status).toBe(400);

    const resEnviado = await PATCH(
      patch({ comunicacionId: borrador.comunicacionId, version: borrador.version, fechaEnvio: "2026-01-05" }),
      { params: Promise.resolve({ id: actuacionId }) }
    );
    expect(resEnviado.status).toBe(200);
    const data = await resEnviado.json();
    expect(data.comunicacion.estadoComunicacion).toBe("ENVIADO");
    expect(data.hitos.some((h: { hitoId: string; estadoHito: string }) => h.hitoId === "H-01" && h.estadoHito === "CUMPLIDO")).toBe(
      true
    );
    expect(data.actuacion.estadoActuacion).toBe("AVISO_ENVIADO");
  });

  it("RF-24: registra una CARTA_DOCUMENTO directamente (sin borrador) y cumple H-04", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      post({ tipoComunicacion: "CARTA_DOCUMENTO", numeroCartaDocumento: "CD-0001", fechaRegistro: "2026-01-10" }),
      { params: Promise.resolve({ id: actuacionId }) }
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.comunicacion.estadoComunicacion).toBe("ENVIADO");
    expect(data.comunicacion.observaciones).toBe("CD-0001");
    expect(data.hitos.some((h: { hitoId: string; estadoHito: string }) => h.hitoId === "H-04" && h.estadoHito === "CUMPLIDO")).toBe(
      true
    );
  });

  it("RF-24: una carta documento sin número es rechazada", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({ tipoComunicacion: "CARTA_DOCUMENTO", fechaRegistro: "2026-01-10" }), {
      params: Promise.resolve({ id: actuacionId }),
    });
    expect(res.status).toBe(400);
  });

  it("rechaza preparar un segundo borrador de AVISO mientras ya hay uno pendiente de enviar", async () => {
    const { POST: crearContacto } = await import("@/app/api/alquileres/contactos-epe/route");
    await crearContacto(
      new NextRequest("http://localhost/api/alquileres/contactos-epe", {
        method: "POST",
        body: JSON.stringify({ areaId, nombre: "Jefe", cargo: "JEFE_SUCURSAL", mail: "jefe@epe.santafe.gov.ar" }),
      })
    );

    const { POST } = await import("./route");
    const primero = await POST(post({ tipoComunicacion: "AVISO" }), { params: Promise.resolve({ id: actuacionId }) });
    expect(primero.status).toBe(201);

    const segundo = await POST(post({ tipoComunicacion: "AVISO" }), { params: Promise.resolve({ id: actuacionId }) });
    expect(segundo.status).toBe(400);
  });

  it("rechaza registrar una CARTA_DOCUMENTO para H-04 si ya está CUMPLIDO", async () => {
    const { POST } = await import("./route");
    const primero = await POST(
      post({ tipoComunicacion: "CARTA_DOCUMENTO", numeroCartaDocumento: "CD-0001", fechaRegistro: "2026-01-10" }),
      { params: Promise.resolve({ id: actuacionId }) }
    );
    expect(primero.status).toBe(201);

    const segundo = await POST(
      post({ tipoComunicacion: "CARTA_DOCUMENTO", numeroCartaDocumento: "CD-0002", fechaRegistro: "2026-01-11" }),
      { params: Promise.resolve({ id: actuacionId }) }
    );
    expect(segundo.status).toBe(400);
  });
});
