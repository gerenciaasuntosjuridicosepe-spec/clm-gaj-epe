import { describe, expect, it } from "vitest";
import { calcularFechaPrevista } from "./r13-fecha-prevista";
import { CFG_HITOS_TIPO_SEED } from "../catalogos/hitos-seed";
import type { Feriado } from "../tipos";

function cfg(hitoId: string) {
  const c = CFG_HITOS_TIPO_SEED.find((x) => x.hitoId === hitoId);
  if (!c) throw new Error(`cfg no encontrado para ${hitoId}`);
  return c;
}

function feriado(fecha: string): Feriado {
  return { fecha, descripcion: "prueba", ambito: "NACIONAL", activo: true };
}

describe("R13 — cálculo de fecha prevista (usa la semilla real de CFG_HITOS_TIPO)", () => {
  it("T3: H-01 (4 meses antes del vencimiento efectivo 31/03/2026) → 30/11/2025", () => {
    const r = calcularFechaPrevista(cfg("H-01"), { vencimientoEfectivo: "2026-03-31" }, []);
    expect(r.fecha).toBe("2025-11-30");
    expect(r.aproximado).toBe(false);
  });

  it("T3: H-04 (3 meses antes) → 31/12/2025", () => {
    const r = calcularFechaPrevista(cfg("H-04"), { vencimientoEfectivo: "2026-03-31" }, []);
    expect(r.fecha).toBe("2025-12-31");
  });

  it("T4: H-02 y H-21 (5 días hábiles después de H-01 cumplido 18/12/2025, con feriado el 25/12)", () => {
    const feriados = [feriado("2025-12-25")];
    const h02 = calcularFechaPrevista(cfg("H-02"), { fechaHitoReferencia: "2025-12-18" }, feriados);
    expect(h02.fecha).toBe("2025-12-26");
    expect(h02.aproximado).toBe(false);

    const h21 = calcularFechaPrevista(cfg("H-21"), { fechaHitoReferencia: "2025-12-18" }, feriados);
    expect(h21.fecha).toBe("2025-12-26");
  });

  it("T4: H-03 (7 días hábiles después de H-01, D15: siempre desde el mail inicial)", () => {
    const feriados = [feriado("2025-12-25")];
    const h03 = calcularFechaPrevista(cfg("H-03"), { fechaHitoReferencia: "2025-12-18" }, feriados);
    expect(h03.fecha).toBe("2025-12-30");
  });

  it("T5: sin feriados cargados para 2025, el cómputo queda marcado aproximado", () => {
    const h02 = calcularFechaPrevista(cfg("H-02"), { fechaHitoReferencia: "2025-12-18" }, []);
    expect(h02.aproximado).toBe(true);
  });

  it("hitos sin plazo configurado (H-05, H-15, H-20) no calculan fecha prevista", () => {
    expect(calcularFechaPrevista(cfg("H-05"), {}, []).fecha).toBeUndefined();
    expect(calcularFechaPrevista(cfg("H-15"), {}, []).fecha).toBeUndefined();
    expect(calcularFechaPrevista(cfg("H-20"), {}, []).fecha).toBeUndefined();
  });

  it("ANTES_FIN_CONTRATO sin vencimiento efectivo todavía: no calcula (contrato sin formalizar)", () => {
    expect(calcularFechaPrevista(cfg("H-01"), {}, []).fecha).toBeUndefined();
  });

  it("DESPUES_HITO sin fecha del hito de referencia: no calcula", () => {
    expect(calcularFechaPrevista(cfg("H-02"), {}, []).fecha).toBeUndefined();
  });
});
