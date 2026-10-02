import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirAccionAlquileres } from "@/lib/alquileres/auth-guard";
import { MATRIZ_GESTION } from "@/lib/alquileres/permisos";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioActosAdmin } from "@/lib/alquileres/datos/actos-admin";
import { fechaFinPorDefecto, validarFechaFinManual } from "@/lib/alquileres/reglas/r5-fecha-fin";
import { validarObligatoriosFormalizacion } from "@/lib/alquileres/reglas/r4-obligatorios-formalizada";
import { esConflictoVersionError } from "@/lib/alquileres/repositorio/tipos-repositorio";
import type { Actuacion } from "@/lib/alquileres/tipos";

/** RF-16 (ficha de la actuación): detalle de una actuación puntual. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await requerirAccionAlquileres("leer", MATRIZ_GESTION);
  if (esRespuestaError(sesion)) return sesion;

  const { id } = await params;
  const actuacion = await getRepositorioActuaciones().obtener(id);
  if (!actuacion) return NextResponse.json({ error: "Actuación no encontrada." }, { status: 404 });
  return NextResponse.json(actuacion);
}

type CuerpoFormalizacion = Partial<
  Pick<
    Actuacion,
    | "fechaInicio"
    | "plazoMeses"
    | "fechaFin"
    | "canonInicial"
    | "montoTotalReconocido"
    | "condicionIvaCanon"
    | "destinoCategoria"
    | "destinoDescripcion"
    | "reglaActualizacion"
    | "firmanteEpeContactoId"
    | "observaciones"
    | "estadoActuacion"
  >
> & { version?: number; motivoCambioFecha?: string };

/**
 * RF-12 (parcial) — formalización guiada: carga de los datos que exige
 * R4' para poder pasar a FORMALIZADA (fecha_inicio, plazo, fecha_fin,
 * canon, condición de IVA, destino, firmante). Esta ruta solo EDITA esos
 * campos; el pasaje real a FORMALIZADA ocurre al cumplir H-15 (R14, ya
 * implementado en `[id]/hitos/route.ts`) — acá no se fuerza el estado.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await requerirAccionAlquileres("editar", MATRIZ_GESTION);
  if (esRespuestaError(sesion)) return sesion;

  const { id } = await params;
  const body = (await req.json()) as CuerpoFormalizacion;

  if (body.version === undefined) {
    return NextResponse.json({ error: "version es obligatoria (control de concurrencia, T20)." }, { status: 400 });
  }

  const actuacion = await getRepositorioActuaciones().obtener(id);
  if (!actuacion) return NextResponse.json({ error: "Actuación no encontrada." }, { status: 404 });

  const fechaInicioFinal = body.fechaInicio ?? actuacion.fechaInicio;
  const plazoMesesFinal = body.plazoMeses ?? actuacion.plazoMeses;

  const cambios: Partial<Actuacion> = { ...body };
  delete (cambios as { version?: number }).version;
  delete (cambios as { motivoCambioFecha?: string }).motivoCambioFecha;

  // R5: fecha_fin por defecto = inicio + plazo - 1 día; si se informa una fecha distinta, exige motivo.
  if (fechaInicioFinal && plazoMesesFinal) {
    if (body.fechaFin) {
      const validacion = validarFechaFinManual(fechaInicioFinal, plazoMesesFinal, body.fechaFin, body.motivoCambioFecha);
      if (!validacion.valida) {
        return NextResponse.json({ error: validacion.error }, { status: 400 });
      }
    } else if (body.fechaInicio || body.plazoMeses) {
      // Se informó inicio y/o plazo pero no fecha_fin: se propone el valor por defecto (R5).
      cambios.fechaFin = fechaFinPorDefecto(fechaInicioFinal, plazoMesesFinal);
    }
  }

  // RF-29/R4' — ADENDA y LEGITIMO_ABONO no tienen hitos (R14): pasan a FORMALIZADA por edición directa del
  // estado, no por cumplir H-15 (eso es solo para CONTRATO, ver `[id]/hitos/route.ts`). Un LEGITIMO_ABONO
  // además necesita al menos un acto administrativo (RF-29) — sin eso, R4' lo rechaza.
  if (body.estadoActuacion === "FORMALIZADA") {
    if (actuacion.tipoActuacion === "CONTRATO") {
      return NextResponse.json(
        { error: "Un CONTRATO pasa a FORMALIZADA al cumplir el hito H-15, no editando el estado directamente." },
        { status: 400 }
      );
    }

    const actuacionConCambios: Actuacion = { ...actuacion, ...cambios };
    let tieneActoAdministrativo = false;
    if (actuacion.tipoActuacion === "LEGITIMO_ABONO") {
      const actos = await getRepositorioActosAdmin().listar();
      tieneActoAdministrativo = actos.some((a) => a.actuacionId === id);
    }

    const validacion = validarObligatoriosFormalizacion(actuacionConCambios, tieneActoAdministrativo);
    if (!validacion.valida) {
      return NextResponse.json(
        { error: `No se puede formalizar — falta: ${validacion.camposFaltantes.join(", ")}.` },
        { status: 400 }
      );
    }
  }

  try {
    const actualizada = await getRepositorioActuaciones().actualizar(id, cambios, body.version, sesion.email);
    return NextResponse.json(actualizada);
  } catch (err) {
    if (esConflictoVersionError(err)) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
