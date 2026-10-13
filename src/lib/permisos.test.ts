import { describe, expect, it } from "vitest";
import { puedeEscribirContrato } from "./permisos";

describe("puedeEscribirContrato — 2026-10-13: jefe de área/gerente/administrador acceso total; abogado solo lo asignado", () => {
  it("los 3 roles de acceso total pueden escribir cualquier etapa, sin importar quién sea el abogado asignado", () => {
    for (const rolId of ["jefatura_asesoramiento", "gerencia_asuntos_juridicos", "administrador_sistema"] as const) {
      expect(puedeEscribirContrato(rolId, "Cualquiera", { etapaActual: "solicitud", abogadoACargo: "Otra persona" })).toBe(true);
      expect(puedeEscribirContrato(rolId, "Cualquiera", { etapaActual: "cierre", abogadoACargo: undefined })).toBe(true);
    }
  });

  it("un abogado asignado puede escribir en sus etapas (redacción/negociación/encuadre legal/cierre)", () => {
    for (const etapa of ["redaccion", "negociacion", "encuadre_legal", "cierre"] as const) {
      expect(puedeEscribirContrato("abogado", "M. Cardozo", { etapaActual: etapa, abogadoACargo: "M. Cardozo" })).toBe(true);
    }
  });

  it("un abogado NO asignado a este contrato no puede escribir, aunque la etapa sea suya", () => {
    expect(puedeEscribirContrato("abogado", "R. Fassi", { etapaActual: "redaccion", abogadoACargo: "M. Cardozo" })).toBe(false);
  });

  it("un abogado tampoco puede escribir si todavía no hay nadie asignado (abogadoACargo vacío)", () => {
    expect(puedeEscribirContrato("abogado", "M. Cardozo", { etapaActual: "redaccion", abogadoACargo: undefined })).toBe(false);
  });

  it("un abogado asignado sigue sin poder escribir en una etapa que no es suya", () => {
    expect(puedeEscribirContrato("abogado", "M. Cardozo", { etapaActual: "firma", abogadoACargo: "M. Cardozo" })).toBe(false);
  });

  it("los demás roles no cambian: siguen la matriz de siempre, sin mirar abogadoACargo", () => {
    expect(puedeEscribirContrato("area_solicitante", "J. Pérez", { etapaActual: "solicitud", abogadoACargo: undefined })).toBe(true);
    expect(puedeEscribirContrato("autoridad_firmante", "Cualquiera", { etapaActual: "firma", abogadoACargo: "M. Cardozo" })).toBe(true);
    expect(puedeEscribirContrato("responsable_seguimiento", "Cualquiera", { etapaActual: "ejecucion", abogadoACargo: "M. Cardozo" })).toBe(
      true
    );
    expect(puedeEscribirContrato("gerencia_administracion", "Cualquiera", { etapaActual: "solicitud", abogadoACargo: undefined })).toBe(
      false
    );
  });
});
