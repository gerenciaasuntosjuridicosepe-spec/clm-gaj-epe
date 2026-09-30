import { NextRequest, NextResponse } from "next/server";
import { requerirAdmin, esRespuestaError } from "@/lib/auth-guard";
import { crearSector } from "@/lib/data/catalogos-provider";

/** Biblioteca de sectores emisores de Acto Administrativo (PRD 4.3) — solo alta, administrador del sistema. */
export async function POST(req: NextRequest) {
  const sesion = await requerirAdmin();
  if (esRespuestaError(sesion)) return sesion;

  const body = (await req.json()) as { nombre?: string };
  if (!body.nombre?.trim()) {
    return NextResponse.json({ error: "El nombre del sector es obligatorio." }, { status: 400 });
  }

  const sector = await crearSector(body.nombre.trim());
  return NextResponse.json(sector, { status: 201 });
}
