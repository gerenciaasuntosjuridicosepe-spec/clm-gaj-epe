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

  it("proximosVencimientos: los 5 más próximos, ordenados ascendente", () => {
    const actuaciones = ["2026-07-01", "2026-06-15", "2026-12-31", "2026-08-01", "2026-09-01", "2026-10-01"].map((fechaFin, i) =>
      crearActuacion({ actuacionId: `ACT-000${i}`, fechaInicio: "2025-01-01", fechaFin })
    );

    const { proximosVencimientos } = calcularDashboard({
      actuaciones,
      hitos: [],
      documentos: [],
      cfgHitosTipo: CFG,
      hoy: HOY,
      alicuotaIva: 21,
    });

    expect(proximosVencimientos).toHaveLength(5);
    expect(proximosVencimientos.map((p) => p.vencimiento)).toEqual([
      "2026-06-15",
      "2026-07-01",
      "2026-08-01",
      "2026-09-01",
      "2026-10-01",
    ]);
  });

  it("vencimientosPorMes: 12 meses desde el mes de 'hoy', con conteo correcto y fuera de rango excluido", () => {
    const actuaciones = ["2026-06-15", "2026-06-20", "2026-07-01", "2027-05-31", "2028-01-01"].map((fechaFin, i) =>
      crearActuacion({ actuacionId: `ACT-M${i}`, fechaInicio: "2025-01-01", fechaFin })
    );

    const { vencimientosPorMes } = calcularDashboard({
      actuaciones,
      hitos: [],
      documentos: [],
      cfgHitosTipo: CFG,
      hoy: HOY, // 2026-06-01
      alicuotaIva: 21,
    });

    expect(vencimientosPorMes).toHaveLength(12);
    expect(vencimientosPorMes[0]).toEqual({ mes: "2026-06", cantidad: 2 }); // dos vencimientos en junio
    expect(vencimientosPorMes[1]).toEqual({ mes: "2026-07", cantidad: 1 });
    expect(vencimientosPorMes[11]).toEqual({ mes: "2027-05", cantidad: 1 }); // último mes de la ventana de 12
    const total = vencimientosPorMes.reduce((acc, m) => acc + m.cantidad, 0);
    expect(total).toBe(4); // el de 2028 queda afuera de la ventana de 12 meses
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

  it("legítimo abono abierto: días = desde fecha_inicio hasta hoy, sin fecha_inicio = null", () => {
    const conInicio = crearActuacion({ actuacionId: "ACT-LA1", tipoActuacion: "LEGITIMO_ABONO", fechaInicio: "2026-05-01" });
    const sinInicio = crearActuacion({ actuacionId: "ACT-LA2", tipoActuacion: "LEGITIMO_ABONO", fechaInicio: undefined });
    const { legitimosAbonoEnCurso } = calcularDashboard({
      actuaciones: [conInicio, sinInicio],
      hitos: [],
      documentos: [],
      cfgHitosTipo: CFG,
      hoy: HOY, // 2026-06-01
      alicuotaIva: 21,
    });

    const item1 = legitimosAbonoEnCurso.find((i) => i.actuacionId === "ACT-LA1")!;
    expect(item1.dias).toBe(31); // 01/05 -> 01/06
    expect(item1.tieneFechaFin).toBe(false);

    const item2 = legitimosAbonoEnCurso.find((i) => i.actuacionId === "ACT-LA2")!;
    expect(item2.dias).toBeNull();
  });

  it("legítimo abono con fecha_fin definida (futura): días = fecha_inicio a fecha_fin, no hasta hoy", () => {
    const conFechaFin = crearActuacion({
      actuacionId: "ACT-LA3",
      tipoActuacion: "LEGITIMO_ABONO",
      fechaInicio: "2026-01-01",
      fechaFin: "2026-01-31", // en el futuro respecto del "hoy" de esta prueba (15/01) — todavía en curso
    });
    const { legitimosAbonoEnCurso } = calcularDashboard({
      actuaciones: [conFechaFin],
      hitos: [],
      documentos: [],
      cfgHitosTipo: CFG,
      hoy: "2026-01-15",
      alicuotaIva: 21,
    });

    const item = legitimosAbonoEnCurso.find((i) => i.actuacionId === "ACT-LA3")!;
    expect(item.dias).toBe(30); // fecha_inicio -> fecha_fin, no hasta "hoy" (15/01)
    expect(item.tieneFechaFin).toBe(true);
  });

  it("alertasPorSector: rankea los sectores con más alertas, de mayor a menor", () => {
    const a5Sector1 = crearActuacion({ actuacionId: "ACT-A5", fechaFin: "2020-01-01", estadoActuacion: "CERRADA", sectorInteresadoAreaId: "AR-01" });
    const a1Sector1 = crearActuacion({ actuacionId: "ACT-A1", fechaFin: "2026-09-01", estadoActuacion: "EN_TRAMITE", sectorInteresadoAreaId: "AR-01" });
    const a6Sector2 = crearActuacion({ actuacionId: "ACT-A6", estadoActuacion: "FORMALIZADA", sectorInteresadoAreaId: "AR-02" });

    const { alertasPorSector } = calcularDashboard({
      actuaciones: [a5Sector1, a1Sector1, a6Sector2],
      hitos: [],
      documentos: [],
      cfgHitosTipo: CFG,
      hoy: HOY,
      alicuotaIva: 21,
    });

    expect(alertasPorSector).toEqual([
      { sectorInteresadoAreaId: "AR-01", cantidad: 2 },
      { sectorInteresadoAreaId: "AR-02", cantidad: 1 },
    ]);
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
