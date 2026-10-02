import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirAccionAlquileres } from "@/lib/alquileres/auth-guard";
import { MATRIZ_COMUNICACIONES } from "@/lib/alquileres/permisos";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioComunicaciones } from "@/lib/alquileres/datos/comunicaciones";
import { getRepositorioAreas } from "@/lib/alquileres/datos/areas";
import { getRepositorioContactosEpe } from "@/lib/alquileres/datos/contactos-epe";
import { armarDestinatarios, validarMarcarComoEnviado } from "@/lib/alquileres/reglas/comunicaciones";
import { cumplirHitoYRecalcularEstado } from "@/lib/alquileres/servicios/cumplir-hito-servicio";
import { esConflictoVersionError } from "@/lib/alquileres/repositorio/tipos-repositorio";
import { hoy, ahoraIso } from "@/lib/alquileres/fechas";
import type { TipoComunicacion } from "@/lib/alquileres/tipos";

/** RF-16 (parcial): comunicaciones de una actuación puntual. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await requerirAccionAlquileres("leer", MATRIZ_COMUNICACIONES);
  if (esRespuestaError(sesion)) return sesion;

  const { id } = await params;
  const todas = await getRepositorioComunicaciones().listar();
  return NextResponse.json(todas.filter((c) => c.actuacionId === id));
}

const HITO_POR_TIPO: Record<TipoComunicacion, string> = {
  AVISO: "H-01",
  REITERACION: "H-03",
  CARTA_DOCUMENTO: "H-04",
};

const ASUNTO_POR_TIPO: Record<TipoComunicacion, string> = {
  AVISO: "Aviso de vencimiento de contrato",
  REITERACION: "Reiteración — aviso de vencimiento de contrato",
  CARTA_DOCUMENTO: "Carta documento",
};

/**
 * RF-22/RF-23/RF-24 [CAMBIO en v2.1] — Preparar un borrador de AVISO o
 * REITERACION (con destinatarios armados desde CONTACTOS_EPE vigentes del
 * área, RF-22) o registrar directamente una CARTA_DOCUMENTO (RF-24: "no se
 * envía desde la app: se registra el número en observaciones y se cumple
 * el hito" — sin paso de BORRADOR/ENVIADO, se registra ya cumplida).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await requerirAccionAlquileres("crear", MATRIZ_COMUNICACIONES);
  if (esRespuestaError(sesion)) return sesion;

  const { id } = await params;
  const body = (await req.json()) as {
    tipoComunicacion?: TipoComunicacion;
    numeroCartaDocumento?: string;
    fechaRegistro?: string;
  };

  if (!body.tipoComunicacion || !(body.tipoComunicacion in HITO_POR_TIPO)) {
    return NextResponse.json({ error: "tipoComunicacion debe ser AVISO, REITERACION o CARTA_DOCUMENTO." }, { status: 400 });
  }

  const actuacion = await getRepositorioActuaciones().obtener(id);
  if (!actuacion) {
    return NextResponse.json({ error: "Actuación no encontrada." }, { status: 404 });
  }

  const hitoId = HITO_POR_TIPO[body.tipoComunicacion];

  if (body.tipoComunicacion === "CARTA_DOCUMENTO") {
    // RF-24: no pasa por BORRADOR/ENVIADO — se registra el número y se cumple H-04 directamente.
    if (!body.numeroCartaDocumento?.trim()) {
      return NextResponse.json({ error: "El número de la carta documento es obligatorio." }, { status: 400 });
    }
    const validacionFecha = validarMarcarComoEnviado(body.fechaRegistro, hoy());
    if (!validacionFecha.valida) {
      return NextResponse.json({ error: validacionFecha.error }, { status: 400 });
    }
    const fechaRegistro = body.fechaRegistro!;

    try {
      const comunicacion = await getRepositorioComunicaciones().crear(
        {
          actuacionId: id,
          hitoId,
          tipoComunicacion: "CARTA_DOCUMENTO",
          asunto: ASUNTO_POR_TIPO.CARTA_DOCUMENTO,
          destinatarios: "",
          cuerpo: "",
          estadoComunicacion: "ENVIADO",
          fechaEnvio: fechaRegistro,
          envioDeclaradoPor: sesion.email,
          envioDeclaradoEn: ahoraIso(),
          observaciones: body.numeroCartaDocumento.trim(),
        },
        sesion.email
      );

      const resultado = await cumplirHitoYRecalcularEstado({
        actuacion,
        hitoId,
        fechaCumplimiento: fechaRegistro,
        referencia: comunicacion.comunicacionId,
        emailUsuario: sesion.email,
      });

      if (!resultado.ok) {
        return NextResponse.json({ error: resultado.error }, { status: 400 });
      }

      return NextResponse.json({ comunicacion, hitos: resultado.hitos, actuacion: resultado.actuacion }, { status: 201 });
    } catch (err) {
      if (esConflictoVersionError(err)) return NextResponse.json({ error: err.message }, { status: 409 });
      throw err;
    }
  }

  // AVISO / REITERACION (RF-22/RF-23): borrador con destinatarios armados desde CONTACTOS_EPE vigentes.
  const area = await getRepositorioAreas().obtener(actuacion.sectorInteresadoAreaId);
  if (!area) {
    return NextResponse.json(
      { error: "El área del sector interesado de la actuación no existe — no se puede armar el aviso (RF-22)." },
      { status: 400 }
    );
  }

  const todosLosContactos = await getRepositorioContactosEpe().listar();
  const contactosDelArea = todosLosContactos.filter((c) => c.areaId === area.areaId);
  const destinatarios = armarDestinatarios(area, contactosDelArea, hoy());

  if (destinatarios.length === 0) {
    return NextResponse.json(
      { error: "No hay contactos EPE vigentes para el área de esta actuación — cargar contactos antes de preparar el aviso." },
      { status: 400 }
    );
  }

  const comunicacion = await getRepositorioComunicaciones().crear(
    {
      actuacionId: id,
      hitoId,
      tipoComunicacion: body.tipoComunicacion,
      asunto: `${ASUNTO_POR_TIPO[body.tipoComunicacion]} — ${actuacion.actuacionId}`,
      destinatarios: destinatarios.join("; "),
      cuerpo: `Se informa que la actuación ${actuacion.actuacionId} (inmueble ${actuacion.inmuebleId}) requiere atención. Este cuerpo es un borrador editable antes de enviar.`,
      estadoComunicacion: "BORRADOR",
    },
    sesion.email
  );

  return NextResponse.json(comunicacion, { status: 201 });
}

/** RF-23/RF-24 [CAMBIO] + M16 — "Marcar como enviado": cumple el hito asociado (H-01 o H-03) recién con esto. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await requerirAccionAlquileres("editar", MATRIZ_COMUNICACIONES);
  if (esRespuestaError(sesion)) return sesion;

  const { id } = await params;
  const body = (await req.json()) as { comunicacionId?: string; fechaEnvio?: string; version?: number };

  if (!body.comunicacionId) {
    return NextResponse.json({ error: "comunicacionId es obligatorio." }, { status: 400 });
  }
  if (body.version === undefined) {
    return NextResponse.json({ error: "version es obligatoria (control de concurrencia, T20)." }, { status: 400 });
  }

  const comunicacion = await getRepositorioComunicaciones().obtener(body.comunicacionId);
  if (!comunicacion || comunicacion.actuacionId !== id) {
    return NextResponse.json({ error: "Comunicación no encontrada." }, { status: 404 });
  }
  if (comunicacion.estadoComunicacion === "ENVIADO") {
    return NextResponse.json({ error: "Esta comunicación ya fue marcada como enviada." }, { status: 400 });
  }

  const validacion = validarMarcarComoEnviado(body.fechaEnvio, hoy());
  if (!validacion.valida) {
    return NextResponse.json({ error: validacion.error }, { status: 400 });
  }
  const fechaEnvio = body.fechaEnvio!;

  const actuacion = await getRepositorioActuaciones().obtener(id);
  if (!actuacion) {
    return NextResponse.json({ error: "Actuación no encontrada." }, { status: 404 });
  }

  try {
    const comunicacionActualizada = await getRepositorioComunicaciones().actualizar(
      comunicacion.comunicacionId,
      { estadoComunicacion: "ENVIADO", fechaEnvio, envioDeclaradoPor: sesion.email, envioDeclaradoEn: ahoraIso() },
      body.version,
      sesion.email
    );

    const resultado = comunicacion.hitoId
      ? await cumplirHitoYRecalcularEstado({
          actuacion,
          hitoId: comunicacion.hitoId,
          fechaCumplimiento: fechaEnvio,
          referencia: comunicacion.comunicacionId,
          emailUsuario: sesion.email,
        })
      : { ok: true as const, hitos: [], actuacion };

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: 400 });
    }

    return NextResponse.json({ comunicacion: comunicacionActualizada, hitos: resultado.hitos, actuacion: resultado.actuacion });
  } catch (err) {
    if (esConflictoVersionError(err)) return NextResponse.json({ error: err.message }, { status: 409 });
    throw err;
  }
}
