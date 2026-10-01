import { describe, expect, it } from "vitest";
import { vencimientoEfectivo } from "./r15-vencimiento-efectivo";
import { crearActuacion } from "../test-fixtures";

describe("R15 — vencimiento efectivo", () => {
  it("T6: contrato con adenda que prorroga — el vencimiento efectivo es el de la adenda", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001", fechaFin: "2028-03-31" });
    const adenda = crearActuacion({
      actuacionId: "ACT-0002",
      tipoActuacion: "ADENDA",
      actuacionAnteriorId: "ACT-0001",
      fechaFin: "2029-03-31",
      estadoActuacion: "FORMALIZADA",
    });

    expect(vencimientoEfectivo(contrato, [contrato, adenda])).toBe("2029-03-31");
  });

  it("T6: al anular la adenda, el vencimiento efectivo vuelve a ser el del contrato", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001", fechaFin: "2028-03-31" });
    const adendaAnulada = crearActuacion({
      actuacionId: "ACT-0002",
      tipoActuacion: "ADENDA",
      actuacionAnteriorId: "ACT-0001",
      fechaFin: "2029-03-31",
      estadoActuacion: "ANULADA",
    });

    expect(vencimientoEfectivo(contrato, [contrato, adendaAnulada])).toBe("2028-03-31");
  });

  it("sin adendas, el vencimiento efectivo es la fecha_fin del propio contrato", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001", fechaFin: "2028-03-31" });
    expect(vencimientoEfectivo(contrato, [contrato])).toBe("2028-03-31");
  });

  it("varias adendas no anuladas: toma la fecha_fin mayor de todas", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001", fechaFin: "2026-01-01" });
    const adenda1 = crearActuacion({
      actuacionId: "ACT-0002",
      tipoActuacion: "ADENDA",
      actuacionAnteriorId: "ACT-0001",
      fechaFin: "2027-01-01",
    });
    const adenda2 = crearActuacion({
      actuacionId: "ACT-0003",
      tipoActuacion: "ADENDA",
      actuacionAnteriorId: "ACT-0001",
      fechaFin: "2026-06-01",
    });

    expect(vencimientoEfectivo(contrato, [contrato, adenda1, adenda2])).toBe("2027-01-01");
  });

  it("contrato sin fecha_fin (todavía no formalizado) devuelve undefined si tampoco hay adendas con fecha", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001" });
    expect(vencimientoEfectivo(contrato, [contrato])).toBeUndefined();
  });

  it("una adenda de otro contrato no se mezcla (filtra por actuacionAnteriorId)", () => {
    const contratoA = crearActuacion({ actuacionId: "ACT-0001", fechaFin: "2026-01-01" });
    const contratoB = crearActuacion({ actuacionId: "ACT-0099", fechaFin: "2030-01-01" });
    const adendaDeB = crearActuacion({
      actuacionId: "ACT-0002",
      tipoActuacion: "ADENDA",
      actuacionAnteriorId: "ACT-0099",
      fechaFin: "2031-01-01",
    });

    expect(vencimientoEfectivo(contratoA, [contratoA, contratoB, adendaDeB])).toBe("2026-01-01");
  });

  it("rechaza calcularse sobre algo que no sea CONTRATO", () => {
    const adenda = crearActuacion({ actuacionId: "ACT-0002", tipoActuacion: "ADENDA" });
    expect(() => vencimientoEfectivo(adenda, [adenda])).toThrow();
  });
});
