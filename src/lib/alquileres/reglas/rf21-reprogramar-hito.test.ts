import { describe, expect, it } from "vitest";
import { marcarHitoNoAplica, reprogramarHito } from "./rf21-reprogramar-hito";
import { crearActuacionHito } from "../test-fixtures";

describe("RF-21 — reprogramarHito", () => {
  it("exige motivo", () => {
    const hito = crearActuacionHito({ actuacionHitoId: "AHI-1", actuacionId: "ACT-1", hitoId: "H-02", fechaPrevista: "2026-01-01" });
    const r = reprogramarHito(hito, "2026-02-01", "");
    expect(r.valido).toBe(false);
  });

  it("exige la nueva fecha prevista", () => {
    const hito = crearActuacionHito({ actuacionHitoId: "AHI-1", actuacionId: "ACT-1", hitoId: "H-02", fechaPrevista: "2026-01-01" });
    const r = reprogramarHito(hito, "", "motivo válido");
    expect(r.valido).toBe(false);
  });

  it("reprograma correctamente: marca reprogramada=TRUE, guarda fecha y motivo", () => {
    const hito = crearActuacionHito({ actuacionHitoId: "AHI-1", actuacionId: "ACT-1", hitoId: "H-02", fechaPrevista: "2026-01-01" });
    const r = reprogramarHito(hito, "2026-02-01", "El sector pidió una extensión");
    expect(r.valido).toBe(true);
    expect(r.hitoActualizado).toMatchObject({
      fechaPrevista: "2026-02-01",
      reprogramada: true,
      observaciones: "El sector pidió una extensión",
    });
  });

  it("rechaza reprogramar un hito ya cumplido", () => {
    const hito = crearActuacionHito({
      actuacionHitoId: "AHI-1",
      actuacionId: "ACT-1",
      hitoId: "H-02",
      estadoHito: "CUMPLIDO",
      fechaCumplimiento: "2026-01-01",
    });
    const r = reprogramarHito(hito, "2026-02-01", "motivo");
    expect(r.valido).toBe(false);
  });
});

describe("RF-21 — marcarHitoNoAplica", () => {
  it("exige motivo", () => {
    const hito = crearActuacionHito({ actuacionHitoId: "AHI-1", actuacionId: "ACT-1", hitoId: "H-04" });
    const r = marcarHitoNoAplica(hito, "");
    expect(r.valido).toBe(false);
  });

  it("marca NO_APLICA con el motivo", () => {
    const hito = crearActuacionHito({ actuacionHitoId: "AHI-1", actuacionId: "ACT-1", hitoId: "H-04" });
    const r = marcarHitoNoAplica(hito, "El locador propuso antes de la carta documento");
    expect(r.valido).toBe(true);
    expect(r.hitoActualizado?.estadoHito).toBe("NO_APLICA");
    expect(r.hitoActualizado?.observaciones).toBe("El locador propuso antes de la carta documento");
  });

  it("rechaza marcar NO_APLICA un hito ya cumplido", () => {
    const hito = crearActuacionHito({
      actuacionHitoId: "AHI-1",
      actuacionId: "ACT-1",
      hitoId: "H-04",
      estadoHito: "CUMPLIDO",
      fechaCumplimiento: "2026-01-01",
    });
    const r = marcarHitoNoAplica(hito, "motivo");
    expect(r.valido).toBe(false);
  });
});
