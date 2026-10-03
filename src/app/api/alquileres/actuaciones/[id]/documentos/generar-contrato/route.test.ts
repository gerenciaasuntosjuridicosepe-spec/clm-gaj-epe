import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import JSZip from "jszip";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { rolAlquileres: "ADMINISTRADOR", usuarioId: "u-test", name: "Prueba", email: "prueba@ejemplo.test" },
  })),
}));

describe("GET /api/alquileres/actuaciones/[id]/documentos/generar-contrato — RF-25/26/27", () => {
  let actuacionId: string;

  beforeEach(async () => {
    vi.resetModules();

    const { POST: crearInmueble } = await import("@/app/api/alquileres/inmuebles/route");
    const inmueble = await (
      await crearInmueble(
        new NextRequest("http://localhost/api/alquileres/inmuebles", {
          method: "POST",
          body: JSON.stringify({ domicilio: "Calle Contrato 1", localidadId: "LOC-TEST" }),
        })
      )
    ).json();

    const { POST: crearArea } = await import("@/app/api/alquileres/areas/route");
    const area = await (
      await crearArea(
        new NextRequest("http://localhost/api/alquileres/areas", {
          method: "POST",
          body: JSON.stringify({ nombre: "Gerencia de Distribución", tipoArea: "GERENCIA" }),
        })
      )
    ).json();

    const { POST: crearActuacion } = await import("@/app/api/alquileres/actuaciones/route");
    const actuacion = await (
      await crearActuacion(
        new NextRequest("http://localhost/api/alquileres/actuaciones", {
          method: "POST",
          body: JSON.stringify({ tipoActuacion: "CONTRATO", inmuebleId: inmueble.inmuebleId, sectorInteresadoAreaId: area.areaId }),
        })
      )
    ).json();
    actuacionId = actuacion.actuacionId;

    const { POST: crearPersona } = await import("@/app/api/alquileres/personas/route");
    const persona1 = await (
      await crearPersona(
        new NextRequest("http://localhost/api/alquileres/personas", {
          method: "POST",
          body: JSON.stringify({ apellidoNombreRazonSocial: "Juan Pérez", tipoPersona: "FISICA", dni: "20123456" }),
        })
      )
    ).json();
    const persona2 = await (
      await crearPersona(
        new NextRequest("http://localhost/api/alquileres/personas", {
          method: "POST",
          body: JSON.stringify({ apellidoNombreRazonSocial: "María Gómez", tipoPersona: "FISICA", dni: "21654321" }),
        })
      )
    ).json();

    const { POST: crearParte } = await import("@/app/api/alquileres/actuaciones/[id]/partes/route");
    for (const [persona, orden] of [[persona1, 1], [persona2, 2]] as const) {
      await crearParte(
        new NextRequest(`http://localhost/api/alquileres/actuaciones/${actuacionId}/partes`, {
          method: "POST",
          body: JSON.stringify({ personaId: persona.personaId, rolParte: "TITULAR", orden }),
        }),
        { params: Promise.resolve({ id: actuacionId }) }
      );
    }
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("devuelve un .docx con los dos locadores y el nombre del área, nunca el del firmante", async () => {
    const { GET } = await import("./route");
    const res = await GET(new NextRequest(`http://localhost/api/alquileres/actuaciones/${actuacionId}/documentos/generar-contrato`), {
      params: Promise.resolve({ id: actuacionId }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("wordprocessingml.document");
    expect(res.headers.get("Content-Disposition")).toContain(actuacionId);

    const buffer = Buffer.from(await res.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file("word/document.xml")?.async("string");
    expect(xml).toContain("Distribuci"); // nombre del área
    expect(xml).toContain("rez"); // Pérez
    expect(xml).toContain("mez"); // Gómez
  });

  it("devuelve 404 si la actuación no existe", async () => {
    const { GET } = await import("./route");
    const res = await GET(new NextRequest("http://localhost/api/alquileres/actuaciones/ACT-9999/documentos/generar-contrato"), {
      params: Promise.resolve({ id: "ACT-9999" }),
    });
    expect(res.status).toBe(404);
  });
});
