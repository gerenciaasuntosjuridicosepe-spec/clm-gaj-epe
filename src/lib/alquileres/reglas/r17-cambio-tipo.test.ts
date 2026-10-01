import { describe, expect, it } from "vitest";
import { aplicarCambioTipoActuacion, contarHitosQuePasaranANoAplica } from "./r17-cambio-tipo";
import { crearActuacionHito } from "../test-fixtures";

describe("R17 — cambio de tipo de actuación (T17)", () => {
  it("T17: H-01 cumplido se conserva, H-02 pendiente pasa a NO_APLICA con observación 'cambio de tipo'", () => {
    const h01 = crearActuacionHito({
      actuacionHitoId: "AHI-0001",
      actuacionId: "ACT-0001",
      hitoId: "H-01",
      estadoHito: "CUMPLIDO",
      fechaCumplimiento: "2025-12-18",
    });
    const h02 = crearActuacionHito({
      actuacionHitoId: "AHI-0002",
      actuacionId: "ACT-0001",
      hitoId: "H-02",
      estadoHito: "PENDIENTE",
    });

    const resultado = aplicarCambioTipoActuacion([h01, h02]);

    const resultadoH01 = resultado.find((h) => h.hitoId === "H-01")!;
    const resultadoH02 = resultado.find((h) => h.hitoId === "H-02")!;

    expect(resultadoH01.estadoHito).toBe("CUMPLIDO");
    expect(resultadoH01.fechaCumplimiento).toBe("2025-12-18");
    expect(resultadoH02.estadoHito).toBe("NO_APLICA");
    expect(resultadoH02.observaciones).toBe("cambio de tipo");
  });

  it("no toca hitos ya NO_APLICA", () => {
    const h04 = crearActuacionHito({
      actuacionHitoId: "AHI-0004",
      actuacionId: "ACT-0001",
      hitoId: "H-04",
      estadoHito: "NO_APLICA",
      observaciones: "otro motivo",
    });
    const [resultado] = aplicarCambioTipoActuacion([h04]);
    expect(resultado.observaciones).toBe("otro motivo");
  });

  it("no muta el array original", () => {
    const h02 = crearActuacionHito({ actuacionHitoId: "AHI-0002", actuacionId: "ACT-0001", hitoId: "H-02", estadoHito: "PENDIENTE" });
    aplicarCambioTipoActuacion([h02]);
    expect(h02.estadoHito).toBe("PENDIENTE");
  });

  it("contarHitosQuePasaranANoAplica cuenta solo los pendientes", () => {
    const pendiente = crearActuacionHito({ actuacionHitoId: "AHI-1", actuacionId: "ACT-1", hitoId: "H-02", estadoHito: "PENDIENTE" });
    const cumplido = crearActuacionHito({ actuacionHitoId: "AHI-2", actuacionId: "ACT-1", hitoId: "H-01", estadoHito: "CUMPLIDO" });
    expect(contarHitosQuePasaranANoAplica([pendiente, cumplido])).toBe(1);
  });
});
