/**
 * RF-25/26/27 — Lógica de reemplazo de etiquetas de plantilla, SIN llamar a
 * la API de Google Docs (eso exige credenciales reales de Google, fuera de
 * los límites duros de este desarrollo — ver `docs/PENDIENTES-HUMANOS.md`).
 * Esta es la parte que SÍ es viable sin Google: armar, a partir del modelo
 * de datos de Alquileres, los valores que reemplazarían cada
 * `{{ETIQUETA}}` de `ETIQUETAS_PLANTILLA_SEED`, y la función de reemplazo
 * de texto en sí (genérica, no depende de Docs). Un humano con acceso a
 * Google puede conectar esto a `DocumentApp`/la API de Docs reemplazando
 * solo la función `generar()` de un futuro `GeneradorDocumentos`, sin
 * tocar nada de este archivo.
 */
import { formatearFecha, formatearMonto } from "../fechas";
import type { Actuacion, ActuacionParte, Area, ContactoEpe, Inmueble, Persona } from "../tipos";

/** Reemplazo de texto genérico `{{CLAVE}}` -> valor. Si una clave no está en `valores`, se deja el placeholder tal cual (para notar en una revisión que faltó cargar algo, en vez de borrarlo en silencio). */
export function reemplazarEtiquetas(contenido: string, valores: Record<string, string>): string {
  return contenido.replace(/\{\{(\w+)\}\}/g, (coincidencia, clave: string) =>
    clave in valores ? valores[clave] : coincidencia
  );
}

/**
 * RF-26 — Bloque repetible de locadores: cada parte TITULAR (el PRD llama
 * "locador" al titular de una actuación de alquiler), con nombre, DNI o
 * CUIT, domicilio (el vigente en la actuación; si no se cargó, el legal de
 * la persona) y carácter — en el orden cargado (`orden`). Corrige el
 * hallazgo 13 (antes solo se mostraba un locador).
 */
export function armarBloqueLocadores(
  partes: Pick<ActuacionParte, "rolParte" | "orden" | "caracter" | "domicilioVigente" | "personaId">[],
  personas: Pick<Persona, "personaId" | "apellidoNombreRazonSocial" | "dni" | "cuitCuil" | "domicilioLegal">[]
): string {
  const locadores = partes
    .filter((p) => p.rolParte === "TITULAR")
    .sort((a, b) => a.orden - b.orden)
    .map((parte) => {
      const persona = personas.find((pe) => pe.personaId === parte.personaId);
      if (!persona) return null;
      const documento = persona.dni ? `DNI ${persona.dni}` : persona.cuitCuil ? `CUIT ${persona.cuitCuil}` : "sin documento cargado";
      const domicilio = parte.domicilioVigente ?? persona.domicilioLegal ?? "sin domicilio cargado";
      const caracter = parte.caracter ? `, en carácter de ${parte.caracter}` : "";
      return `${persona.apellidoNombreRazonSocial} (${documento}), domicilio en ${domicilio}${caracter}`;
    })
    .filter((linea): linea is string => linea !== null);

  return locadores.join("; ");
}

export interface ParametrosValoresPlantilla {
  actuacion: Pick<Actuacion, "fechaInicio" | "plazoMeses" | "fechaFin" | "canonInicial" | "condicionIvaCanon" | "reglaActualizacion">;
  area: Pick<Area, "nombre">;
  inmueble: Pick<Inmueble, "domicilio">;
  partes: Pick<ActuacionParte, "rolParte" | "orden" | "caracter" | "domicilioVigente" | "personaId">[];
  personas: Pick<Persona, "personaId" | "apellidoNombreRazonSocial" | "dni" | "cuitCuil" | "domicilioLegal">[];
  firmanteEpe?: Pick<ContactoEpe, "nombre">;
}

/** Arma los 10 valores de `ETIQUETAS_PLANTILLA_SEED` para un CONTRATO/ADENDA — ver ese archivo para el origen de cada uno. */
export function armarValoresPlantillaContrato(params: ParametrosValoresPlantilla): Record<string, string> {
  const { actuacion, area, inmueble, partes, personas, firmanteEpe } = params;

  return {
    SECTOR_EPE: area.nombre, // RF-27: el nombre del sector, NUNCA el del representante/firmante (corrige hallazgo 14).
    LOCADORES: armarBloqueLocadores(partes, personas),
    INMUEBLE_DOMICILIO: inmueble.domicilio,
    FECHA_INICIO: formatearFecha(actuacion.fechaInicio),
    PLAZO_MESES: actuacion.plazoMeses !== undefined ? String(actuacion.plazoMeses) : "—",
    FECHA_FIN: formatearFecha(actuacion.fechaFin),
    CANON_INICIAL: formatearMonto(actuacion.canonInicial),
    // CONDICION_IVA/REGLA_ACTUALIZACION: RF-27 pide la "redacción" (el texto
    // legal real), no el código del catálogo — esa redacción exacta no
    // está en ningún PRD ni en el xlsx reconstruido, así que NO se inventa
    // acá (sería contenido legal/contractual fabricado). Se deja pasar el
    // valor tal cual está guardado (código de catálogo u observaciones
    // libres de `reglaActualizacion`) como placeholder explícito — ver
    // docs/PENDIENTES-HUMANOS.md, punto sobre redacción legal de plantillas.
    CONDICION_IVA: actuacion.condicionIvaCanon ?? "—",
    REGLA_ACTUALIZACION: actuacion.reglaActualizacion ?? "—",
    FIRMANTE_EPE: firmanteEpe?.nombre ?? "—",
  };
}
