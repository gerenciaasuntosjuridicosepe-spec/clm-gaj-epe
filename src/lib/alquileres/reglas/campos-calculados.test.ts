import { describe, expect, it } from "vitest";
import { huecoCobertura, situacionVigencia, tieneSucesoraActiva } from "./campos-calculados";
import { crearActuacion } from "../test-fixtures";

describe("C1 — situación de vigencia", () => {
  it("un contrato con hoy entre inicio y vencimiento efectivo está VIGENTE", () => {
    const c = crearActuacion({ actuacionId: "ACT-1", fechaInicio: "2026-01-01", fechaFin: "2026-12-31" });
    expect(situacionVigencia(c, [c], "2026-06-01")).toBe("VIGENTE");
  });

  it("un contrato con hoy posterior al vencimiento está VENCIDA", () => {
    const c = crearActuacion({ actuacionId: "ACT-1", fechaInicio: "2020-01-01", fechaFin: "2020-12-31" });
    expect(situacionVigencia(c, [c], "2026-01-01")).toBe("VENCIDA");
  });

  it("un contrato con inicio futuro está FUTURA", () => {
    const c = crearActuacion({ actuacionId: "ACT-1", fechaInicio: "2030-01-01", fechaFin: "2031-12-31" });
    expect(situacionVigencia(c, [c], "2026-01-01")).toBe("FUTURA");
  });

  it("un legítimo abono abierto (sin fecha_fin) es siempre VIGENTE", () => {
    const la = crearActuacion({ actuacionId: "ACT-LA1", tipoActuacion: "LEGITIMO_ABONO", fechaInicio: "2020-01-01" });
    expect(situacionVigencia(la, [la], "2026-01-01")).toBe("VIGENTE");
  });
});

describe("C4 — renovación en curso / sucesora activa", () => {
  it("true si existe un sucesor que no está DESISTIDA/ANULADA/NO_RENOVADO", () => {
    const a = crearActuacion({ actuacionId: "ACT-1" });
    const b = crearActuacion({ actuacionId: "ACT-2", actuacionAnteriorId: "ACT-1", estadoActuacion: "EN_TRAMITE" });
    expect(tieneSucesoraActiva(a, [a, b])).toBe(true);
  });

  it("T9: false si el único sucesor está NO_RENOVADO", () => {
    const a = crearActuacion({ actuacionId: "ACT-1" });
    const b = crearActuacion({ actuacionId: "ACT-2", actuacionAnteriorId: "ACT-1", estadoActuacion: "NO_RENOVADO" });
    expect(tieneSucesoraActiva(a, [a, b])).toBe(false);
  });

  it("false sin ningún sucesor", () => {
    const a = crearActuacion({ actuacionId: "ACT-1" });
    expect(tieneSucesoraActiva(a, [a])).toBe(false);
  });
});

describe("C6 — hueco de cobertura", () => {
  it("calcula los días entre el vencimiento efectivo y el inicio de la siguiente actuación", () => {
    const anterior = crearActuacion({ actuacionId: "ACT-1", fechaFin: "2020-01-01" });
    const siguiente = crearActuacion({ actuacionId: "ACT-2", fechaInicio: "2024-01-01" });
    const hueco = huecoCobertura(anterior, siguiente, [anterior]);
    expect(hueco?.dias).toBeGreaterThan(1000); // "casi cuatro años" tipo caso B del PRD
  });

  it("sin hueco si la siguiente empieza justo al día siguiente", () => {
    const anterior = crearActuacion({ actuacionId: "ACT-1", fechaFin: "2026-01-01" });
    const siguiente = crearActuacion({ actuacionId: "ACT-2", fechaInicio: "2026-01-02" });
    const hueco = huecoCobertura(anterior, siguiente, [anterior]);
    expect(hueco?.dias).toBe(0);
  });
});
