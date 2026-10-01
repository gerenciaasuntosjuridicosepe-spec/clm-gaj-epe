import { describe, expect, it } from "vitest";
import { insertarLegitimoAbonoEnCadena, validarCadenaActuacion } from "./r3-cadena-actuaciones";
import { crearActuacion } from "../test-fixtures";

describe("R3' — cadena de actuaciones por tipo", () => {
  it("CONTRATO sin anterior es válido (primero del inmueble)", () => {
    const c = crearActuacion({ actuacionId: "ACT-0001" });
    expect(validarCadenaActuacion(c, [c]).valida).toBe(true);
  });

  it("CONTRATO puede apuntar a un CONTRATO anterior del mismo inmueble (renovación)", () => {
    const a = crearActuacion({ actuacionId: "ACT-0001", estadoActuacion: "CERRADA" });
    const b = crearActuacion({ actuacionId: "ACT-0002", actuacionAnteriorId: "ACT-0001" });
    expect(validarCadenaActuacion(b, [a, b]).valida).toBe(true);
  });

  it("CONTRATO puede apuntar a un LEGITIMO_ABONO anterior", () => {
    const la = crearActuacion({ actuacionId: "ACT-LA1", tipoActuacion: "LEGITIMO_ABONO" });
    const b = crearActuacion({ actuacionId: "ACT-0002", actuacionAnteriorId: "ACT-LA1" });
    expect(validarCadenaActuacion(b, [la, b]).valida).toBe(true);
  });

  it("CONTRATO no puede apuntar a una ADENDA", () => {
    const adenda = crearActuacion({ actuacionId: "ACT-AD1", tipoActuacion: "ADENDA", actuacionAnteriorId: "x" });
    const b = crearActuacion({ actuacionId: "ACT-0002", actuacionAnteriorId: "ACT-AD1" });
    expect(validarCadenaActuacion(b, [adenda, b]).valida).toBe(false);
  });

  it("CONTRATO no puede apuntar a una actuación de otro inmueble", () => {
    const a = crearActuacion({ actuacionId: "ACT-0001", inmuebleId: "INM-9999" });
    const b = crearActuacion({ actuacionId: "ACT-0002", inmuebleId: "INM-0001", actuacionAnteriorId: "ACT-0001" });
    expect(validarCadenaActuacion(b, [a, b]).valida).toBe(false);
  });

  it("ADENDA exige actuacion_anterior_id y debe apuntar a un CONTRATO", () => {
    const sinAnterior = crearActuacion({ actuacionId: "ACT-0002", tipoActuacion: "ADENDA" });
    expect(validarCadenaActuacion(sinAnterior, [sinAnterior]).valida).toBe(false);

    const contrato = crearActuacion({ actuacionId: "ACT-0001" });
    const adenda = crearActuacion({ actuacionId: "ACT-0002", tipoActuacion: "ADENDA", actuacionAnteriorId: "ACT-0001" });
    expect(validarCadenaActuacion(adenda, [contrato, adenda]).valida).toBe(true);
  });

  it("ADENDA no puede apuntar a otra ADENDA ni a un LEGITIMO_ABONO", () => {
    const contrato = crearActuacion({ actuacionId: "ACT-0001" });
    const adenda1 = crearActuacion({ actuacionId: "ACT-0002", tipoActuacion: "ADENDA", actuacionAnteriorId: "ACT-0001" });
    const adenda2 = crearActuacion({ actuacionId: "ACT-0003", tipoActuacion: "ADENDA", actuacionAnteriorId: "ACT-0002" });
    expect(validarCadenaActuacion(adenda2, [contrato, adenda1, adenda2]).valida).toBe(false);

    const la = crearActuacion({ actuacionId: "ACT-LA1", tipoActuacion: "LEGITIMO_ABONO" });
    const adendaDeLA = crearActuacion({ actuacionId: "ACT-0004", tipoActuacion: "ADENDA", actuacionAnteriorId: "ACT-LA1" });
    expect(validarCadenaActuacion(adendaDeLA, [la, adendaDeLA]).valida).toBe(false);
  });

  it("LEGITIMO_ABONO exige actuacion_anterior_id apuntando a un CONTRATO", () => {
    const sinAnterior = crearActuacion({ actuacionId: "ACT-LA1", tipoActuacion: "LEGITIMO_ABONO" });
    expect(validarCadenaActuacion(sinAnterior, [sinAnterior]).valida).toBe(false);

    const contrato = crearActuacion({ actuacionId: "ACT-0001" });
    const la = crearActuacion({ actuacionId: "ACT-LA1", tipoActuacion: "LEGITIMO_ABONO", actuacionAnteriorId: "ACT-0001" });
    expect(validarCadenaActuacion(la, [contrato, la]).valida).toBe(true);
  });

  it("rechaza ciclos", () => {
    const a = crearActuacion({ actuacionId: "ACT-0001", actuacionAnteriorId: "ACT-0003" });
    const b = crearActuacion({ actuacionId: "ACT-0002", actuacionAnteriorId: "ACT-0001" });
    const c = crearActuacion({ actuacionId: "ACT-0003", actuacionAnteriorId: "ACT-0002" });
    // Validamos la última inserción que cierra el ciclo (c -> b -> a -> c).
    expect(validarCadenaActuacion(c, [a, b, c]).valida).toBe(false);
  });

  it("rechaza actuacion_anterior_id inexistente", () => {
    const b = crearActuacion({ actuacionId: "ACT-0002", actuacionAnteriorId: "ACT-NO-EXISTE" });
    expect(validarCadenaActuacion(b, [b]).valida).toBe(false);
  });
});

describe("R3a — insertar legítimo abono en la cadena (T8)", () => {
  it("T8: A vencido con renovación B en trámite; se crea el LA → LA.anterior=A, B.anterior=LA", () => {
    const contratoA = crearActuacion({ actuacionId: "ACT-0001", estadoActuacion: "CERRADA", fechaFin: "2020-01-01" });
    const renovacionB = crearActuacion({
      actuacionId: "ACT-0002",
      actuacionAnteriorId: "ACT-0001",
      estadoActuacion: "EN_TRAMITE",
    });
    const legitimoAbono = crearActuacion({ actuacionId: "ACT-LA1", tipoActuacion: "LEGITIMO_ABONO" });

    const resultado = insertarLegitimoAbonoEnCadena(contratoA, legitimoAbono, renovacionB);

    expect(resultado.legitimoAbonoActualizado.actuacionAnteriorId).toBe("ACT-0001");
    expect(resultado.renovacionBActualizada.actuacionAnteriorId).toBe("ACT-LA1");

    // La cadena resultante A -> LA -> B es válida según R3'.
    const cadenaFinal = [contratoA, resultado.legitimoAbonoActualizado, resultado.renovacionBActualizada];
    expect(validarCadenaActuacion(resultado.legitimoAbonoActualizado, cadenaFinal).valida).toBe(true);
    expect(validarCadenaActuacion(resultado.renovacionBActualizada, cadenaFinal).valida).toBe(true);
  });

  it("rechaza insertar si B no apuntaba realmente a A", () => {
    const contratoA = crearActuacion({ actuacionId: "ACT-0001" });
    const otroContrato = crearActuacion({ actuacionId: "ACT-9999" });
    const renovacionB = crearActuacion({ actuacionId: "ACT-0002", actuacionAnteriorId: "ACT-9999" });
    const la = crearActuacion({ actuacionId: "ACT-LA1", tipoActuacion: "LEGITIMO_ABONO" });

    expect(() => insertarLegitimoAbonoEnCadena(contratoA, la, renovacionB)).toThrow();
    expect(otroContrato).toBeDefined(); // solo para dejar explícito que no participa
  });

  it("rechaza si la actuación a insertar no es LEGITIMO_ABONO", () => {
    const contratoA = crearActuacion({ actuacionId: "ACT-0001" });
    const renovacionB = crearActuacion({ actuacionId: "ACT-0002", actuacionAnteriorId: "ACT-0001" });
    const noEsLA = crearActuacion({ actuacionId: "ACT-9999" });

    expect(() => insertarLegitimoAbonoEnCadena(contratoA, noEsLA, renovacionB)).toThrow();
  });
});
