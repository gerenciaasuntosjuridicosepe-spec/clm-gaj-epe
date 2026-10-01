/**
 * D12: la hoja Usuarios es compartida con el CLM a propósito ("hoja central
 * de accesos") — por eso este archivo SÍ importa de `src/lib/data/*` (a
 * diferencia de `src/lib/alquileres/repositorio/*`, que tiene prohibido
 * hacerlo por T26: la planilla de datos de negocio de Alquileres es propia
 * y separada, pero Usuarios no es una tabla de negocio de ningún módulo,
 * es la identidad compartida).
 *
 * T27: "El módulo intenta escribir una columna de Usuarios distinta de
 * `rol_alquileres` o `activo` → rechazado." La única función de escritura
 * de Usuarios que el resto del código de Alquileres puede usar es
 * `actualizarAccesoAlquileres()`, que descarta en tiempo de ejecución
 * cualquier campo que no sea `rolAlquileres`/`activo` — incluso si el
 * llamador (por un bug, o porque alguien hizo un `as any`) intenta mandar
 * `rolId`, `nombre`, `email`, etc. Los roles del CLM siguen editándose
 * desde la UI de Administración del CLM (`/api/usuarios`), no desde acá.
 */
import { actualizarUsuario, listarUsuarios } from "@/lib/data/usuarios-provider";
import type { Usuario } from "@/lib/data/mock-catalogos";

export interface CambiosAccesoAlquileres {
  rolAlquileres?: string;
  activo?: boolean;
}

/** T27: construye el objeto de cambios SOLO con rolAlquileres/activo, descartando cualquier otra clave que venga en `cambios`. */
function restringirACamposDeAlquileres(cambios: Record<string, unknown>): CambiosAccesoAlquileres {
  const restringido: CambiosAccesoAlquileres = {};
  if ("rolAlquileres" in cambios) restringido.rolAlquileres = cambios.rolAlquileres as string | undefined;
  if ("activo" in cambios) restringido.activo = cambios.activo as boolean | undefined;
  return restringido;
}

/**
 * Única función de escritura de Usuarios expuesta al módulo de Alquileres.
 * Aunque el tipo de `cambios` ya restringe lo que un llamador que respete
 * TypeScript puede pasar, se vuelve a filtrar en tiempo de ejecución (T27)
 * por si algún llamador bypassea el tipo (`as never`/JS sin tipos).
 */
export async function actualizarAccesoAlquileres(id: string, cambios: CambiosAccesoAlquileres): Promise<Usuario | undefined> {
  const cambiosRestringidos = restringirACamposDeAlquileres(cambios as Record<string, unknown>);
  return actualizarUsuario(id, cambiosRestringidos);
}

/** Usuarios con algún rol en el módulo de Alquileres (para la pantalla de gestión de accesos del ADMINISTRADOR de Alquileres). */
export async function listarUsuariosConAccesoAlquileres(): Promise<Usuario[]> {
  const todos = await listarUsuarios();
  return todos.filter((u) => Boolean(u.rolAlquileres));
}
