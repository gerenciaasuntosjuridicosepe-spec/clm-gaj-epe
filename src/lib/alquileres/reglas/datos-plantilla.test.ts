import { describe, expect, it } from "vitest";
import { armarBloqueLocadores, armarValoresPlantillaContrato, reemplazarEtiquetas } from "./datos-plantilla";
import { crearActuacion, crearArea, crearContactoEpe, crearInmueble, crearParte, crearPersona } from "../test-fixtures";

describe("reemplazarEtiquetas", () => {
  it("reemplaza todas las ocurrencias de una etiqueta", () => {
    const resultado = reemplazarEtiquetas("Hola {{NOMBRE}}, de nuevo {{NOMBRE}}.", { NOMBRE: "Juan" });
    expect(resultado).toBe("Hola Juan, de nuevo Juan.");
  });

  it("deja el placeholder tal cual si la clave no está en los valores (para notar lo que falta cargar)", () => {
    const resultado = reemplazarEtiquetas("Sector: {{SECTOR_EPE}}", {});
    expect(resultado).toBe("Sector: {{SECTOR_EPE}}");
  });
});

describe("armarBloqueLocadores — RF-26 (corrige hallazgo 13)", () => {
  it("muestra los tres locadores de un contrato con nombre, documento, domicilio y carácter", () => {
    const personas = [
      crearPersona({ personaId: "PER-1", apellidoNombreRazonSocial: "Pérez, Juan", dni: "20111222" }),
      crearPersona({ personaId: "PER-2", apellidoNombreRazonSocial: "Gómez, Ana", cuitCuil: "27-23456789-4" }),
      crearPersona({ personaId: "PER-3", apellidoNombreRazonSocial: "Sucesión López", domicilioLegal: "Calle Legal 1" }),
    ];
    const partes = [
      crearParte({ parteId: "PAR-1", actuacionId: "ACT-0001", personaId: "PER-1", rolParte: "TITULAR", orden: 1, caracter: "propietario", domicilioVigente: "Calle 1" }),
      crearParte({ parteId: "PAR-2", actuacionId: "ACT-0001", personaId: "PER-2", rolParte: "TITULAR", orden: 2, caracter: "propietaria" }),
      crearParte({ parteId: "PAR-3", actuacionId: "ACT-0001", personaId: "PER-3", rolParte: "TITULAR", orden: 3 }),
      // Un FIRMANTE no es locador — no debe aparecer en el bloque.
      crearParte({ parteId: "PAR-4", actuacionId: "ACT-0001", personaId: "PER-1", rolParte: "FIRMANTE", orden: 4 }),
    ];

    const bloque = armarBloqueLocadores(partes, personas);

    expect(bloque).toContain("Pérez, Juan (DNI 20111222), domicilio en Calle 1, en carácter de propietario");
    expect(bloque).toContain("Gómez, Ana (CUIT 27-23456789-4)");
    expect(bloque).toContain("Sucesión López (sin documento cargado), domicilio en Calle Legal 1");
    // Los tres, en el orden cargado, y ningún FIRMANTE.
    const posJuan = bloque.indexOf("Pérez, Juan");
    const posAna = bloque.indexOf("Gómez, Ana");
    const posLopez = bloque.indexOf("Sucesión López");
    expect(posJuan).toBeLessThan(posAna);
    expect(posAna).toBeLessThan(posLopez);
    expect(bloque.split(";").length).toBe(3);
  });

  it("devuelve vacío si no hay ningún TITULAR", () => {
    expect(armarBloqueLocadores([], [])).toBe("");
  });
});

describe("armarValoresPlantillaContrato — RF-25/27", () => {
  it("SECTOR_EPE toma el nombre del sector, nunca el del firmante (corrige hallazgo 14)", () => {
    const valores = armarValoresPlantillaContrato({
      actuacion: crearActuacion({ actuacionId: "ACT-0001", fechaInicio: "2026-01-01", plazoMeses: 12, fechaFin: "2026-12-31", canonInicial: 100000, condicionIvaCanon: "MAS_IVA" }),
      area: crearArea({ areaId: "AR-0001", nombre: "Sucursal Rosario" }),
      inmueble: crearInmueble({ inmuebleId: "INM-0001", domicilio: "Calle Falsa 123" }),
      partes: [],
      personas: [],
      firmanteEpe: crearContactoEpe({ contactoId: "CON-0001", areaId: "AR-0001", nombre: "Ingeniero Firmante" }),
    });

    expect(valores.SECTOR_EPE).toBe("Sucursal Rosario");
    expect(valores.SECTOR_EPE).not.toBe("Ingeniero Firmante");
    expect(valores.FIRMANTE_EPE).toBe("Ingeniero Firmante");
    expect(valores.INMUEBLE_DOMICILIO).toBe("Calle Falsa 123");
    expect(valores.FECHA_INICIO).toBe("01/01/2026");
    expect(valores.FECHA_FIN).toBe("31/12/2026");
    expect(valores.PLAZO_MESES).toBe("12");
    expect(valores.CANON_INICIAL).toContain("100.000");
  });

  it("sin firmante cargado, FIRMANTE_EPE queda como placeholder explícito, no vacío silencioso", () => {
    const valores = armarValoresPlantillaContrato({
      actuacion: crearActuacion({ actuacionId: "ACT-0001" }),
      area: crearArea({ areaId: "AR-0001", nombre: "Gerencia Comercial" }),
      inmueble: crearInmueble({ inmuebleId: "INM-0001" }),
      partes: [],
      personas: [],
    });
    expect(valores.FIRMANTE_EPE).toBe("—");
  });
});
