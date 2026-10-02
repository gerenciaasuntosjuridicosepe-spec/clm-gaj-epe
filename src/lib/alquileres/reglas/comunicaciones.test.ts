import { describe, expect, it } from "vitest";
import { armarDestinatarios, validarMarcarComoEnviado } from "./comunicaciones";

describe("Marcar como enviado — T23", () => {
  it("T23: sin fecha, se rechaza", () => {
    expect(validarMarcarComoEnviado(undefined, "2026-01-10").valida).toBe(false);
  });

  it("T23: con fecha futura, se rechaza", () => {
    expect(validarMarcarComoEnviado("2026-01-15", "2026-01-10").valida).toBe(false);
  });

  it("con fecha de hoy, se acepta", () => {
    expect(validarMarcarComoEnviado("2026-01-10", "2026-01-10").valida).toBe(true);
  });

  it("con fecha pasada, se acepta", () => {
    expect(validarMarcarComoEnviado("2026-01-05", "2026-01-10").valida).toBe(true);
  });
});

describe("armarDestinatarios — RF-22", () => {
  const HOY = "2026-06-01";
  const contactos = [
    { cargo: "JEFE_SUCURSAL", mail: "jefe@epe.santafe.gov.ar", vigenteHasta: undefined },
    { cargo: "DESIGNADO", mail: "designado@epe.santafe.gov.ar", vigenteHasta: undefined },
    { cargo: "GERENTE", mail: "gerente@epe.santafe.gov.ar", vigenteHasta: undefined },
    { cargo: "RESPONSABLE_DESIGNADO", mail: "responsable@epe.santafe.gov.ar", vigenteHasta: undefined },
  ];

  it("sector SUCURSAL: jefe de sucursal y designado", () => {
    const destinatarios = armarDestinatarios({ tipoArea: "SUCURSAL" }, contactos, HOY);
    expect(destinatarios).toEqual(["jefe@epe.santafe.gov.ar", "designado@epe.santafe.gov.ar"]);
  });

  it("cualquier otro tipo de área (ej. GERENCIA): gerente y responsable designado", () => {
    const destinatarios = armarDestinatarios({ tipoArea: "GERENCIA" }, contactos, HOY);
    expect(destinatarios).toEqual(["gerente@epe.santafe.gov.ar", "responsable@epe.santafe.gov.ar"]);
  });

  it("RF-33: excluye un contacto no vigente (vigente_hasta en el pasado)", () => {
    const conUnoVencido = [
      ...contactos.slice(0, 1),
      { ...contactos[1], vigenteHasta: "2025-01-01" }, // designado, venció
    ];
    const destinatarios = armarDestinatarios({ tipoArea: "SUCURSAL" }, conUnoVencido, HOY);
    expect(destinatarios).toEqual(["jefe@epe.santafe.gov.ar"]);
  });

  it("incluye un contacto cuya vigente_hasta es exactamente hoy", () => {
    const destinatarios = armarDestinatarios({ tipoArea: "SUCURSAL" }, [{ ...contactos[0], vigenteHasta: HOY }], HOY);
    expect(destinatarios).toEqual(["jefe@epe.santafe.gov.ar"]);
  });
});
