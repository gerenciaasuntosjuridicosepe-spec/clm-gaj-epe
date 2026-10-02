import { describe, expect, it } from "vitest";
import { construirEventosCalendarioAlquileres } from "./calendario";
import { crearActuacion, crearActuacionHito } from "../test-fixtures";

const HOY = "2026-06-01";

describe("construirEventosCalendarioAlquileres", () => {
  it("genera un evento de vencimiento para un CONTRATO vigente, con su semáforo (C3)", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001", fechaFin: "2026-12-31" }); // ~213 días -> verde

    const eventos = construirEventosCalendarioAlquileres([contrato], [], HOY);

    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toMatchObject({
      tipoEvento: "vencimiento",
      fecha: "2026-12-31",
      actuacionId: "ACT-0001",
      nivel: "verde",
    });
  });

  it("no genera evento de vencimiento para un CONTRATO en estado terminal (DESISTIDA/ANULADA/NO_RENOVADO/CERRADA)", () => {
    const desistida = crearActuacion({ actuacionId: "ACT-0001", fechaFin: "2026-12-31", estadoActuacion: "DESISTIDA" });
    const eventos = construirEventosCalendarioAlquileres([desistida], [], HOY);
    expect(eventos).toHaveLength(0);
  });

  it("no genera evento de vencimiento sin fecha_fin (R15 no puede calcular el vencimiento efectivo)", () => {
    const sinFechaFin = crearActuacion({ actuacionId: "ACT-0001" });
    const eventos = construirEventosCalendarioAlquileres([sinFechaFin], [], HOY);
    expect(eventos).toHaveLength(0);
  });

  it("genera un evento por cada hito PENDIENTE con fecha_prevista", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001" });
    const hitoPendiente = crearActuacionHito({
      actuacionHitoId: "AHI-1",
      actuacionId: "ACT-0001",
      hitoId: "H-01",
      fechaPrevista: "2026-06-10",
    });

    const eventos = construirEventosCalendarioAlquileres([contrato], [hitoPendiente], HOY);

    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toMatchObject({ tipoEvento: "hito", fecha: "2026-06-10", actuacionId: "ACT-0001", inmuebleId: "INM-0001" });
  });

  it("no genera evento para un hito CUMPLIDO, NO_APLICA o sin fecha_prevista", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001" });
    const cumplido = crearActuacionHito({
      actuacionHitoId: "AHI-1",
      actuacionId: "ACT-0001",
      hitoId: "H-01",
      estadoHito: "CUMPLIDO",
      fechaPrevista: "2026-06-10",
    });
    const sinFecha = crearActuacionHito({ actuacionHitoId: "AHI-2", actuacionId: "ACT-0001", hitoId: "H-02" });

    const eventos = construirEventosCalendarioAlquileres([contrato], [cumplido, sinFecha], HOY);
    expect(eventos).toHaveLength(0);
  });

  it("ordena los eventos por fecha ascendente", () => {
    const a = crearActuacion({ actuacionId: "ACT-A", fechaFin: "2026-12-31" });
    const b = crearActuacion({ actuacionId: "ACT-B", fechaFin: "2026-07-01" });

    const eventos = construirEventosCalendarioAlquileres([a, b], [], HOY);

    expect(eventos.map((e) => e.actuacionId)).toEqual(["ACT-B", "ACT-A"]);
  });
});
