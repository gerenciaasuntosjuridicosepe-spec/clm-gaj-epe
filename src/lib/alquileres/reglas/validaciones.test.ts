import { describe, expect, it } from "vitest";
import {
  formatearCuit,
  neutralizarFormula,
  recortarEspacios,
  validarCuit,
  validarDni,
  validarMail,
  validarMailEpe,
  validarNroExpediente,
  validarPartidaInmobiliaria,
  validarUrlDocumento,
} from "./validaciones";

describe("validaciones — nro_expediente (T11)", () => {
  it("acepta los dos formatos válidos", () => {
    expect(validarNroExpediente("EE-2026-00045698-APPSF-OD")).toBe(true);
    expect(validarNroExpediente("1-2020-966273")).toBe(true);
  });

  it("rechaza otros formatos", () => {
    expect(validarNroExpediente("2020-966273")).toBe(false);
    expect(validarNroExpediente("EE-2026-45698")).toBe(false);
    expect(validarNroExpediente("1-26-966273")).toBe(false);
    expect(validarNroExpediente("")).toBe(false);
  });
});

describe("validaciones — CUIT/CUIL módulo 11 (T12)", () => {
  it("T12: 20-12345678-6 es válido", () => {
    expect(validarCuit("20-12345678-6")).toBe(true);
  });

  it("T12: 20-12345678-5 es inválido (dígito verificador incorrecto)", () => {
    expect(validarCuit("20-12345678-5")).toBe(false);
  });

  it("acepta sin guiones también", () => {
    expect(validarCuit("20123456786")).toBe(true);
  });

  it("rechaza longitudes incorrectas o no numéricas", () => {
    expect(validarCuit("123")).toBe(false);
    expect(validarCuit("20-1234567A-6")).toBe(false);
  });

  it("formatearCuit agrega los guiones en las posiciones correctas", () => {
    expect(formatearCuit("20123456786")).toBe("20-12345678-6");
  });
});

describe("validaciones — partida inmobiliaria", () => {
  it("acepta el formato NN-NN-NN-NNNNNN/NNNN-N", () => {
    expect(validarPartidaInmobiliaria("12-34-56-789012/3456-7")).toBe(true);
  });
  it("rechaza formatos distintos", () => {
    expect(validarPartidaInmobiliaria("12-34-56")).toBe(false);
  });
});

describe("validaciones — DNI", () => {
  it("acepta 7 u 8 dígitos", () => {
    expect(validarDni("1234567")).toBe(true);
    expect(validarDni("12345678")).toBe(true);
  });
  it("rechaza otras longitudes o no numérico", () => {
    expect(validarDni("123456")).toBe(false);
    expect(validarDni("123456789")).toBe(false);
    expect(validarDni("1234567A")).toBe(false);
  });
});

describe("validaciones — URL de documento (RF-28)", () => {
  it("acepta enlaces https de drive.google.com y docs.google.com", () => {
    expect(validarUrlDocumento("https://drive.google.com/file/d/abc123/view")).toBe(true);
    expect(validarUrlDocumento("https://docs.google.com/document/d/abc123/edit")).toBe(true);
  });
  it("rechaza otros dominios o protocolos", () => {
    expect(validarUrlDocumento("http://drive.google.com/file/d/abc123/view")).toBe(false);
    expect(validarUrlDocumento("https://evil.com/drive.google.com")).toBe(false);
    expect(validarUrlDocumento("no-es-una-url")).toBe(false);
  });
});

describe("validaciones — mail e institucional", () => {
  it("valida formato de mail genérico", () => {
    expect(validarMail("persona@ejemplo.com")).toBe(true);
    expect(validarMail("no-es-mail")).toBe(false);
  });
  it("CONTACTOS_EPE exige dominio epe.santafe.gov.ar", () => {
    expect(validarMailEpe("jefe.sucursal@epe.santafe.gov.ar")).toBe(true);
    expect(validarMailEpe("persona@gmail.com")).toBe(false);
  });
});

describe("validaciones — protección contra inyección de fórmulas (T13, NF-S4)", () => {
  it("T13: un nombre que empieza con '=' se guarda con comilla simple antepuesta", () => {
    expect(neutralizarFormula("=HOY()")).toBe("'=HOY()");
  });
  it("neutraliza +, -, @ también", () => {
    expect(neutralizarFormula("+1234")).toBe("'+1234");
    expect(neutralizarFormula("-1234")).toBe("'-1234");
    expect(neutralizarFormula("@usuario")).toBe("'@usuario");
  });
  it("texto normal no se modifica", () => {
    expect(neutralizarFormula("Juan Pérez")).toBe("Juan Pérez");
  });
  it("string vacío no se modifica", () => {
    expect(neutralizarFormula("")).toBe("");
  });
});

describe("recortarEspacios", () => {
  it("recorta espacios al inicio y al final", () => {
    expect(recortarEspacios("  Juan Pérez  ")).toBe("Juan Pérez");
  });
});
