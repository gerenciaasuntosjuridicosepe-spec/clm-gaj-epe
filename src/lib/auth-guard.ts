import { NextResponse } from "next/server";
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
