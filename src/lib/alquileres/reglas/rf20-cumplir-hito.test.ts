import { describe, expect, it } from "vitest";
import { marcarHitoCumplido } from "./rf20-cumplir-hito";
import { CFG_HITOS_TIPO_SEED } from "../catalogos/hitos-seed";
import { crearActuacionHito } from "../test-fixtures";

const CFG_CONTRATO = CFG_HITOS_TIPO_SEED.filter((c) => c.tipoActuacion === "CONTRATO");

describe("RF-20 — marcarHitoCumplido", () => {
  it("rechaza fecha futura", () => {
    const h01 = crearActuacionHito({ actuacionHitoId: "AHI-1", actuacionId: "ACT-1", hitoId: "H-01" });
    const r = marcarHitoCumplido({
      hitos: [h01],
      hitoId: "H-01",
      fechaCumplimiento: "2026-02-01",
      cfgHitosTipo: CFG_CONTRATO,
      feriados: [],
      hoy: "2026-01-01",
    });
    expect(r.valido).toBe(false);
  });

  it("acepta fecha de hoy o anterior y marca CUMPLIDO", () => {
    const h01 = crearActuacionHito({ actuacionHitoId: "AHI-1", actuacionId: "ACT-1", hitoId: "H-01" });
    const r = marcarHitoCumplido({
      hitos: [h01],
      hitoId: "H-01",
      fechaCumplimiento: "2025-12-18",
      cfgHitosTipo: CFG_CONTRATO,
      feriados: [],
      hoy: "2026-01-01",
    });
    expect(r.valido).toBe(true);
    expect(r.hitosActualizados[0]).toMatchObject({ hitoId: "H-01", estadoHito: "CUMPLIDO", fechaCumplimiento: "2025-12-18" });
  });

  it("T4: al cumplir H-01, recalcula H-02/H-21/H-03 desde la fecha real de cumplimiento", () => {
    const h01 = crearActuacionHito({ actuacionHitoId: "AHI-1", actuacionId: "ACT-1", hitoId: "H-01", fechaPrevista: "2025-11-30" });
    const h02 = crearActuacionHito({ actuacionHitoId: "AHI-2", actuacionId: "ACT-1", hitoId: "H-02", fechaPrevista: "2025-12-05" });
    const h21 = crearActuacionHito({ actuacionHitoId: "AHI-21", actuacionId: "ACT-1", hitoId: "H-21", fechaPrevista: "2025-12-05" });
    const h03 = crearActuacionHito({ actuacionHitoId: "AHI-3", actuacionId: "ACT-1", hitoId: "H-03", fechaPrevista: "2025-12-09" });

    const r = marcarHitoCumplido({
      hitos: [h01, h02, h21, h03],
      hitoId: "H-01",
      fechaCumplimiento: "2025-12-18", // se cumple más tarde que lo previsto
      cfgHitosTipo: CFG_CONTRATO,
      feriados: [{ fecha: "2025-12-25", activo: true }],
      hoy: "2026-01-01",
    });

    expect(r.valido).toBe(true);
    const h02Actualizado = r.hitosActualizados.find((h) => h.hitoId === "H-02");
    const h21Actualizado = r.hitosActualizados.find((h) => h.hitoId === "H-21");
    const h03Actualizado = r.hitosActualizados.find((h) => h.hitoId === "H-03");
    // Mismos valores que T4 (reproducido también en r13-fecha-prevista.test.ts).
    expect(h02Actualizado?.fechaPrevista).toBe("2025-12-26");
    expect(h21Actualizado?.fechaPrevista).toBe("2025-12-26");
    expect(h03Actualizado?.fechaPrevista).toBe("2025-12-30");
  });

  it("no recalcula un hito dependiente marcado reprogramada = TRUE (R13)", () => {
    const h01 = crearActuacionHito({ actuacionHitoId: "AHI-1", actuacionId: "ACT-1", hitoId: "H-01" });
    const h02 = crearActuacionHito({
      actuacionHitoId: "AHI-2",
      actuacionId: "ACT-1",
      hitoId: "H-02",
      fechaPrevista: "2099-01-01", // fecha "a mano", no debería tocarse
      reprogramada: true,
    });

    const r = marcarHitoCumplido({
      hitos: [h01, h02],
      hitoId: "H-01",
      fechaCumplimiento: "2025-12-18",
      cfgHitosTipo: CFG_CONTRATO,
      feriados: [],
      hoy: "2026-01-01",
    });

    expect(r.hitosActualizados.find((h) => h.hitoId === "H-02")).toBeUndefined();
  });

  it("no recalcula un hito dependiente que ya estaba cumplido", () => {
    const h01 = crearActuacionHito({ actuacionHitoId: "AHI-1", actuacionId: "ACT-1", hitoId: "H-01" });
    const h02 = crearActuacionHito({
      actuacionHitoId: "AHI-2",
      actuacionId: "ACT-1",
      hitoId: "H-02",
      estadoHito: "CUMPLIDO",
      fechaCumplimiento: "2025-12-01",
    });

    const r = marcarHitoCumplido({
      hitos: [h01, h02],
      hitoId: "H-01",
      fechaCumplimiento: "2025-12-18",
      cfgHitosTipo: CFG_CONTRATO,
      feriados: [],
      hoy: "2026-01-01",
    });

    expect(r.hitosActualizados.find((h) => h.hitoId === "H-02")).toBeUndefined();
  });

  it("rechaza un hito inexistente en la actuación", () => {
    const r = marcarHitoCumplido({
      hitos: [],
      hitoId: "H-99",
      fechaCumplimiento: "2025-12-18",
      cfgHitosTipo: CFG_CONTRATO,
      feriados: [],
      hoy: "2026-01-01",
    });
    expect(r.valido).toBe(false);
  });
});
