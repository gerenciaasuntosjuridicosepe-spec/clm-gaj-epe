import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { accesoEtapa, puedeVerContrato } from "@/lib/permisos";
import { RolId } from "@/lib/types";
import { getContratosProvider } from "@/lib/data/provider";

export interface SesionAutorizada {
  rolId: RolId;
  usuarioId: string;
  nombre: string;
}

/**
 * Resuelve la sesión activa para una ruta de API. El middleware ya bloquea
 * el acceso anónimo a nivel de página, pero las rutas de API validan la
 * sesión por su cuenta — no dependen de que nadie las llame siempre desde
 * el navegador de la app (ver hallazgo crítico #4 del informe).
 */
export async function requerirSesion(): Promise<SesionAutorizada | NextResponse> {
  const session = await auth();
  if (!session?.user?.rolId || !session.user.usuarioId) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  return { rolId: session.user.rolId, usuarioId: session.user.usuarioId, nombre: session.user.name ?? "" };
}

export function esRespuestaError(v: unknown): v is NextResponse {
  return v instanceof NextResponse;
}

/**
 * Angosta `session.user.rolId` (opcional desde D12/D3, PRD v2.1 sección 4:
 * un usuario puede tener sesión solo por su rol en el módulo de Alquileres,
 * sin rol del CLM) a `RolId` para que las páginas de servidor del CLM
 * puedan seguir llamando a `listarVisibles(rolId)` / `puedeVerContrato(rolId, ...)`
 * sin manejar `undefined` en cada una.
 *
 * En la práctica esto nunca debería faltar en estas páginas: el callback
 * `authorized` de `src/auth.ts` (vía `tieneAccesoARuta`,
 * `src/lib/acceso-modulo.ts`) ya redirige a `/sin-acceso` antes de que
 * cualquier página del CLM llegue a ejecutarse con una sesión sin `rolId`.
 * Si este `throw` llegara a dispararse, es síntoma de un bug en ese gate
 * (o de llamar a esta función desde un lugar no protegido por el proxy,
 * como una ruta de API — para eso está `requerirSesion()`, no esto), no un
 * caso esperado de uso normal.
 */
export function rolClmDeSesion(session: Session | null): RolId {
  const rolId = session?.user?.rolId;
  if (!rolId) {
    throw new Error(
      "rolClmDeSesion: sesión sin rolId del CLM — no debería poder llegar acá (ver callback authorized en src/auth.ts)."
    );
  }
  return rolId;
}

/**
 * Autoriza escrituras sobre catálogos de Administración (Sectores, Tipos de
 * contrato/anotación/garantía, Usuarios) — a diferencia de los contratos, acá
 * no hay "etapa" contra la cual chequear `accesoEtapa`, así que el criterio
 * es directo: solo `administrador_sistema` gestiona configuración del sistema
 * (PRD sección 3, descripción del rol).
 */
export async function requerirAdmin(): Promise<SesionAutorizada | NextResponse> {
  const sesion = await requerirSesion();
  if (esRespuestaError(sesion)) return sesion;
  if (sesion.rolId !== "administrador_sistema") {
    return NextResponse.json({ error: "Solo Administración del sistema puede modificar catálogos." }, { status: 403 });
  }
  return sesion;
}

/**
 * Autoriza una escritura sobre un contrato existente: además de poder verlo,
 * el rol tiene que ser responsable ("R") de su etapa actual — es el mismo
 * criterio que ya expresa `permisos.ts`, acá se lo hace cumplir también en
 * el servidor, no solo en qué botones muestra la UI. Parche pragmático
 * (ver informe, pendiente #7): cuando Jurídicos valide la matriz completa,
 * esto se puede reemplazar por una tabla de transiciones dedicada sin tocar
 * a los llamadores.
 */
export async function requerirAccesoEscritura(
  contratoId: string,
  sesion: SesionAutorizada
): Promise<{ error: NextResponse } | { error: null }> {
  const contrato = await getContratosProvider().obtener(contratoId);
  if (!contrato) {
    return { error: NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 }) };
  }
  if (!puedeVerContrato(sesion.rolId, contrato.etapaActual)) {
    return { error: NextResponse.json({ error: "No tenés acceso a este contrato." }, { status: 403 }) };
  }
  if (accesoEtapa(sesion.rolId, contrato.etapaActual) !== "R") {
    return {
      error: NextResponse.json(
        { error: "Tu rol no es responsable de la etapa actual de este contrato." },
        { status: 403 }
      ),
    };
  }
  return { error: null };
}
