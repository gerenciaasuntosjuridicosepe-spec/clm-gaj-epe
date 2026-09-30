import { NextRequest, NextResponse } from "next/server";
import { requerirAdmin, esRespuestaError } from "@/lib/auth-guard";
import { crearTipoGarantia, renombrarTipoGarantia } from "@/lib/data/catalogos-provider";

/** Catálogo de tipos de garantía exigida (etapa Renovación/Cierre) — administrador del sistema. */
export async function POST(req: NextRequest) {
  const sesion = await requerirAdmin();
  if (esRespuestaError(sesion)) return sesion;

  const body = (await req.json()) as { nombre?: string };
  if (!body.nombre?.trim()) {
    return NextResponse.json({ error: "El nombre del tipo de garantía es obligatorio." }, { status: 400 });
  }

  await crearTipoGarantia(body.nombre.trim());
  return NextResponse.json({ nombre: body.nombre.trim() }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const sesion = await requerirAdmin();
  if (esRespuestaError(sesion)) return sesion;

  const body = (await req.json()) as { original?: string; nuevo?: string };
  if (!body.original || !body.nuevo?.trim()) {
    return NextResponse.json({ error: "Faltan datos para renombrar el tipo de garantía." }, { status: 400 });
  }

  const ok = await renombrarTipoGarantia(body.original, body.nuevo.trim());
  if (!ok) return NextResponse.json({ error: "Tipo de garantía no encontrado." }, { status: 404 });
  return NextResponse.json({ nombre: body.nuevo.trim() });
}
