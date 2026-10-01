import { describe, expect, it } from "vitest";
import { fechaFinPorDefecto, validarFechaFinManual } from "./r5-fecha-fin";

describe("R5 — fecha_fin por defecto y validación manual", () => {
  it("T2: inicio 01/04/2026 + 24 meses → 31/03/2028", () => {
    expect(fechaFinPorDefecto("2026-04-01", 24)).toBe("2028-03-31");
  });

  it("rechaza plazo_meses <= 0", () => {
    expect(() => fechaFinPorDefecto("2026-04-01", 0)).toThrow();
    expect(() => fechaFinPorDefecto("2026-04-01", -1)).toThrow();
  });

  it("acepta la fecha_fin por defecto sin exigir motivo", () => {
    const r = validarFechaFinManual("2026-04-01", 24, "2028-03-31", undefined);
    expect(r.valida).toBe(true);
  });

  it("rechaza fecha_fin anterior a fecha_inicio", () => {
    const r = validarFechaFinManual("2026-04-01", 24, "2025-01-01", "motivo cualquiera");
    expect(r.valida).toBe(false);
  });

  it("exige motivo si se corrige a mano la fecha_fin propuesta", () => {
    const sinMotivo = validarFechaFinManual("2026-04-01", 24, "2028-04-01", undefined);
    expect(sinMotivo.valida).toBe(false);

    const conMotivo = validarFechaFinManual("2026-04-01", 24, "2028-04-01", "Se acordó un día más por feriado");
    expect(conMotivo.valida).toBe(true);
  });
});
