/**
 * D3/D12 (PRD v2.1, sección 4) — lógica de acceso por módulo, separada de
 * `src/auth.ts` para poder probarla sin tener que invocar el pipeline
 * completo de NextAuth (que no se puede unit-testear fácilmente: construye
 * un objeto de configuración en el momento del import). Son funciones
 * puras; `auth.ts` solo las invoca desde sus callbacks `signIn`,
 * `authorized`, etc.
 */
import type { RolId } from "./types";
import type { RolAlquileresId } from "./alquileres/tipos";

const ROLES_ALQUILERES_VALIDOS: RolAlquileresId[] = ["ADMINISTRADOR", "GESTOR", "SUPERVISOR", "LECTOR"];

/** Normaliza un valor crudo de `rol_alquileres` (texto libre en Sheets) a un RolAlquileresId válido, o `undefined` si no lo es. */
export function comoRolAlquileres(valor: string | undefined): RolAlquileresId | undefined {
  return ROLES_ALQUILERES_VALIDOS.includes(valor as RolAlquileresId) ? (valor as RolAlquileresId) : undefined;
}

export interface UsuarioAccesoInput {
  rolId?: string;
  rolAlquileres?: string;
  activo?: boolean;
}

/**
 * D12: "Acceso a la app = existir en Usuarios y tener rol en al menos un
 * módulo." Antes alcanzaba con existir y tener `rolId`; ahora alcanza con
 * cualquiera de los dos roles, y se agrega el chequeo de `activo`
 * (T16: una cuenta inactiva no entra, aunque tenga rol asignado).
 */
export function puedeIniciarSesion(usuario: UsuarioAccesoInput | undefined): boolean {
  if (!usuario) return false;
  if (usuario.activo === false) return false;
  return Boolean(usuario.rolId) || Boolean(comoRolAlquileres(usuario.rolAlquileres));
}

export interface SesionConRoles {
  rolId?: RolId;
  rolAlquileres?: RolAlquileresId;
}

/**
 * T19: un usuario sin rol del módulo que corresponde a la ruta no tiene
 * acceso a esa ruta (independientemente de que haya podido iniciar sesión
 * por tener rol en el otro módulo). Rutas bajo "/alquileres" exigen
 * `rolAlquileres`; cualquier otra ruta de página (CLM) exige `rolId`.
 */
export function tieneAccesoARuta(pathname: string, sesion: SesionConRoles | undefined): boolean {
  if (!sesion) return false;
  const enAlquileres = pathname.startsWith("/alquileres");
  return enAlquileres ? Boolean(sesion.rolAlquileres) : Boolean(sesion.rolId);
}
