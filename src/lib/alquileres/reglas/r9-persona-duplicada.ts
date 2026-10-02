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

/**
 * RP-09 (calidad de datos) — a diferencia de `buscarPersonaDuplicada`
 * (un candidato nuevo contra lo existente, para el alta), esta recorre
 * TODAS las personas activas buscando grupos ya duplicados por DNI o por
 * CUIT/CUIL (ej. si R9 no se aplicó en algún momento, o si dos personas se
 * cargaron casi a la vez). Devuelve un grupo por cada documento repetido.
 */
export function buscarGruposDuplicados(personas: Persona[]): { documento: string; personas: Persona[] }[] {
  const activas = personas.filter((p) => p.activo);
  const porDocumento = new Map<string, Persona[]>();

  for (const p of activas) {
    for (const doc of [p.dni, p.cuitCuil]) {
      if (!doc) continue;
      const grupo = porDocumento.get(doc) ?? [];
      grupo.push(p);
      porDocumento.set(doc, grupo);
    }
  }

  return Array.from(porDocumento.entries())
    .filter(([, grupo]) => grupo.length > 1)
    .map(([documento, grupo]) => ({ documento, personas: grupo }));
}
