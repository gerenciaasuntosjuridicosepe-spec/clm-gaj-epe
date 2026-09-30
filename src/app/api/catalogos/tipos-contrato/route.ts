import { NextRequest, NextResponse } from "next/server";
import { requerirAdmin, esRespuestaError } from "@/lib/auth-guard";
import { crearTipoContrato, renombrarTipoContrato } from "@/lib/data/catalogos-provider";

/**
 * Catálogo de tipos de contrato (PRD 4.1bis) — alta y renombrado,
 * administrador del sistema. La asignación de sector emisor se maneja
 * aparte, en /api/catalogos/tipos-contrato/asignacion (se edita desde la
 * Biblioteca de sectores, no desde acá).
 */
export async function POST(req: NextRequest) {
  const sesion = await requerirAdmin();
  if (esRespuestaError(sesion)) return sesion;

  const body = (await req.json()) as { nombre?: string };
  if (!body.nombre?.trim()) {
    return NextResponse.json({ error: "El nombre del tipo de contrato es obligatorio." }, { status: 400 });
  }

  const tipo = await crearTipoContrato(body.nombre.trim());
  return NextResponse.json(tipo, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const sesion = await requerirAdmin();
  if (esRespuestaError(sesion)) return sesion;

  const body = (await req.json()) as { original?: string; nuevo?: string };
  if (!body.original || !body.nuevo?.trim()) {
    return NextResponse.json({ error: "Faltan datos para renombrar el tipo de contrato." }, { status: 400 });
  }

  const actualizado = await renombrarTipoContrato(body.original, body.nuevo.trim());
  if (!actualizado) return NextResponse.json({ error: "Tipo de contrato no encontrado." }, { status: 404 });
  return NextResponse.json(actualizado);
}
