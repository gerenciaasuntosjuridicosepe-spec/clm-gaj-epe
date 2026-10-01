import { describe, expect, it } from "vitest";
import {
  alertaA1IniciarAviso,
  alertaA2SectorSinRespuesta,
  alertaA3CartaDocumento,
  alertaA4HitoAtrasado,
  alertaA5OcupacionSinContrato,
  alertaA6FormalizadaSinEscaneado,
  alertaA7FeriadosSinCargar,
  alertaA8SinRespaldoReciente,
} from "./alertas";
import { crearActuacion, crearActuacionHito } from "../test-fixtures";

describe("A1 — iniciar aviso", () => {
  it("se enciende cuando faltan 4 meses o menos y no hay sucesora", () => {
    const c = crearActuacion({ actuacionId: "ACT-1", fechaFin: "2026-12-31", estadoActuacion: "EN_TRAMITE" });
    expect(alertaA1IniciarAviso(c, [c], "2026-09-01")).toBe(true); // 4 meses antes de 31/12 = 31/08
  });

  it("no se enciende si falta más de 4 meses", () => {
    const c = crearActuacion({ actuacionId: "ACT-1", fechaFin: "2026-12-31", estadoActuacion: "EN_TRAMITE" });
    expect(alertaA1IniciarAviso(c, [c], "2026-01-01")).toBe(false);
  });

  it("no se enciende si ya existe una sucesora activa", () => {
    const a = crearActuacion({ actuacionId: "ACT-1", fechaFin: "2026-12-31", estadoActuacion: "EN_TRAMITE" });
    const b = crearActuacion({ actuacionId: "ACT-2", actuacionAnteriorId: "ACT-1", estadoActuacion: "PENDIENTE_AVISO" });
    expect(alertaA1IniciarAviso(a, [a, b], "2026-09-01")).toBe(false);
  });

  it("T9: no se enciende si el contrato está NO_RENOVADO", () => {
    const c = crearActuacion({ actuacionId: "ACT-1", fechaFin: "2020-01-01", estadoActuacion: "NO_RENOVADO" });
    expect(alertaA1IniciarAviso(c, [c], "2026-01-01")).toBe(false);
  });
});

describe("A2 — sector sin respuesta", () => {
  it("se enciende con H-02 PENDIENTE y fecha_prevista vencida", () => {
    const hito = crearActuacionHito({ actuacionHitoId: "AHI-1", actuacionId: "ACT-1", hitoId: "H-02", fechaPrevista: "2026-01-01" });
    expect(alertaA2SectorSinRespuesta(hito, "2026-02-01")).toBe(true);
  });
  it("no se enciende si todavía no venció", () => {
    const hito = crearActuacionHito({ actuacionHitoId: "AHI-1", actuacionId: "ACT-1", hitoId: "H-21", fechaPrevista: "2026-06-01" });
    expect(alertaA2SectorSinRespuesta(hito, "2026-02-01")).toBe(false);
  });
  it("no aplica a otros hitos", () => {
    const hito = crearActuacionHito({ actuacionHitoId: "AHI-1", actuacionId: "ACT-1", hitoId: "H-01", fechaPrevista: "2026-01-01" });
    expect(alertaA2SectorSinRespuesta(hito, "2026-02-01")).toBe(false);
  });
});

describe("A3 — carta documento", () => {
  it("se enciende a 3 meses o menos del vencimiento, H-04 pendiente, sin propuesta del locador", () => {
    const c = crearActuacion({ actuacionId: "ACT-1", fechaFin: "2026-12-31" });
    const h04 = { estadoHito: "PENDIENTE" as const };
    expect(alertaA3CartaDocumento(c, [c], h04, false, "2026-10-01")).toBe(true);
  });
  it("no se enciende si hay propuesta del locador", () => {
    const c = crearActuacion({ actuacionId: "ACT-1", fechaFin: "2026-12-31" });
    const h04 = { estadoHito: "PENDIENTE" as const };
    expect(alertaA3CartaDocumento(c, [c], h04, true, "2026-10-01")).toBe(false);
  });
});

describe("A4 — hito atrasado", () => {
  it("se enciende con genera_alerta y fecha_prevista vencida", () => {
    const hito = crearActuacionHito({ actuacionHitoId: "AHI-1", actuacionId: "ACT-1", hitoId: "H-01", fechaPrevista: "2026-01-01" });
    expect(alertaA4HitoAtrasado(hito, true, "2026-02-01")).toBe(true);
  });
  it("no se enciende si genera_alerta es false", () => {
    const hito = crearActuacionHito({ actuacionHitoId: "AHI-1", actuacionId: "ACT-1", hitoId: "H-05", fechaPrevista: "2026-01-01" });
    expect(alertaA4HitoAtrasado(hito, false, "2026-02-01")).toBe(false);
  });
});

describe("A5 — ocupación sin contrato (T9, T10)", () => {
  it("T10: CONTRATO vencido sin sucesora y sin LA → A5 visible", () => {
    const c = crearActuacion({ actuacionId: "ACT-1", fechaFin: "2020-01-01", estadoActuacion: "CERRADA" });
    expect(alertaA5OcupacionSinContrato(c, [c], "2026-01-01")).toBe(true);
  });

  it("T9: contrato vencido marcado NO_RENOVADO → A5 apagada", () => {
    const c = crearActuacion({ actuacionId: "ACT-1", fechaFin: "2020-01-01", estadoActuacion: "NO_RENOVADO" });
    expect(alertaA5OcupacionSinContrato(c, [c], "2026-01-01")).toBe(false);
  });

  it("T8: con un legítimo abono en curso, A5 se apaga", () => {
    const c = crearActuacion({ actuacionId: "ACT-1", fechaFin: "2020-01-01", estadoActuacion: "CERRADA" });
    const la = crearActuacion({
      actuacionId: "ACT-LA1",
      tipoActuacion: "LEGITIMO_ABONO",
      actuacionAnteriorId: "ACT-1",
      estadoActuacion: "EN_TRAMITE",
    });
    expect(alertaA5OcupacionSinContrato(c, [c, la], "2026-01-01")).toBe(false);
  });

  it("no se enciende si el contrato todavía no venció", () => {
    const c = crearActuacion({ actuacionId: "ACT-1", fechaFin: "2030-01-01" });
    expect(alertaA5OcupacionSinContrato(c, [c], "2026-01-01")).toBe(false);
  });
});

describe("A6 — formalizada sin escaneado", () => {
  it("se enciende si no hay un ESCANEADO firmado", () => {
    const c = crearActuacion({ actuacionId: "ACT-1", estadoActuacion: "FORMALIZADA" });
    expect(alertaA6FormalizadaSinEscaneado(c, [])).toBe(true);
    expect(alertaA6FormalizadaSinEscaneado(c, [{ tipoDocumento: "ESCANEADO", firmado: false }])).toBe(true);
  });
  it("se apaga con el escaneado firmado", () => {
    const c = crearActuacion({ actuacionId: "ACT-1", estadoActuacion: "FORMALIZADA" });
    expect(alertaA6FormalizadaSinEscaneado(c, [{ tipoDocumento: "ESCANEADO", firmado: true }])).toBe(false);
  });
  it("no aplica fuera de FORMALIZADA", () => {
    const c = crearActuacion({ actuacionId: "ACT-1", estadoActuacion: "EN_TRAMITE" });
    expect(alertaA6FormalizadaSinEscaneado(c, [])).toBe(false);
  });
});

describe("A7 — feriados sin cargar", () => {
  it("se enciende si no hay feriados del año próximo", () => {
    expect(alertaA7FeriadosSinCargar(2027, [{ fecha: "2026-12-25" }])).toBe(true);
  });
  it("se apaga si ya hay al menos uno del año próximo", () => {
    expect(alertaA7FeriadosSinCargar(2027, [{ fecha: "2027-01-01" }])).toBe(false);
  });
});

describe("A8 — sin respaldo reciente (T25)", () => {
  it("T25: se enciende con más de 7 días sin respaldo", () => {
    expect(alertaA8SinRespaldoReciente("2026-01-01T10:00:00.000-03:00", "2026-01-10", 7)).toBe(true);
  });
  it("T25: se apaga tras un respaldo reciente", () => {
    expect(alertaA8SinRespaldoReciente("2026-01-09T10:00:00.000-03:00", "2026-01-10", 7)).toBe(false);
  });
  it("se enciende si nunca hubo respaldo", () => {
    expect(alertaA8SinRespaldoReciente(undefined, "2026-01-10", 7)).toBe(true);
  });
});
