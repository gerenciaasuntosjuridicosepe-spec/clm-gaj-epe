import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirAccionAlquileres } from "@/lib/alquileres/auth-guard";
import { MATRIZ_HITOS } from "@/lib/alquileres/permisos";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioActuacionHitos } from "@/lib/alquileres/datos/actuacion-hitos";
import { marcarHitoCumplido } from "@/lib/alquileres/reglas/rf20-cumplir-hito";
import { marcarHitoNoAplica, reprogramarHito } from "@/lib/alquileres/reglas/rf21-reprogramar-hito";
import { calcularEstadoDerivado, esEstadoManual } from "@/lib/alquileres/reglas/r14-estado-derivado";
import { validarObligatoriosFormalizacion } from "@/lib/alquileres/reglas/r4-obligatorios-formalizada";
import { CFG_HITOS_TIPO_SEED } from "@/lib/alquileres/catalogos/hitos-seed";
import { hoy } from "@/lib/alquileres/fechas";

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
  const cfgDelTipo = CFG_HITOS_TIPO_SEED.filter((c) => c.tipoActuacion === actuacion.tipoActuacion);

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
  }

  // accion === "cumplir" (RF-20)
  if (!body.fechaCumplimiento) {
    return NextResponse.json({ error: "fechaCumplimiento es obligatoria para cumplir un hito." }, { status: 400 });
  }

  const resultado = marcarHitoCumplido({
    hitos: hitosDeLaActuacion,
    hitoId: body.hitoId,
    fechaCumplimiento: body.fechaCumplimiento,
    referencia: body.referencia,
    cfgHitosTipo: cfgDelTipo,
    feriados: [], // ídem RF-19: sin RF-36/pantalla de feriados todavía — R13 ya contempla este caso (cómputo aproximado).
    hoy: hoy(),
  });

  if (!resultado.valido) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  // Persiste cada hito que cambió (el cumplido + los recalculados), con control de versión (T20).
  const hitosActualizadosCompletos = [];
  for (const cambios of resultado.hitosActualizados) {
    const actual = hitosDeLaActuacion.find((h) => h.hitoId === cambios.hitoId)!;
    const actualizado = await getRepositorioActuacionHitos().actualizar(
      actual.actuacionHitoId,
      { estadoHito: cambios.estadoHito, fechaPrevista: cambios.fechaPrevista, fechaCumplimiento: cambios.fechaCumplimiento, referencia: cambios.referencia },
      actual.version,
      sesion.email
    );
    hitosActualizadosCompletos.push(actualizado);
  }

  // R14: recalcula el estado de la actuación según el nuevo estado de sus hitos — salvo que esté en un estado manual (DESISTIDA/NO_RENOVADO/ANULADA), que solo un ADMINISTRADOR reabre (no acá).
  let actuacionActualizada = actuacion;
  if (actuacion.tipoActuacion === "CONTRATO" && !esEstadoManual(actuacion.estadoActuacion)) {
    const hitosFinal = todosLosHitos
      .filter((h) => h.actuacionId === id)
      .map((h) => resultado.hitosActualizados.find((u) => u.hitoId === h.hitoId) ?? h);
    const cumplido = (hitoId: string) => hitosFinal.find((h) => h.hitoId === hitoId)?.estadoHito === "CUMPLIDO";
    const { valida: puedeFormalizar } = validarObligatoriosFormalizacion(actuacion);

    const nuevoEstado = calcularEstadoDerivado({
      tieneExpedienteAsignado: Boolean(actuacion.expedienteId),
      h01Cumplido: cumplido("H-01"),
      h05Cumplido: cumplido("H-05"),
      h15Cumplido: cumplido("H-15"),
      h20Cumplido: cumplido("H-20"),
      puedeFormalizar,
    });

    if (nuevoEstado !== actuacion.estadoActuacion) {
      actuacionActualizada = await getRepositorioActuaciones().actualizar(
        id,
        { estadoActuacion: nuevoEstado },
        actuacion.version,
        sesion.email
      );
    }
  }

  return NextResponse.json({ hitos: hitosActualizadosCompletos, actuacion: actuacionActualizada });
}
