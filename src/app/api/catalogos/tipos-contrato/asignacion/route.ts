import { NextRequest, NextResponse } from "next/server";
import { requerirAdmin, esRespuestaError } from "@/lib/auth-guard";
import { actualizarSectorDeTipoContrato } from "@/lib/data/catalogos-provider";

/** Asignación de sector/Directorio emisor por tipo de contrato (PRD 4.3) — se edita desde la Biblioteca de sectores. */
export async function PATCH(req: NextRequest) {
  const sesion = await requerirAdmin();
  if (esRespuestaError(sesion)) return sesion;

  const body = (await req.json()) as { nombre?: string; sectorAsignadoId?: string | null };
  if (!body.nombre) {
    return NextResponse.json({ error: "Falta el tipo de contrato a actualizar." }, { status: 400 });
  }

  const actualizado = await actualizarSectorDeTipoContrato(body.nombre, body.sectorAsignadoId ?? null);
  if (!actualizado) return NextResponse.json({ error: "Tipo de contrato no encontrado." }, { status: 404 });
  return NextResponse.json(actualizado);
}
