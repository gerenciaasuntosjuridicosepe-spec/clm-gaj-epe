import { NextRequest, NextResponse } from "next/server";
import { requerirAdmin, esRespuestaError } from "@/lib/auth-guard";
import { crearUsuario } from "@/lib/data/usuarios-provider";
import { ROLES } from "@/lib/permisos";
import { RolId } from "@/lib/types";

/** Alta de usuarios del CLM (PRD 3/6.7) — el email es lo que habilita el login con Google (ver src/auth.ts). */
export async function POST(req: NextRequest) {
  const sesion = await requerirAdmin();
  if (esRespuestaError(sesion)) return sesion;

  const body = (await req.json()) as { nombre?: string; rolId?: string; area?: string; email?: string };
  if (!body.nombre?.trim() || !body.email?.trim() || !body.rolId) {
    return NextResponse.json({ error: "Nombre, email y rol son obligatorios." }, { status: 400 });
  }
  if (!(body.rolId in ROLES)) {
    return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
  }

  const usuario = await crearUsuario({
    nombre: body.nombre.trim(),
    rolId: body.rolId as RolId,
    area: body.area?.trim() || undefined,
    email: body.email.trim().toLowerCase(),
  });
  return NextResponse.json(usuario, { status: 201 });
}
