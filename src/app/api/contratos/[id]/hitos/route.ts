import { NextRequest, NextResponse } from "next/server";
import { getContratosProvider } from "@/lib/data/provider";
import { HitoContractual } from "@/lib/types";
import { requerirSesion, requerirAccesoEscritura, esRespuestaError } from "@/lib/auth-guard";

/** Hitos contractuales — se dan de alta en la etapa de Encuadre legal (PRD sección 6.3, adaptado). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sesion = await requerirSesion();
  if (esRespuestaError(sesion)) return sesion;

  const { error } = await requerirAccesoEscritura(id, sesion);
  if (error) return error;

  const body = (await req.json()) as Partial<HitoContractual>;

  if (!body.tipo || !body.fecha) {
    return NextResponse.json({ error: "Faltan campos: tipo y fecha son obligatorios." }, { status: 400 });
  }
  if (body.tipo === "pago" && !body.monto) {
    return NextResponse.json({ error: "Un hito de pago necesita un monto." }, { status: 400 });
  }

  const hito: HitoContractual = {
    tipo: body.tipo,
    fecha: body.fecha,
    descripcion: body.descripcion,
    monto: body.monto,
  };

  const actualizado = await getContratosProvider().agregarHito(id, hito);
  if (!actualizado) return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
  return NextResponse.json(actualizado, { status: 201 });
}
