import { NextRequest, NextResponse } from "next/server";
import { requerirAdmin, esRespuestaError } from "@/lib/auth-guard";
import { crearTipoAnotacion, renombrarTipoAnotacion } from "@/lib/data/catalogos-provider";

/** Catálogo de tipos de anotación de seguimiento (Redacción/Negociación) — administrador del sistema. */
export async function POST(req: NextRequest) {
  const sesion = await requerirAdmin();
  if (esRespuestaError(sesion)) return sesion;

  const body = (await req.json()) as { nombre?: string };
  if (!body.nombre?.trim()) {
    return NextResponse.json({ error: "El nombre del tipo de anotación es obligatorio." }, { status: 400 });
  }

  await crearTipoAnotacion(body.nombre.trim());
  return NextResponse.json({ nombre: body.nombre.trim() }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const sesion = await requerirAdmin();
  if (esRespuestaError(sesion)) return sesion;

  const body = (await req.json()) as { original?: string; nuevo?: string };
  if (!body.original || !body.nuevo?.trim()) {
    return NextResponse.json({ error: "Faltan datos para renombrar el tipo de anotación." }, { status: 400 });
  }

  const ok = await renombrarTipoAnotacion(body.original, body.nuevo.trim());
  if (!ok) return NextResponse.json({ error: "Tipo de anotación no encontrado." }, { status: 404 });
  return NextResponse.json({ nombre: body.nuevo.trim() });
}
