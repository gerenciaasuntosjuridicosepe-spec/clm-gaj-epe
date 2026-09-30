import { NextRequest, NextResponse } from "next/server";
import { getContratosProvider } from "@/lib/data/provider";
import { AnotacionSeguimiento } from "@/lib/types";
import { requerirSesion, requerirAccesoEscritura, esRespuestaError } from "@/lib/auth-guard";

/**
 * Anotaciones de seguimiento de un contrato (Redacción/Negociación) —
 * agregado a pedido, no viene del PRD original. Solo agrega, no edita ni
 * borra (igual criterio que el historial de auditoría: es un log).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sesion = await requerirSesion();
  if (esRespuestaError(sesion)) return sesion;

  const { error } = await requerirAccesoEscritura(id, sesion);
  if (error) return error;

  const body = (await req.json()) as Partial<AnotacionSeguimiento>;

  if (!body.tipo || !body.observaciones) {
    return NextResponse.json({ error: "Faltan campos: tipo y observaciones son obligatorios." }, { status: 400 });
  }

  const anotacion: AnotacionSeguimiento = {
    fecha: body.fecha ?? new Date().toISOString(),
    tipo: body.tipo,
    observaciones: body.observaciones,
    // Antes se aceptaba el campo `usuario` del body (cualquiera podía
    // firmar la anotación con el nombre que quisiera) — ahora sale siempre
    // de la sesión del servidor.
    usuario: sesion.nombre,
  };

  const actualizado = await getContratosProvider().agregarAnotacion(id, anotacion);
  if (!actualizado) return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
  return NextResponse.json(actualizado, { status: 201 });
}
