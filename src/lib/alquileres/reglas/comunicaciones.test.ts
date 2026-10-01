import { describe, expect, it } from "vitest";
import { validarMarcarComoEnviado } from "./comunicaciones";

describe("Marcar como enviado — T23", () => {
  it("T23: sin fecha, se rechaza", () => {
    expect(validarMarcarComoEnviado(undefined, "2026-01-10").valida).toBe(false);
  });

  it("T23: con fecha futura, se rechaza", () => {
    expect(validarMarcarComoEnviado("2026-01-15", "2026-01-10").valida).toBe(false);
  });

  it("con fecha de hoy, se acepta", () => {
    expect(validarMarcarComoEnviado("2026-01-10", "2026-01-10").valida).toBe(true);
  });

  it("con fecha pasada, se acepta", () => {
    expect(validarMarcarComoEnviado("2026-01-05", "2026-01-10").valida).toBe(true);
  });
});
