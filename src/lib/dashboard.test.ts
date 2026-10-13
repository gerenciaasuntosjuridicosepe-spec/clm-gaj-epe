import { describe, expect, it } from "vitest";
import { calcularDashboardContratos } from "./dashboard";
import type { Contrato } from "./types";

const HOY = "2026-06-01";

function contrato(overrides: Partial<Contrato> & { id: string }): Contrato {
  return {
    areaSolicitante: "Sector X",
    documento: "Contrato",
    tipoContrato: "Locación",
    objeto: "Objeto de prueba",
    contraparteRazonSocial: "Contraparte SA",
    contraparteIdentificacion: "30-00000000-0",
    estadoAprobacionSolicitud: "Aprobada",
    respaldoEnExpediente: true,
    anotacionesSeguimiento: [],
    hitos: [],
    estadoContrato: "Vigente",
    clausulaProrroga: false,
    clausulaRescision: false,
    clausulaPenalidad: false,
    garantiasExigidas: [],
    etapaActual: "ejecucion",
    gerenciaResponsable: "Gerencia X",
    historial: [],
    ...overrides,
  };
}

describe("calcularDashboardContratos", () => {
  it("cuenta por estadoContrato", () => {
    const contratos = [
      contrato({ id: "C1", estadoContrato: "Vigente" }),
      contrato({ id: "C2", estadoContrato: "Vencido" }),
      contrato({ id: "C3", estadoContrato: "Prórroga" }),
      contrato({ id: "C4", estadoContrato: "Rescindido" }),
    ];
    const { resumen } = calcularDashboardContratos(contratos, HOY);
    expect(resumen.total).toBe(4);
    expect(resumen.vigentes).toBe(1);
    expect(resumen.vencidos).toBe(1);
    expect(resumen.prorroga).toBe(1);
    expect(resumen.rescindidos).toBe(1);
  });

  it("solicitudesPendientes y plazoPrudencialVencido solo si sigue Pendiente", () => {
    const contratos = [
      contrato({ id: "C1", estadoAprobacionSolicitud: "Pendiente", fechaLimitePlazoPrudencial: "2026-01-01" }), // vencido
      contrato({ id: "C2", estadoAprobacionSolicitud: "Pendiente", fechaLimitePlazoPrudencial: "2026-12-31" }), // no vencido
      contrato({ id: "C3", estadoAprobacionSolicitud: "Aprobada", fechaLimitePlazoPrudencial: "2020-01-01" }), // ya no es "pendiente", no cuenta
    ];
    const { resumen } = calcularDashboardContratos(contratos, HOY);
    expect(resumen.solicitudesPendientes).toBe(2);
    expect(resumen.plazoPrudencialVencido).toBe(1);
  });

  it("contratosPorEtapa cubre las 12 etapas, aunque algunas tengan 0", () => {
    const contratos = [contrato({ id: "C1", etapaActual: "redaccion" }), contrato({ id: "C2", etapaActual: "redaccion" })];
    const { contratosPorEtapa } = calcularDashboardContratos(contratos, HOY);
    expect(contratosPorEtapa).toHaveLength(12);
    expect(contratosPorEtapa.find((e) => e.etapa === "redaccion")?.cantidad).toBe(2);
    expect(contratosPorEtapa.find((e) => e.etapa === "cierre")?.cantidad).toBe(0);
  });

  it("contratosPorTipo ordenado de mayor a menor", () => {
    const contratos = [
      contrato({ id: "C1", tipoContrato: "Locación" }),
      contrato({ id: "C2", tipoContrato: "Locación" }),
      contrato({ id: "C3", tipoContrato: "Comodato" }),
    ];
    const { contratosPorTipo } = calcularDashboardContratos(contratos, HOY);
    expect(contratosPorTipo).toEqual([
      { tipoContrato: "Locación", cantidad: 2 },
      { tipoContrato: "Comodato", cantidad: 1 },
    ]);
  });

  it("semaforoVigencia: solo Vigente/Prórroga; sin fecha_fin_vigencia cae en gris", () => {
    const contratos = [
      contrato({ id: "C1", estadoContrato: "Vigente", fechaFinVigencia: "2026-06-05" }), // 4 días -> rojo
      contrato({ id: "C2", estadoContrato: "Vigente", fechaFinVigencia: undefined }), // sin dato -> gris
      contrato({ id: "C3", estadoContrato: "Vencido", fechaFinVigencia: "2020-01-01" }), // ya no cuenta (no vigente/prórroga)
    ];
    const { semaforoVigencia } = calcularDashboardContratos(contratos, HOY);
    const porNivel = Object.fromEntries(semaforoVigencia.map((s) => [s.nivel, s.cantidad]));
    expect(porNivel.rojo).toBe(1);
    expect(porNivel.gris).toBe(1);
    expect(porNivel.verde).toBe(0);
  });

  it("vencimientosPorMes: 12 meses desde el mes de hoy, solo Vigente/Prórroga con fecha cargada", () => {
    const contratos = [
      contrato({ id: "C1", estadoContrato: "Vigente", fechaFinVigencia: "2026-06-10" }),
      contrato({ id: "C2", estadoContrato: "Prórroga", fechaFinVigencia: "2026-07-01" }),
      contrato({ id: "C3", estadoContrato: "Vencido", fechaFinVigencia: "2026-06-10" }), // no cuenta: ya no está vigente
    ];
    const { vencimientosPorMes } = calcularDashboardContratos(contratos, HOY);
    expect(vencimientosPorMes).toHaveLength(12);
    expect(vencimientosPorMes[0]).toEqual({ mes: "2026-06", cantidad: 1 });
    expect(vencimientosPorMes[1]).toEqual({ mes: "2026-07", cantidad: 1 });
  });
});
