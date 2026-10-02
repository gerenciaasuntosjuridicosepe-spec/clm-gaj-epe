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

/** Catálogos, áreas, plantillas, feriados, parámetros: "L C E B | L | L | —". */
export const MATRIZ_ADMINISTRACION: Matriz = {
  ADMINISTRADOR: ["leer", "crear", "editar", "baja"],
  GESTOR: ["leer"],
  SUPERVISOR: ["leer"],
  LECTOR: [],
};

/** Actos administrativos y documentos (adjuntar enlace), sección 3 del PRD v1: "L C E B | L C E | L | L". */
export const MATRIZ_DOCUMENTOS: Matriz = {
  ADMINISTRADOR: ["leer", "crear", "editar", "baja"],
  GESTOR: ["leer", "crear", "editar"],
  SUPERVISOR: ["leer"],
  LECTOR: ["leer"],
};

/**
 * Comunicaciones (preparar borrador de aviso/reiteración, marcar como
 * enviado, registrar carta documento). La sección 3 del PRD v1 no tiene una
 * fila de "leer" propia para Comunicaciones (se ven dentro de la ficha de
 * la actuación, visible para todos los roles) pero sí restringe "Enviar
 * comunicaciones" y "Generar... desde plantilla" a ADMINISTRADOR/GESTOR
 * (columna "C" únicamente, sin SUPERVISOR/LECTOR) — se modela como esta
 * matriz, mismo criterio que MATRIZ_HITOS (no hay baja: una comunicación ya
 * registrada no se borra, es parte del historial).
 */
export const MATRIZ_COMUNICACIONES: Matriz = {
  ADMINISTRADOR: ["leer", "crear", "editar"],
  GESTOR: ["leer", "crear", "editar"],
  SUPERVISOR: ["leer"],
  LECTOR: ["leer"],
};

/**
 * Contactos EPE y localidades, sección 3 del PRD v1: "L C E B | L C E | L | L"
 * — misma forma que MATRIZ_GESTION, se reutiliza esa en vez de duplicarla.
 * Áreas no tiene una fila propia en esa tabla; se usa MATRIZ_ADMINISTRACION
 * (más restrictiva, solo ADMINISTRADOR escribe) como default razonable
 * para la estructura organizativa de EPE — ver docs/DECISIONES.md.
 */
export const MATRIZ_CONTACTOS_EPE: Matriz = MATRIZ_GESTION;

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
