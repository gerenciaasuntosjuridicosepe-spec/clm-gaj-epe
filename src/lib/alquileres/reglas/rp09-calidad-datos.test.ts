import { describe, expect, it } from "vitest";
import { calcularCalidadDatos } from "./rp09-calidad-datos";
import { crearActuacion, crearInmueble, crearParte, crearPersona } from "../test-fixtures";

describe("calcularCalidadDatos — RP-09", () => {
  it("detecta una actuación en curso sin firmante y sin condición de IVA", () => {
    const actuacion = crearActuacion({ actuacionId: "ACT-0001", estadoActuacion: "EN_TRAMITE" });
    const hallazgos = calcularCalidadDatos({ actuaciones: [actuacion], inmuebles: [], partes: [], personas: [], documentos: [] });

    expect(hallazgos.some((h) => h.tipo === "SIN_FIRMANTE" && h.actuacionId === "ACT-0001")).toBe(true);
    expect(hallazgos.some((h) => h.tipo === "SIN_CONDICION_IVA" && h.actuacionId === "ACT-0001")).toBe(true);
  });

  it("no marca SIN_FIRMANTE ni SIN_CONDICION_IVA para una actuación en estado terminal (ya no tiene sentido pedírselo)", () => {
    const actuacion = crearActuacion({ actuacionId: "ACT-0001", estadoActuacion: "CERRADA" });
    const hallazgos = calcularCalidadDatos({ actuaciones: [actuacion], inmuebles: [], partes: [], personas: [], documentos: [] });
    expect(hallazgos).toHaveLength(0);
  });

  it("detecta un locador (parte TITULAR) sin mail cargado", () => {
    const actuacion = crearActuacion({ actuacionId: "ACT-0001", estadoActuacion: "EN_TRAMITE", condicionIvaCanon: "SIN_IVA", firmanteEpeContactoId: "CON-1" });
    const persona = crearPersona({ personaId: "PER-1", apellidoNombreRazonSocial: "Pérez, Juan" });
    const parte = crearParte({ parteId: "PAR-1", actuacionId: "ACT-0001", personaId: "PER-1", rolParte: "TITULAR", orden: 1 });

    const hallazgos = calcularCalidadDatos({ actuaciones: [actuacion], inmuebles: [], partes: [parte], personas: [persona], documentos: [] });

    expect(hallazgos).toHaveLength(1);
    expect(hallazgos[0]).toMatchObject({ tipo: "SIN_MAIL_LOCADOR", personaId: "PER-1" });
  });

  it("detecta un inmueble sin partida inmobiliaria", () => {
    const inmueble = crearInmueble({ inmuebleId: "INM-0001", partidaInmobiliaria: undefined });
    const hallazgos = calcularCalidadDatos({ actuaciones: [], inmuebles: [inmueble], partes: [], personas: [], documentos: [] });
    expect(hallazgos).toHaveLength(1);
    expect(hallazgos[0].tipo).toBe("SIN_PARTIDA");
  });

  it("detecta personas duplicadas por DNI", () => {
    const p1 = crearPersona({ personaId: "PER-1", apellidoNombreRazonSocial: "Pérez, Juan", dni: "20111222" });
    const p2 = crearPersona({ personaId: "PER-2", apellidoNombreRazonSocial: "Pérez, J.", dni: "20111222" });
    const hallazgos = calcularCalidadDatos({ actuaciones: [], inmuebles: [], partes: [], personas: [p1, p2], documentos: [] });
    expect(hallazgos).toHaveLength(1);
    expect(hallazgos[0].tipo).toBe("PERSONA_DUPLICADA");
  });

  it("una actuación completa, sin hallazgos de ningún tipo, da lista vacía", () => {
    const actuacion = crearActuacion({
      actuacionId: "ACT-0001",
      estadoActuacion: "FORMALIZADA",
      condicionIvaCanon: "SIN_IVA",
      firmanteEpeContactoId: "CON-1",
    });
    const hallazgos = calcularCalidadDatos({
      actuaciones: [actuacion],
      inmuebles: [],
      partes: [],
      personas: [],
      documentos: [{ actuacionId: "ACT-0001", tipoDocumento: "ESCANEADO", firmado: true } as never],
    });
    expect(hallazgos).toHaveLength(0);
  });
});
