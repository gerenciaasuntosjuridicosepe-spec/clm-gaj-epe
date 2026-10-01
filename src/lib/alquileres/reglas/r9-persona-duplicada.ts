/**
 * R9 — No duplicar personas: antes de crear una persona nueva, se busca por
 * CUIT/CUIL o DNI; si ya existe, se propone reutilizarla (RF-09).
 */
import type { Persona } from "../tipos";

/** Busca una persona activa existente por DNI o CUIT/CUIL (lo que se informe). */
export function buscarPersonaDuplicada(
  personas: Persona[],
  datos: { dni?: string; cuitCuil?: string }
): Persona | undefined {
  if (!datos.dni && !datos.cuitCuil) return undefined;
  return personas.find(
    (p) =>
      p.activo &&
      ((datos.cuitCuil && p.cuitCuil === datos.cuitCuil) || (datos.dni && p.dni === datos.dni))
  );
}
