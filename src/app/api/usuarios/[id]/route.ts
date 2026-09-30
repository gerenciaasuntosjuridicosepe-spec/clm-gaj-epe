import { NextRequest, NextResponse } from "next/server";
import { requerirAdmin, esRespuestaError } from "@/lib/auth-guard";
import { actualizarUsuario } from "@/lib/data/usuarios-provider";
import { ROLES } from "@/lib/permisos";
import { RolId } from "@/lib/types";

/** Edición de usuarios del CLM — nombre, rol, área y email (PRD 3/6.7). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sesion = await requerirAdmin();
  if (esRespuestaError(sesion)) return sesion;

  const body = (await req.json()) as { nombre?: string; rolId?: string; area?: string; email?: string };
  if (body.rolId && !(body.rolId in ROLES)) {
    return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
  }

  const cambios: Partial<{ nombre: string; rolId: RolId; area?: string; email: string }> = {};
  if (body.nombre?.trim()) cambios.nombre = body.nombre.trim();
  if (body.rolId) cambios.rolId = body.rolId as RolId;
  if (body.area !== undefined) cambios.area = body.area.trim() || undefined;
  if (body.email?.trim()) cambios.email = body.email.trim().toLowerCase();

  const actualizado = await actualizarUsuario(id, cambios);
  if (!actualizado) return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  return NextResponse.json(actualizado);
}
