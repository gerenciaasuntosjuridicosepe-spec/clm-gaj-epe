import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirAccionAlquileres } from "@/lib/alquileres/auth-guard";
import { MATRIZ_HITOS } from "@/lib/alquileres/permisos";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioActuacionHitos } from "@/lib/alquileres/datos/actuacion-hitos";
import { marcarHitoNoAplica, reprogramarHito } from "@/lib/alquileres/reglas/rf21-reprogramar-hito";
import { cumplirHitoYRecalcularEstado } from "@/lib/alquileres/servicios/cumplir-hito-servicio";
import { esConflictoVersionError } from "@/lib/alquileres/repositorio/tipos-repositorio";

type AccionHito = "cumplir" | "reprogramar" | "no_aplica";

/** RF-16 (parcial): hitos de una actuación puntual. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await requerirAccionAlquileres("leer", MATRIZ_HITOS);
  if (esRespuestaError(sesion)) return sesion;

  const { id } = await params;
  const todos = await getRepositorioActuacionHitos().listar();
  const hitos = todos.filter((h) => h.actuacionId === id);
  return NextResponse.json(hitos);
}

/**
 * RF-20/RF-21 — Registrar el cumplimiento de un hito (acción "cumplir",
 * default), reprogramarlo (acción "reprogramar", exige motivo y nueva
 * fecha prevista — R13: a partir de ahí no se recalcula solo) o marcarlo
 * NO_APLICA (acción "no_aplica", exige motivo).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await requerirAccionAlquileres("editar", MATRIZ_HITOS);
  if (esRespuestaError(sesion)) return sesion;

  const { id } = await params;
  const body = (await req.json()) as {
    hitoId?: string;
    fechaCumplimiento?: string;
    referencia?: string;
    accion?: AccionHito;
    nuevaFechaPrevista?: string;
    motivo?: string;
  };

  if (!body.hitoId) {
    return NextResponse.json({ error: "hitoId es obligatorio." }, { status: 400 });
  }

  const actuacion = await getRepositorioActuaciones().obtener(id);
  if (!actuacion) {
    return NextResponse.json({ error: "Actuación no encontrada." }, { status: 404 });
  }

  const todosLosHitos = await getRepositorioActuacionHitos().listar();
  const hitosDeLaActuacion = todosLosHitos.filter((h) => h.actuacionId === id);

  const accion: AccionHito = body.accion ?? "cumplir";

  if (accion === "reprogramar" || accion === "no_aplica") {
    const hitoActual = hitosDeLaActuacion.find((h) => h.hitoId === body.hitoId);
    if (!hitoActual) {
      return NextResponse.json({ error: `No existe el hito ${body.hitoId} en esta actuación.` }, { status: 404 });
    }

    const resultadoAccion =
      accion === "reprogramar"
        ? reprogramarHito(hitoActual, body.nuevaFechaPrevista ?? "", body.motivo ?? "")
        : marcarHitoNoAplica(hitoActual, body.motivo ?? "");

    if (!resultadoAccion.valido || !resultadoAccion.hitoActualizado) {
      return NextResponse.json({ error: resultadoAccion.error }, { status: 400 });
    }

    try {
      const actualizado = await getRepositorioActuacionHitos().actualizar(
        hitoActual.actuacionHitoId,
        {
          estadoHito: resultadoAccion.hitoActualizado.estadoHito,
          fechaPrevista: resultadoAccion.hitoActualizado.fechaPrevista,
          reprogramada: resultadoAccion.hitoActualizado.reprogramada,
          observaciones: resultadoAccion.hitoActualizado.observaciones,
        },
        hitoActual.version,
        sesion.email
      );
      return NextResponse.json({ hitos: [actualizado], actuacion });
    } catch (err) {
      if (esConflictoVersionError(err)) return NextResponse.json({ error: err.message }, { status: 409 });
      throw err;
    }
  }

  // accion === "cumplir" (RF-20)
  if (!body.fechaCumplimiento) {
    return NextResponse.json({ error: "fechaCumplimiento es obligatoria para cumplir un hito." }, { status: 400 });
  }

  try {
    const resultado = await cumplirHitoYRecalcularEstado({
      actuacion,
      hitoId: body.hitoId,
      fechaCumplimiento: body.fechaCumplimiento,
      referencia: body.referencia,
      emailUsuario: sesion.email,
    });

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: 400 });
    }

    return NextResponse.json({ hitos: resultado.hitos, actuacion: resultado.actuacion });
  } catch (err) {
    if (esConflictoVersionError(err)) return NextResponse.json({ error: err.message }, { status: 409 });
    throw err;
  }
}
