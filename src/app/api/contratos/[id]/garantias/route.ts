import { NextRequest, NextResponse } from "next/server";
import { getContratosProvider } from "@/lib/data/provider";
import { GarantiaExigida } from "@/lib/types";
import { requerirSesion, requerirAccesoEscritura, esRespuestaError } from "@/lib/auth-guard";

/**
 * Garantías exigidas de un contrato — se dan de alta en la etapa de
 * Encuadre legal (tipo + descripción, todavía sin fecha de presentación).
 * La fecha se completa después, en Firma, vía PATCH a
 * /api/contratos/[id]/garantias/[garantiaId].
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sesion = await requerirSesion();
  if (esRespuestaError(sesion)) return sesion;

  const { error } = await requerirAccesoEscritura(id, sesion);
  if (error) return error;

  const body = (await req.json()) as Partial<GarantiaExigida>;

  if (!body.tipo || !body.descripcion) {
    return NextResponse.json({ error: "Faltan campos: tipo y descripción son obligatorios." }, { status: 400 });
  }

  const garantia: GarantiaExigida = {
    id: `gar-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: body.tipo,
    descripcion: body.descripcion,
  };

  const actualizado = await getContratosProvider().agregarGarantia(id, garantia);
  if (!actualizado) return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
  return NextResponse.json(actualizado, { status: 201 });
}
