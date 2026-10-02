import { describe, expect, it } from "vitest";
import { calcularVencimientosPorHorizonte } from "./rp01-vencimientos";
import { crearActuacion, crearInmueble } from "../test-fixtures";

const HOY = "2026-06-01";

describe("calcularVencimientosPorHorizonte — RP-01", () => {
  it("un contrato que vence en 45 días cae en el horizonte de 60, no en el de 30", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001", fechaInicio: "2026-01-01", fechaFin: "2026-07-16" }); // 45 días
    const filas = calcularVencimientosPorHorizonte([contrato], [], HOY);

    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ actuacionId: "ACT-0001", diasRestantes: 45, horizonte: 60 });
  });

  it("un contrato ya vencido no aparece en el reporte en absoluto (eso es A5, no RP-01 — RP-01 es 'vence en', no 'ya venció')", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001", fechaInicio: "2019-01-01", fechaFin: "2020-01-01" });
    const filas = calcularVencimientosPorHorizonte([contrato], [], HOY);
    expect(filas).toHaveLength(0);
  });

  it("un contrato que vence en más de 365 días queda sin horizonte asignado, pero sigue en la lista", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001", fechaInicio: "2026-01-01", fechaFin: "2028-01-01" });
    const filas = calcularVencimientosPorHorizonte([contrato], [], HOY);
    expect(filas).toHaveLength(1);
    expect(filas[0].horizonte).toBeNull();
  });

  it("incluye la localidad del inmueble y si tiene renovación en curso (C4)", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001", inmuebleId: "INM-0001", fechaInicio: "2026-01-01", fechaFin: "2026-06-20" });
    const renovacion = crearActuacion({ actuacionId: "ACT-0002", inmuebleId: "INM-0001", actuacionAnteriorId: "ACT-0001", estadoActuacion: "EN_TRAMITE" });
    const inmueble = crearInmueble({ inmuebleId: "INM-0001", localidadId: "LOC-ROSARIO" });

    const filas = calcularVencimientosPorHorizonte([contrato, renovacion], [inmueble], HOY);
    expect(filas[0]).toMatchObject({ localidadId: "LOC-ROSARIO", renovacionEnCurso: true });
  });

  it("no incluye actuaciones VENCIDA/FUTURA ni otros tipos de actuación", () => {
    const vencida = crearActuacion({ actuacionId: "ACT-A", fechaInicio: "2019-01-01", fechaFin: "2020-01-01", estadoActuacion: "NO_RENOVADO" });
    const futura = crearActuacion({ actuacionId: "ACT-B", fechaInicio: "2027-01-01", fechaFin: "2027-12-31" });
    const legitimoAbono = crearActuacion({ actuacionId: "ACT-C", tipoActuacion: "LEGITIMO_ABONO", fechaInicio: "2026-01-01", fechaFin: "2026-06-10" });

    const filas = calcularVencimientosPorHorizonte([vencida, futura, legitimoAbono], [], HOY);
    expect(filas).toHaveLength(0);
  });

  it("ordena de menor a mayor días restantes", () => {
    const lejano = crearActuacion({ actuacionId: "ACT-LEJANO", fechaInicio: "2026-01-01", fechaFin: "2026-12-31" });
    const cercano = crearActuacion({ actuacionId: "ACT-CERCANO", fechaInicio: "2026-01-01", fechaFin: "2026-06-10" });
    const filas = calcularVencimientosPorHorizonte([lejano, cercano], [], HOY);
    expect(filas.map((f) => f.actuacionId)).toEqual(["ACT-CERCANO", "ACT-LEJANO"]);
  });
});
