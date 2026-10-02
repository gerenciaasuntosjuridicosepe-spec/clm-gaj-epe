import { describe, expect, it } from "vitest";
import { calcularCarteraVigente } from "./rp02-cartera";
import { crearActuacion, crearInmueble, crearParte, crearPersona } from "../test-fixtures";

const HOY = "2026-06-01";

describe("calcularCarteraVigente — RP-02", () => {
  it("incluye un contrato vigente con sus locadores, canon neto y totales", () => {
    const contrato = crearActuacion({
      actuacionId: "ACT-0001",
      inmuebleId: "INM-0001",
      fechaInicio: "2026-01-01",
      fechaFin: "2026-12-31",
      canonInicial: 100_000,
      condicionIvaCanon: "SIN_IVA",
    });
    const inmueble = crearInmueble({ inmuebleId: "INM-0001", domicilio: "Calle Falsa 123" });
    const persona = crearPersona({ personaId: "PER-1", apellidoNombreRazonSocial: "Pérez, Juan", dni: "20111222" });
    const parte = crearParte({ parteId: "PAR-1", actuacionId: "ACT-0001", personaId: "PER-1", rolParte: "TITULAR", orden: 1 });

    const { filas, totalNeto, cantidadSinDatoIva } = calcularCarteraVigente({
      actuaciones: [contrato],
      inmuebles: [inmueble],
      partes: [parte],
      personas: [persona],
      hoy: HOY,
      alicuotaIva: 21,
    });

    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ inmuebleDomicilio: "Calle Falsa 123", canonNeto: 100_000 });
    expect(filas[0].locadores).toContain("Pérez, Juan");
    expect(totalNeto).toBe(100_000);
    expect(cantidadSinDatoIva).toBe(0);
  });

  it("un contrato sin condición de IVA se cuenta pero no suma al total", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001", fechaInicio: "2026-01-01", fechaFin: "2026-12-31", canonInicial: 50_000 });
    const { filas, totalNeto, cantidadSinDatoIva } = calcularCarteraVigente({
      actuaciones: [contrato],
      inmuebles: [],
      partes: [],
      personas: [],
      hoy: HOY,
      alicuotaIva: 21,
    });
    expect(filas[0].canonNeto).toBeUndefined();
    expect(totalNeto).toBe(0);
    expect(cantidadSinDatoIva).toBe(1);
  });

  it("no incluye contratos vencidos, futuros, ni otros tipos de actuación", () => {
    const vencido = crearActuacion({ actuacionId: "ACT-A", fechaInicio: "2019-01-01", fechaFin: "2020-01-01" });
    const legitimoAbono = crearActuacion({ actuacionId: "ACT-B", tipoActuacion: "LEGITIMO_ABONO" });
    const { filas } = calcularCarteraVigente({ actuaciones: [vencido, legitimoAbono], inmuebles: [], partes: [], personas: [], hoy: HOY, alicuotaIva: 21 });
    expect(filas).toHaveLength(0);
  });

  it("IVA_INCLUIDO divide por 1 + alicuota/100 (R16)", () => {
    const contrato = crearActuacion({
      actuacionId: "ACT-0001",
      fechaInicio: "2026-01-01",
      fechaFin: "2026-12-31",
      canonInicial: 121_000,
      condicionIvaCanon: "IVA_INCLUIDO",
    });
    const { filas, totalNeto } = calcularCarteraVigente({ actuaciones: [contrato], inmuebles: [], partes: [], personas: [], hoy: HOY, alicuotaIva: 21 });
    expect(filas[0].canonNeto).toBeCloseTo(100_000, 0);
    expect(totalNeto).toBeCloseTo(100_000, 0);
  });
});
