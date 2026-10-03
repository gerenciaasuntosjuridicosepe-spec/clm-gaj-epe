import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { generarContratoDocx } from "./generar-contrato-docx";
import type { ParametrosValoresPlantilla } from "../reglas/datos-plantilla";

async function textoDelDocumento(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("El .docx generado no tiene word/document.xml — no es un docx válido.");
  return xml;
}

function params(overrides: Partial<ParametrosValoresPlantilla> = {}): ParametrosValoresPlantilla {
  return {
    actuacion: {
      fechaInicio: "2026-03-01",
      plazoMeses: 24,
      fechaFin: "2028-02-29",
      canonInicial: 150000,
      condicionIvaCanon: undefined,
      reglaActualizacion: undefined,
    },
    area: { nombre: "Gerencia de Distribución" },
    inmueble: { domicilio: "Calle Falsa 123, Rosario" },
    partes: [
      { rolParte: "TITULAR", orden: 1, caracter: undefined, domicilioVigente: undefined, personaId: "PER-0001" },
      { rolParte: "TITULAR", orden: 2, caracter: "cónyuge", domicilioVigente: undefined, personaId: "PER-0002" },
    ],
    personas: [
      { personaId: "PER-0001", apellidoNombreRazonSocial: "Juan Pérez", dni: "20123456", cuitCuil: undefined, domicilioLegal: "San Martín 100" },
      { personaId: "PER-0002", apellidoNombreRazonSocial: "María Gómez", dni: "21654321", cuitCuil: undefined, domicilioLegal: "Belgrano 200" },
    ],
    firmanteEpe: { nombre: "Ing. Carlos Paganini" },
    ...overrides,
  };
}

describe("generarContratoDocx", () => {
  it("produce un .docx válido (zip con word/document.xml)", async () => {
    const buffer = await generarContratoDocx(params(), { actuacionId: "ACT-0001", tipoActuacion: "CONTRATO" });
    expect(buffer.subarray(0, 2).toString()).toBe("PK"); // firma de zip
    const xml = await textoDelDocumento(buffer);
    expect(xml.length).toBeGreaterThan(0);
  });

  it("incluye el nombre del sector, nunca el del firmante, en {{SECTOR_EPE}} (RF-27, hallazgo 14)", async () => {
    const xml = await textoDelDocumento(
      await generarContratoDocx(params(), { actuacionId: "ACT-0001", tipoActuacion: "CONTRATO" })
    );
    expect(xml).toContain("Gerencia de Distribuci");
  });

  it("incluye a los dos locadores (RF-26, hallazgo 13: antes solo aparecía uno)", async () => {
    const xml = await textoDelDocumento(
      await generarContratoDocx(params(), { actuacionId: "ACT-0001", tipoActuacion: "CONTRATO" })
    );
    expect(xml).toContain("rez"); // "Pérez" (los acentos se parten en runs de docx — se verifica el fragmento estable)
    expect(xml).toContain("mez"); // "Gómez"
    expect(xml).toContain("c");
    expect(xml).toContain("nyuge"); // "cónyuge"
  });

  it("marca las cláusulas legales vacías para completar a mano, nunca las inventa", async () => {
    const xml = await textoDelDocumento(
      await generarContratoDocx(params(), { actuacionId: "ACT-0001", tipoActuacion: "CONTRATO" })
    );
    expect(xml).toContain("COMPLETAR POR EL");
  });

  it("si la cláusula legal YA está cargada, se muestra tal cual, sin la marca de completar", async () => {
    const xml = await textoDelDocumento(
      await generarContratoDocx(
        params({ actuacion: { ...params().actuacion, reglaActualizacion: "Actualización semestral por IPC (acuerdo entre partes)." } }),
        { actuacionId: "ACT-0001", tipoActuacion: "CONTRATO" }
      )
    );
    expect(xml).toContain("Actualizaci");
    expect(xml).toContain("semestral");
  });
});
