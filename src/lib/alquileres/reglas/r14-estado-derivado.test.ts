import { describe, expect, it } from "vitest";
import { calcularEstadoDerivado, esEstadoManual, InsumosEstadoDerivado } from "./r14-estado-derivado";

const BASE: InsumosEstadoDerivado = {
  tieneExpedienteAsignado: false,
  h01Cumplido: false,
  h05Cumplido: false,
  h15Cumplido: false,
  h20Cumplido: false,
  puedeFormalizar: false,
};

describe("R14 — estado derivado de los hitos", () => {
  it("PENDIENTE_AVISO al crear (nada cumplido)", () => {
    expect(calcularEstadoDerivado(BASE)).toBe("PENDIENTE_AVISO");
  });

  it("AVISO_ENVIADO con H-01 cumplido", () => {
    expect(calcularEstadoDerivado({ ...BASE, h01Cumplido: true })).toBe("AVISO_ENVIADO");
  });

  it("EN_TRAMITE con expediente asignado y H-05 cumplido", () => {
    expect(
      calcularEstadoDerivado({ ...BASE, h01Cumplido: true, tieneExpedienteAsignado: true, h05Cumplido: true })
    ).toBe("EN_TRAMITE");
  });

  it("H-05 cumplido pero sin expediente asignado todavía no pasa a EN_TRAMITE", () => {
    expect(calcularEstadoDerivado({ ...BASE, h01Cumplido: true, h05Cumplido: true })).toBe("AVISO_ENVIADO");
  });

  it("FORMALIZADA con H-15 cumplido, solo si R4' lo permite", () => {
    const insumos = {
      ...BASE,
      h01Cumplido: true,
      tieneExpedienteAsignado: true,
      h05Cumplido: true,
      h15Cumplido: true,
    };
    expect(calcularEstadoDerivado({ ...insumos, puedeFormalizar: false })).toBe("EN_TRAMITE");
    expect(calcularEstadoDerivado({ ...insumos, puedeFormalizar: true })).toBe("FORMALIZADA");
  });

  it("CERRADA con H-20 cumplido", () => {
    expect(
      calcularEstadoDerivado({
        ...BASE,
        h01Cumplido: true,
        tieneExpedienteAsignado: true,
        h05Cumplido: true,
        h15Cumplido: true,
        puedeFormalizar: true,
        h20Cumplido: true,
      })
    ).toBe("CERRADA");
  });

  it("si se borra la fecha de cumplimiento de un hito, el estado retrocede (recomputación pura)", () => {
    const formalizada = { ...BASE, h01Cumplido: true, tieneExpedienteAsignado: true, h05Cumplido: true, h15Cumplido: true, puedeFormalizar: true };
    expect(calcularEstadoDerivado(formalizada)).toBe("FORMALIZADA");
    // Se borra fecha_cumplimiento de H-15:
    expect(calcularEstadoDerivado({ ...formalizada, h15Cumplido: false })).toBe("EN_TRAMITE");
  });

  it("esEstadoManual identifica DESISTIDA/NO_RENOVADO/ANULADA", () => {
    expect(esEstadoManual("DESISTIDA")).toBe(true);
    expect(esEstadoManual("NO_RENOVADO")).toBe(true);
    expect(esEstadoManual("ANULADA")).toBe(true);
    expect(esEstadoManual("EN_TRAMITE")).toBe(false);
  });
});
