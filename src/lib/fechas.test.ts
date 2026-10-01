import { afterEach, describe, expect, it, vi } from "vitest";
import { diasRestantes, formatearFecha, hoyEnArgentina, nivelSemaforo } from "./fechas";

/**
 * F0-7 / T22: `diasRestantes`/"hoy" deben dar la fecha y el conteo correctos
 * en la zona America/Argentina/Buenos_Aires, incluso a las 22:00 — hora en la
 * que el bug original (`new Date().toISOString().slice(0,10)`, que usa UTC)
 * ya había saltado al día siguiente porque Argentina es UTC-3.
 */
describe("fechas.ts (CLM) — F0-7", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("hoyEnArgentina() no salta de día a las 22:00 hora Argentina (bug original: sí saltaba)", () => {
    // 2026-01-15 22:00 en Argentina (UTC-3) = 2026-01-16 01:00 UTC.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-16T01:00:00.000Z"));

    expect(hoyEnArgentina()).toBe("2026-01-15");
    // El bug que reemplaza esta prueba: new Date().toISOString().slice(0,10)
    // hubiera dado "2026-01-16" en este mismo instante.
    expect(new Date().toISOString().slice(0, 10)).toBe("2026-01-16");
  });

  it("diasRestantes cuenta correctamente contra 'hoy' en Argentina, no en UTC", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-16T01:00:00.000Z")); // 15/01 22:00 ARG

    // Vencimiento el 16/01: para Argentina todavía falta 1 día (hoy es 15/01).
    expect(diasRestantes("2026-01-16")).toBe(1);
    // Vencimiento el 15/01: vence hoy mismo (Argentina), no "ayer".
    expect(diasRestantes("2026-01-15")).toBe(0);
  });

  it("diasRestantes no se corre un día por zona horaria en un caso simple (sin fake timers)", () => {
    // Con el bug original, construir `new Date("2026-06-15")` y comparar con
    // `new Date()` (hora local) podía dar -1 o +0 según la hora del día en
    // que corriera el test. La función nueva no depende de la hora del día.
    const hoy = hoyEnArgentina();
    expect(diasRestantes(hoy)).toBe(0);
  });

  it("formatearFecha no reinterpreta la fecha vía Date/huso horario", () => {
    expect(formatearFecha("2026-03-31")).toBe("31/03/2026");
    // Con marca de tiempo completa (hitos/historial guardan ISO con hora):
    // toma solo los primeros 10 caracteres, nunca construye un Date.
    expect(formatearFecha("2026-12-01T23:50:00.000Z")).toBe("01/12/2026");
  });

  it("formatearFecha sin fecha devuelve el placeholder", () => {
    expect(formatearFecha(undefined)).toBe("—");
  });

  it("diasRestantes sin fecha devuelve null y el semáforo queda gris", () => {
    expect(diasRestantes(undefined)).toBeNull();
    expect(nivelSemaforo(null)).toBe("gris");
  });

  it("nivelSemaforo: casos de borde ya existentes se mantienen (no se tocó esta función)", () => {
    expect(nivelSemaforo(-1)).toBe("rojo");
    expect(nivelSemaforo(0)).toBe("rojo");
    expect(nivelSemaforo(7)).toBe("rojo");
    expect(nivelSemaforo(8)).toBe("amarillo");
    expect(nivelSemaforo(30)).toBe("amarillo");
    expect(nivelSemaforo(31)).toBe("verde");
  });
});
