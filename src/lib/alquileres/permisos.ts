/**
 * Matriz de permisos del módulo de Alquileres — PRD v1, sección 3 ("La
 * matriz de permisos de la sección 3 del v1 se conserva sin cambios",
 * PRD v2.1 sección 4, punto 7). L = leer, C = crear, E = editar,
 * B = baja lógica/anulación, — = sin acceso.
 */
import type { RolAlquileresId } from "./tipos";

export type AccionAlquileres = "leer" | "crear" | "editar" | "baja";

type Matriz = Record<RolAlquileresId, AccionAlquileres[]>;

/** Inmuebles, expedientes, actuaciones: "L C E B | L C E | L B | L". */
export const MATRIZ_GESTION: Matriz = {
  ADMINISTRADOR: ["leer", "crear", "editar", "baja"],
  GESTOR: ["leer", "crear", "editar"],
  SUPERVISOR: ["leer", "baja"],
  LECTOR: ["leer"],
};

/** Personas y partes (locadores): "L C E B | L C E | L | —" — LECTOR sin acceso en absoluto (dato personal). */
export const MATRIZ_PERSONAS: Matriz = {
  ADMINISTRADOR: ["leer", "crear", "editar", "baja"],
  GESTOR: ["leer", "crear", "editar"],
  SUPERVISOR: ["leer"],
  LECTOR: [],
};

/** Hitos (cumplir, reprogramar, marcar NO_APLICA): "L C E | L C E | L | L". */
export const MATRIZ_HITOS: Matriz = {
  ADMINISTRADOR: ["leer", "crear", "editar"],
  GESTOR: ["leer", "crear", "editar"],
  SUPERVISOR: ["leer"],
  LECTOR: ["leer"],
};

/** Catálogos, áreas, contactos EPE, plantillas, feriados, parámetros: "L C E B | L | L | —". */
export const MATRIZ_ADMINISTRACION: Matriz = {
  ADMINISTRADOR: ["leer", "crear", "editar", "baja"],
  GESTOR: ["leer"],
  SUPERVISOR: ["leer"],
  LECTOR: [],
};

export function puedeAlquileres(rol: RolAlquileresId | undefined, accion: AccionAlquileres, matriz: Matriz): boolean {
  if (!rol) return false;
  return matriz[rol].includes(accion);
}

/** Etiqueta visible del rol de Alquileres (ej. Topbar compartido con el CLM, para una sesión sin rol del CLM — D12). */
export const ETIQUETAS_ROL_ALQUILERES: Record<RolAlquileresId, string> = {
  ADMINISTRADOR: "Administrador de Alquileres",
  GESTOR: "Gestor de Alquileres",
  SUPERVISOR: "Supervisor de Alquileres",
  LECTOR: "Lector de Alquileres",
};

/** RA-3 equivalente: campos personales de PERSONAS, enmascarados para LECTOR (que de todos modos no tiene ni "leer" en MATRIZ_PERSONAS — esto es la segunda capa, por si se expone en un listado general). */
export const CAMPOS_PERSONALES = ["dni", "cuitCuil", "domicilioLegal", "mail", "telefono"] as const;

/** Enmascara los campos personales de un objeto tipo Persona si el rol es LECTOR (defensa en profundidad — ver CAMPOS_PERSONALES). */
export function enmascararSiLector<T extends object>(obj: T, rol: RolAlquileresId | undefined): T {
  if (rol !== "LECTOR") return obj;
  const copia = { ...obj } as Record<string, unknown>;
  for (const campo of CAMPOS_PERSONALES) {
    if (campo in copia) copia[campo] = undefined;
  }
  return copia as unknown as T;
}
