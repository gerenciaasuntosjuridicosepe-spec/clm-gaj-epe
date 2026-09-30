import { NextRequest, NextResponse } from "next/server";
import { getContratosProvider } from "@/lib/data/provider";
import { Contrato } from "@/lib/types";
import { requerirSesion, requerirAccesoEscritura, esRespuestaError } from "@/lib/auth-guard";

/** Contrato individual: lectura y edición parcial (links, campos de cualquier etapa). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contrato = await getContratosProvider().obtener(id);
  if (!contrato) return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
  return NextResponse.json(contrato);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sesion = await requerirSesion();
  if (esRespuestaError(sesion)) return sesion;

  const { error } = await requerirAccesoEscritura(id, sesion);
  if (error) return error;

  const cambios = (await req.json()) as Partial<Contrato>;
  const actualizado = await getContratosProvider().actualizar(id, cambios);
  if (!actualizado) return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
  return NextResponse.json(actualizado);
}
