import { afterEach, describe, expect, it, vi } from "vitest";
import {
  anioTieneFeriadosCargados,
  diaDeSemana,
  diasEnMes,
  diasRestantesDesdeHoy,
  diferenciaDias,
  esDiaHabil,
  esFechaValida,
  esFeriado,
  esFinDeSemana,
  formatearFecha,
  formatearMonto,
  hoy,
  nivelSemaforo,
  sumarDiasCorridos,
  sumarDiasHabiles,
  sumarMeses,
} from "./fechas";
import type { Feriado } from "./tipos";

function feriado(fecha: string, activo = true): Feriado {
  return { fecha, descripcion: "prueba", ambito: "NACIONAL", activo };
}

describe("fechas.ts — validación y utilidades básicas", () => {
  it("esFechaValida acepta yyyy-mm-dd reales y rechaza fechas inexistentes o mal formadas", () => {
    expect(esFechaValida("2026-03-31")).toBe(true);
    expect(esFechaValida("2026-02-30")).toBe(false); // febrero no tiene 30
    expect(esFechaValida("2026-13-01")).toBe(false);
    expect(esFechaValida("31/03/2026")).toBe(false);
    expect(esFechaValida("2026-3-31")).toBe(false);
  });

  it("diasEnMes calcula meses de 28/29/30/31 días, incluido bisiesto", () => {
    expect(diasEnMes(2026, 2)).toBe(28);
    expect(diasEnMes(2028, 2)).toBe(29); // bisiesto
    expect(diasEnMes(2025, 11)).toBe(30);
    expect(diasEnMes(2025, 12)).toBe(31);
  });

  it("diaDeSemana y esFinDeSemana no se corren por huso horario", () => {
    // 2025-12-18 es jueves (T4 del PRD).
    expect(diaDeSemana("2025-12-18")).toBe(4);
    expect(esFinDeSemana("2025-12-18")).toBe(false);
    expect(esFinDeSemana("2025-12-20")).toBe(true); // sábado
    expect(esFinDeSemana("2025-12-21")).toBe(true); // domingo
  });
});

describe("fechas.ts — sumarMeses (EDATE), T2 y T3 del PRD", () => {
  it("T2: inicio 01/04/2026 + 24 meses = 01/04/2028 (la resta de 1 día para fecha_fin es responsabilidad de R5)", () => {
    expect(sumarMeses("2026-04-01", 24)).toBe("2028-04-01");
    expect(sumarDiasCorridos(sumarMeses("2026-04-01", 24), -1)).toBe("2028-03-31");
  });

  it("T3: vencimiento 31/03/2026 — H-01 (4 meses antes) y H-04 (3 meses antes)", () => {
    expect(sumarMeses("2026-03-31", -4)).toBe("2025-11-30"); // noviembre no tiene 31 días: clampea
    expect(sumarMeses("2026-03-31", -3)).toBe("2025-12-31");
  });

  it("clampea al último día del mes destino cuando el día de origen no existe ahí", () => {
    expect(sumarMeses("2026-01-31", 1)).toBe("2026-02-28");
    expect(sumarMeses("2028-01-31", 1)).toBe("2028-02-29"); // bisiesto
  });

  it("sumarMeses con 0 devuelve la misma fecha", () => {
    expect(sumarMeses("2026-06-15", 0)).toBe("2026-06-15");
  });
});

describe("fechas.ts — días hábiles y feriados, T4 y T5 del PRD", () => {
  it("T4: H-01 cumplido jueves 18/12/2025, con 25/12/2025 como único feriado de 2025", () => {
    const feriados = [feriado("2025-12-25")];

    const h02 = sumarDiasHabiles("2025-12-18", 5, feriados);
    expect(h02.fecha).toBe("2025-12-26");
    expect(h02.aproximado).toBe(false);

    const h03 = sumarDiasHabiles("2025-12-18", 7, feriados);
    expect(h03.fecha).toBe("2025-12-30");
    expect(h03.aproximado).toBe(false);
  });

  it("T5: mismo caso sin feriados cargados para 2025 — cómputo aproximado, solo fines de semana", () => {
    const sinFeriados: Feriado[] = [];
    const h02 = sumarDiasHabiles("2025-12-18", 5, sinFeriados);
    // Sin el feriado del 25/12, ese día cuenta como hábil: el resultado cambia respecto de T4.
    expect(h02.fecha).toBe("2025-12-25");
    expect(h02.aproximado).toBe(true);
  });

  it("esFeriado solo considera feriados activos", () => {
    const feriados = [feriado("2025-12-25", false)];
    expect(esFeriado("2025-12-25", feriados)).toBe(false);
    expect(esDiaHabil("2025-12-25", feriados)).toBe(true); // jueves, feriado inactivo -> hábil
  });

  it("anioTieneFeriadosCargados detecta por año sin importar si están activos", () => {
    expect(anioTieneFeriadosCargados(2025, [feriado("2025-01-01", false)])).toBe(true);
    expect(anioTieneFeriadosCargados(2025, [feriado("2026-01-01")])).toBe(false);
    expect(anioTieneFeriadosCargados(2025, [])).toBe(false);
  });

  it("sumarDiasHabiles exige una cantidad positiva", () => {
    expect(() => sumarDiasHabiles("2026-01-01", 0, [])).toThrow();
    expect(() => sumarDiasHabiles("2026-01-01", -1, [])).toThrow();
  });
});

describe("fechas.ts — T22: zona horaria a las 22:00 en Argentina", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("hoy() y diasRestantesDesdeHoy no saltan de día a las 22:00 hora Argentina", () => {
    // 2026-01-15 22:00 ARG (UTC-3) = 2026-01-16 01:00 UTC.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-16T01:00:00.000Z"));

    expect(hoy()).toBe("2026-01-15");
    expect(diasRestantesDesdeHoy("2026-01-16")).toBe(1);
    expect(diasRestantesDesdeHoy("2026-01-15")).toBe(0);
    expect(diasRestantesDesdeHoy("2026-01-14")).toBe(-1);
  });
});

describe("fechas.ts — semáforo (C3 del PRD v1)", () => {
  it("clasifica con los umbrales por defecto (180/120/60)", () => {
    expect(nivelSemaforo(null)).toBe("gris");
    expect(nivelSemaforo(181)).toBe("verde");
    expect(nivelSemaforo(180)).toBe("amarillo");
    expect(nivelSemaforo(121)).toBe("amarillo");
    expect(nivelSemaforo(120)).toBe("naranja");
    expect(nivelSemaforo(61)).toBe("naranja");
    expect(nivelSemaforo(60)).toBe("rojo");
    expect(nivelSemaforo(0)).toBe("rojo");
    expect(nivelSemaforo(-5)).toBe("rojo"); // vencido
  });

  it("respeta umbrales personalizados (RF-37: se aplican de inmediato)", () => {
    expect(nivelSemaforo(51, { u1: 100, u2: 50, u3: 10 })).toBe("amarillo");
    expect(nivelSemaforo(50, { u1: 100, u2: 50, u3: 10 })).toBe("naranja");
  });
});

describe("fechas.ts — formateo", () => {
  it("formatearFecha reordena yyyy-mm-dd a dd/mm/aaaa sin usar Date", () => {
    expect(formatearFecha("2026-03-05")).toBe("05/03/2026");
    expect(formatearFecha(undefined)).toBe("—");
    expect(formatearFecha("fecha-invalida")).toBe("—");
  });

  it("formatearMonto usa separador de miles y coma decimal", () => {
    expect(formatearMonto(1234567.5)).toContain("1.234.567,50");
    expect(formatearMonto(undefined)).toBe("—");
  });
});

describe("fechas.ts — diferenciaDias", () => {
  it("es simétrica y consistente", () => {
    expect(diferenciaDias("2026-01-01", "2026-01-11")).toBe(10);
    expect(diferenciaDias("2026-01-11", "2026-01-01")).toBe(-10);
    expect(diferenciaDias("2026-01-01", "2026-01-01")).toBe(0);
  });
});
