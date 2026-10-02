import { NextResponse } from "next/server";
import { esRespuestaError, requerirSesionAlquileres } from "@/lib/alquileres/auth-guard";
import { listarErrores } from "@/lib/alquileres/repositorio/errores";

/** Fase 4 — "pantalla de errores". Solo ADMINISTRADOR (es información operativa interna, no de negocio). */
export async function GET() {
  const sesion = await requerirSesionAlquileres();
  if (esRespuestaError(sesion)) return sesion;
  if (sesion.rolAlquileres !== "ADMINISTRADOR") {
    return NextResponse.json({ error: "Solo el ADMINISTRADOR ve la pantalla de errores." }, { status: 403 });
  }

  const errores = (await listarErrores()).slice().sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
  return NextResponse.json({ errores });
}
