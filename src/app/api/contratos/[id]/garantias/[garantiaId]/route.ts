import { NextRequest, NextResponse } from "next/server";
import { getContratosProvider } from "@/lib/data/provider";
import { GarantiaExigida } from "@/lib/types";
import { requerirSesion, requerirAccesoEscritura, esRespuestaError } from "@/lib/auth-guard";

/** Actualiza una garantía existente — hoy se usa para cargar la fecha de presentación en Firma. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; garantiaId: string }> }) {
  const { id, garantiaId } = await params;
  const sesion = await requerirSesion();
  if (esRespuestaError(sesion)) return sesion;

  const { error } = await requerirAccesoEscritura(id, sesion);
  if (error) return error;

  const cambios = (await req.json()) as Partial<GarantiaExigida>;
  const actualizado = await getContratosProvider().actualizarGarantia(id, garantiaId, cambios);
  if (!actualizado) return NextResponse.json({ error: "Contrato o garantía no encontrados" }, { status: 404 });
  return NextResponse.json(actualizado);
}
