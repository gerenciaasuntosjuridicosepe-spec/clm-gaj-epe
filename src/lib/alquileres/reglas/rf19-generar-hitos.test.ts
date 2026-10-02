import { describe, expect, it } from "vitest";
import { buscarContratoPredecesor, generarHitosParaActuacion } from "./rf19-generar-hitos";
import { CFG_HITOS_TIPO_SEED } from "../catalogos/hitos-seed";
import { crearActuacion } from "../test-fixtures";
import type { Feriado } from "../tipos";

function feriado(fecha: string): Feriado {
  return { fecha, descripcion: "prueba", ambito: "NACIONAL", activo: true };
}

describe("buscarContratoPredecesor", () => {
  it("sin actuacion_anterior_id, no hay predecesor (primera del inmueble)", () => {
    const a = crearActuacion({ actuacionId: "ACT-0001" });
    expect(buscarContratoPredecesor(a, [a])).toBeUndefined();
  });

  it("encuentra el CONTRATO anterior directo", () => {
    const a = crearActuacion({ actuacionId: "ACT-0001" });
    const b = crearActuacion({ actuacionId: "ACT-0002", actuacionAnteriorId: "ACT-0001" });
    expect(buscarContratoPredecesor(b, [a, b])?.actuacionId).toBe("ACT-0001");
  });

  it("T8: salta un LEGITIMO_ABONO intermedio (A -> LA -> B, el predecesor de B es A)", () => {
    const a = crearActuacion({ actuacionId: "ACT-0001" });
    const la = crearActuacion({ actuacionId: "ACT-LA1", tipoActuacion: "LEGITIMO_ABONO", actuacionAnteriorId: "ACT-0001" });
    const b = crearActuacion({ actuacionId: "ACT-0002", actuacionAnteriorId: "ACT-LA1" });
    expect(buscarContratoPredecesor(b, [a, la, b])?.actuacionId).toBe("ACT-0001");
  });
});

describe("generarHitosParaActuacion (RF-19)", () => {
  it("ADENDA y LEGITIMO_ABONO no generan hitos (R14)", () => {
    const adenda = crearActuacion({ actuacionId: "ACT-0002", tipoActuacion: "ADENDA", actuacionAnteriorId: "ACT-0001" });
    const resultado = generarHitosParaActuacion({
      actuacion: adenda,
      todasLasActuaciones: [adenda],
      cfgHitosTipo: CFG_HITOS_TIPO_SEED,
      feriados: [],
    });
    expect(resultado).toEqual([]);
  });

  it("primera actuación del inmueble (sin predecesor): los hitos ANTES_FIN_CONTRATO quedan sin fecha_prevista, sin inventar nada", () => {
    const a = crearActuacion({ actuacionId: "ACT-0001" });
    const resultado = generarHitosParaActuacion({
      actuacion: a,
      todasLasActuaciones: [a],
      cfgHitosTipo: CFG_HITOS_TIPO_SEED,
      feriados: [],
    });

    const h01 = resultado.find((h) => h.hitoId === "H-01");
    const h04 = resultado.find((h) => h.hitoId === "H-04");
    expect(h01?.fechaPrevista).toBeUndefined();
    expect(h04?.fechaPrevista).toBeUndefined();
    // Todos los hitos de CFG_HITOS_TIPO_SEED para CONTRATO se crean igual (8 hitos en la semilla actual).
    expect(resultado.length).toBe(CFG_HITOS_TIPO_SEED.filter((c) => c.tipoActuacion === "CONTRATO").length);
    expect(resultado.every((h) => h.estadoHito === "PENDIENTE")).toBe(true);
  });

  it("T3/T4: renovación con predecesor — H-01/H-04 cuentan desde el vencimiento efectivo del predecesor, H-02/H-21/H-03 desde la fecha_prevista de H-01", () => {
    const predecesor = crearActuacion({ actuacionId: "ACT-0001", fechaFin: "2026-03-31", estadoActuacion: "CERRADA" });
    const nueva = crearActuacion({ actuacionId: "ACT-0002", actuacionAnteriorId: "ACT-0001" });

    const resultado = generarHitosParaActuacion({
      actuacion: nueva,
      todasLasActuaciones: [predecesor, nueva],
      cfgHitosTipo: CFG_HITOS_TIPO_SEED,
      feriados: [feriado("2025-12-25")],
    });

    const porHito = (id: string) => resultado.find((h) => h.hitoId === id);

    // T3: H-01 a 4 meses de 31/03/2026 = 30/11/2025; H-04 a 3 meses = 31/12/2025.
    expect(porHito("H-01")?.fechaPrevista).toBe("2025-11-30");
    expect(porHito("H-04")?.fechaPrevista).toBe("2025-12-31");

    // H-02/H-21 (5 días hábiles después de H-01 = 30/11/2025, un domingo -> arranca a contar desde el lunes 01/12).
    // H-03 (7 días hábiles después de H-01).
    expect(porHito("H-02")?.fechaPrevista).toBeDefined();
    expect(porHito("H-21")?.fechaPrevista).toBe(porHito("H-02")?.fechaPrevista); // mismo plazo, mismo resultado
    expect(porHito("H-03")?.fechaPrevista).toBeDefined();
  });

  it("T8: con un legítimo abono intermedio, el cálculo salta al contrato A, no al LA", () => {
    const a = crearActuacion({ actuacionId: "ACT-0001", fechaFin: "2020-01-01", estadoActuacion: "CERRADA" });
    const la = crearActuacion({
      actuacionId: "ACT-LA1",
      tipoActuacion: "LEGITIMO_ABONO",
      actuacionAnteriorId: "ACT-0001",
      fechaFin: "2023-12-31", // el LA sí tiene su propia fecha, pero NO debe usarse para H-01 de la renovación
    });
    const b = crearActuacion({ actuacionId: "ACT-0002", actuacionAnteriorId: "ACT-LA1" });

    const resultado = generarHitosParaActuacion({
      actuacion: b,
      todasLasActuaciones: [a, la, b],
      cfgHitosTipo: CFG_HITOS_TIPO_SEED,
      feriados: [],
    });

    // 4 meses antes de 01/01/2020 (vencimiento efectivo de A, el CONTRATO, no del LA).
    expect(resultado.find((h) => h.hitoId === "H-01")?.fechaPrevista).toBe("2019-09-01");
  });

  it("hitos sin plazo configurado (H-05/H-15/H-20) se crean sin fecha prevista, nunca generan alerta por sí mismos", () => {
    const a = crearActuacion({ actuacionId: "ACT-0001" });
    const resultado = generarHitosParaActuacion({
      actuacion: a,
      todasLasActuaciones: [a],
      cfgHitosTipo: CFG_HITOS_TIPO_SEED,
      feriados: [],
    });
    for (const id of ["H-05", "H-15", "H-20"]) {
      const hito = resultado.find((h) => h.hitoId === id);
      expect(hito?.fechaPrevista).toBeUndefined();
    }
  });
});
