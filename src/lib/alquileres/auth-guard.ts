import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { RolAlquileresId } from "./tipos";
import { puedeAlquileres, type AccionAlquileres } from "./permisos";

export interface SesionAlquileres {
  rolAlquileres: RolAlquileresId;
  usuarioId: string;
  nombre: string;
  email: string;
}

/**
 * RF-42: toda ruta de API bajo `app/api/alquileres/**` exige sesión Y rol
 * de Alquileres — análogo a `requerirSesion()` del CLM
 * (`src/lib/auth-guard.ts`), pero chequeando `rolAlquileres` en vez de
 * `rolId`. Un usuario sin sesión recibe 401; un usuario con sesión pero sin
 * `rolAlquileres` (ej. solo tiene rol del CLM) recibe 403 — no 401, porque
 * SÍ está autenticado, solo que no para este módulo (T18/T19).
 */
export async function requerirSesionAlquileres(): Promise<SesionAlquileres | NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (!session.user.rolAlquileres) {
    return NextResponse.json({ error: "Tu cuenta no tiene un rol asignado en el módulo de Alquileres." }, { status: 403 });
  }
  return {
    rolAlquileres: session.user.rolAlquileres,
    usuarioId: session.user.usuarioId,
    nombre: session.user.name ?? "",
    email: session.user.email ?? "",
  };
}

export function esRespuestaError(v: unknown): v is NextResponse {
  return v instanceof NextResponse;
}

/** Exige además una acción concreta sobre una matriz de permisos (ver permisos.ts) — 403 si el rol no la tiene. */
export async function requerirAccionAlquileres(
  accion: AccionAlquileres,
  matriz: Parameters<typeof puedeAlquileres>[2]
): Promise<SesionAlquileres | NextResponse> {
  const sesion = await requerirSesionAlquileres();
  if (esRespuestaError(sesion)) return sesion;
  if (!puedeAlquileres(sesion.rolAlquileres, accion, matriz)) {
    return NextResponse.json({ error: "Tu rol no tiene permiso para esta acción." }, { status: 403 });
  }
  return sesion;
}
