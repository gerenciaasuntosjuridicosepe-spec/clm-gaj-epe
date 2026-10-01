import { describe, expect, it } from "vitest";
import { validarObligatoriosFormalizacion } from "./r4-obligatorios-formalizada";
import { crearActuacion } from "../test-fixtures";

describe("R4' — obligatorios para FORMALIZADA", () => {
  it("rechaza un CONTRATO recién creado (solo tipo, inmueble, sector, estado)", () => {
    const actuacion = crearActuacion({ actuacionId: "ACT-0001" });
    const r = validarObligatoriosFormalizacion(actuacion);
    expect(r.valida).toBe(false);
    expect(r.camposFaltantes).toContain("fecha de inicio");
    expect(r.camposFaltantes).toContain("plazo en meses");
    expect(r.camposFaltantes).toContain("firmante de EPE");
  });

  it("acepta un CONTRATO con todos los datos de R4'", () => {
    const actuacion = crearActuacion({
      actuacionId: "ACT-0001",
      fechaInicio: "2026-01-01",
      plazoMeses: 24,
      fechaFin: "2027-12-31",
      canonInicial: 100000,
      condicionIvaCanon: "SIN_IVA",
      destinoCategoria: "OFICINAS",
      destinoDescripcion: "Oficinas administrativas",
      firmanteEpeContactoId: "CON-0001",
    });
    expect(validarObligatoriosFormalizacion(actuacion).valida).toBe(true);
  });

  it("LEGITIMO_ABONO exige período, monto y al menos un acto administrativo (no plazo/destino/firmante)", () => {
    const la = crearActuacion({
      actuacionId: "ACT-LA1",
      tipoActuacion: "LEGITIMO_ABONO",
      fechaInicio: "2026-01-01",
      fechaFin: "2026-06-30",
      canonInicial: 50000,
      condicionIvaCanon: "SIN_IVA",
    });

    const sinActo = validarObligatoriosFormalizacion(la, false);
    expect(sinActo.valida).toBe(false);
    expect(sinActo.camposFaltantes).toContain("al menos un acto administrativo");
    expect(sinActo.camposFaltantes).not.toContain("plazo en meses");

    const conActo = validarObligatoriosFormalizacion(la, true);
    expect(conActo.valida).toBe(true);
  });
});
