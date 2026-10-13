import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirAccionAlquileres, requerirAccionSobreActuacion } from "@/lib/alquileres/auth-guard";
import { MATRIZ_GESTION } from "@/lib/alquileres/permisos";
import { getRepositorioActuacionHitos } from "@/lib/alquileres/datos/actuacion-hitos";
import { getRepositorioNovedades } from "@/lib/alquileres/datos/novedades";

/** Novedades de una actuación puntual (agregado 2026-10-13, ver tipos.ts). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await requerirAccionAlquileres("leer", MATRIZ_GESTION);
  if (esRespuestaError(sesion)) return sesion;

  const { id } = await params;
  const todas = await getRepositorioNovedades().listar();
  return NextResponse.json(todas.filter((n) => n.actuacionId === id));
}

/** Carga una novedad de texto libre sobre la etapa actual de la actuación (y, si corresponde, sobre un hito puntual de esa etapa). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resultado = await requerirAccionSobreActuacion("crear", MATRIZ_GESTION, id);
  if (esRespuestaError(resultado)) return resultado;
  const { sesion, actuacion } = resultado;

  const body = (await req.json()) as { texto?: string; hitoId?: string };

  if (!body.texto?.trim()) {
    return NextResponse.json({ error: "El texto de la novedad es obligatorio." }, { status: 400 });
  }

  if (body.hitoId) {
    const hitosDeLaActuacion = (await getRepositorioActuacionHitos().listar()).filter((h) => h.actuacionId === id);
    if (!hitosDeLaActuacion.some((h) => h.hitoId === body.hitoId)) {
      return NextResponse.json({ error: `El hito ${body.hitoId} no corresponde a esta actuación.` }, { status: 400 });
    }
  }

  const novedad = await getRepositorioNovedades().crear(
    {
      actuacionId: id,
      estadoActuacion: actuacion.estadoActuacion,
      hitoId: body.hitoId,
      texto: body.texto.trim(),
    },
    sesion.email
  );

  return NextResponse.json(novedad, { status: 201 });
}
