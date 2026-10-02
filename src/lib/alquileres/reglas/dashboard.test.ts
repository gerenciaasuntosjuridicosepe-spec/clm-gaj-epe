import { describe, expect, it } from "vitest";
import { calcularDashboard } from "./dashboard";
import { crearActuacion, crearActuacionHito } from "../test-fixtures";

const HOY = "2026-06-01";
const CFG = [
  { hitoId: "H-01", generaAlerta: true },
  { hitoId: "H-02", generaAlerta: true },
];

describe("calcularDashboard", () => {
  it("cuenta un contrato vigente y su franja de semáforo", () => {
    const vigente = crearActuacion({
      actuacionId: "ACT-0001",
      fechaInicio: "2026-01-01",
      fechaFin: "2026-12-31", // ~213 días desde el 01/06 -> verde (>180)
    });

    const { resumen } = calcularDashboard({
      actuaciones: [vigente],
      hitos: [],
      documentos: [],
      cfgHitosTipo: CFG,
      hoy: HOY,
      alicuotaIva: 21,
    });

    expect(resumen.contratosVigentes).toBe(1);
    expect(resumen.vencenVerde).toBe(1);
  });

  it("T9/T10: A5 se enciende para un vencido sin sucesora, se apaga con NO_RENOVADO", () => {
    const vencidoSinSucesora = crearActuacion({ actuacionId: "ACT-0001", fechaFin: "2020-01-01", estadoActuacion: "CERRADA" });
    const vencidoNoRenovado = crearActuacion({ actuacionId: "ACT-0002", fechaFin: "2020-01-01", estadoActuacion: "NO_RENOVADO" });

    const { resumen, colaDeTrabajo } = calcularDashboard({
      actuaciones: [vencidoSinSucesora, vencidoNoRenovado],
      hitos: [],
      documentos: [],
      cfgHitosTipo: CFG,
      hoy: HOY,
      alicuotaIva: 21,
    });

    expect(resumen.ocupacionSinContrato).toBe(1);
    expect(colaDeTrabajo.filter((i) => i.alerta === "A5").map((i) => i.actuacionId)).toEqual(["ACT-0001"]);
  });

  it("cuenta legítimo abono en curso (sin fecha_fin, abierto)", () => {
    const la = crearActuacion({ actuacionId: "ACT-LA1", tipoActuacion: "LEGITIMO_ABONO" });
    const { resumen } = calcularDashboard({
      actuaciones: [la],
      hitos: [],
      documentos: [],
      cfgHitosTipo: CFG,
      hoy: HOY,
      alicuotaIva: 21,
    });
    expect(resumen.legitimoAbonoEnCurso).toBe(1);
  });

  it("A4: cuenta un hito atrasado y lo agrega a la cola de trabajo", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001" });
    const hitoAtrasado = crearActuacionHito({
      actuacionHitoId: "AHI-1",
      actuacionId: "ACT-0001",
      hitoId: "H-01",
      fechaPrevista: "2026-01-01",
    });

    const { resumen, colaDeTrabajo } = calcularDashboard({
      actuaciones: [contrato],
      hitos: [hitoAtrasado],
      documentos: [],
      cfgHitosTipo: CFG,
      hoy: HOY,
      alicuotaIva: 21,
    });

    expect(resumen.hitosAtrasados).toBe(1);
    expect(colaDeTrabajo.some((i) => i.alerta === "A4")).toBe(true);
  });

  it("A6: formalizada sin escaneado firmado", () => {
    const formalizada = crearActuacion({ actuacionId: "ACT-0001", estadoActuacion: "FORMALIZADA" });
    const { resumen } = calcularDashboard({
      actuaciones: [formalizada],
      hitos: [],
      documentos: [],
      cfgHitosTipo: CFG,
      hoy: HOY,
      alicuotaIva: 21,
    });
    expect(resumen.formalizadasSinEscaneado).toBe(1);
  });

  it("cola de trabajo ordenada por urgencia: A5 antes que A1, A1 antes que A4/A6", () => {
    const a5 = crearActuacion({ actuacionId: "ACT-A5", fechaFin: "2020-01-01", estadoActuacion: "CERRADA" });
    const a1 = crearActuacion({ actuacionId: "ACT-A1", fechaFin: "2026-09-01", estadoActuacion: "EN_TRAMITE" });
    const conHito = crearActuacion({ actuacionId: "ACT-A4" });
    const hito = crearActuacionHito({ actuacionHitoId: "AHI-1", actuacionId: "ACT-A4", hitoId: "H-01", fechaPrevista: "2026-01-01" });

    const { colaDeTrabajo } = calcularDashboard({
      actuaciones: [a5, a1, conHito],
      hitos: [hito],
      documentos: [],
      cfgHitosTipo: CFG,
      hoy: HOY,
      alicuotaIva: 21,
    });

    const orden = colaDeTrabajo.map((i) => i.alerta);
    expect(orden.indexOf("A5")).toBeLessThan(orden.indexOf("A1"));
    expect(orden.indexOf("A1")).toBeLessThan(orden.indexOf("A4"));
  });

  it("T7: canon neto total excluye los contratos sin dato de IVA", () => {
    const conIva = crearActuacion({
      actuacionId: "ACT-0001",
      fechaInicio: "2026-01-01",
      fechaFin: "2026-12-31",
      canonInicial: 1_000_000,
      condicionIvaCanon: "SIN_IVA",
    });
    const sinDatoIva = crearActuacion({
      actuacionId: "ACT-0002",
      fechaInicio: "2026-01-01",
      fechaFin: "2026-12-31",
      canonInicial: 500_000,
    });

    const { resumen } = calcularDashboard({
      actuaciones: [conIva, sinDatoIva],
      hitos: [],
      documentos: [],
      cfgHitosTipo: CFG,
      hoy: HOY,
      alicuotaIva: 21,
    });

    expect(resumen.canonNetoTotal).toBe(1_000_000);
    expect(resumen.contratosSinDatoIva).toBe(1);
  });
});
