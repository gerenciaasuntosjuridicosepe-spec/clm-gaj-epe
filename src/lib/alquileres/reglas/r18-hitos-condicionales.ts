/**
 * R18 — Hitos condicionales.
 *  - H-02 (respuesta de la sucursal) pasa a NO_APLICA si el sector
 *    interesado no es de tipo SUCURSAL (ej. gerencias de Infraestructura o
 *    Explotación).
 *  - H-03 (reiteración) pasa a NO_APLICA cuando H-02 y H-21 están cumplidos.
 *  - H-04 (carta documento) pasa a NO_APLICA si hay un documento
 *    PROPUESTA_LOCADOR, o si un GESTOR la marca con motivo (esto último es
 *    una acción manual, no una condición automática: se expone acá solo la
 *    parte automática).
 */
import type { EstadoHito } from "../tipos";

/** H-02: NO_APLICA automático si el área del sector interesado no es de tipo SUCURSAL. */
export function h02NoAplicaPorTipoDeArea(tipoAreaSectorInteresado: string): boolean {
  return tipoAreaSectorInteresado !== "SUCURSAL";
}

/** H-03: NO_APLICA automático cuando tanto H-02 (sucursal) como H-21 (gerencia) ya están cumplidos. */
export function h03NoAplicaPorRespuestasCumplidas(estadoH02: EstadoHito, estadoH21: EstadoHito): boolean {
  return estadoH02 === "CUMPLIDO" && estadoH21 === "CUMPLIDO";
}

/** H-04: NO_APLICA automático si existe un documento de tipo PROPUESTA_LOCADOR cargado para la actuación. */
export function h04NoAplicaPorPropuestaLocador(tiposDocumentoCargados: string[]): boolean {
  return tiposDocumentoCargados.includes("PROPUESTA_LOCADOR");
}
