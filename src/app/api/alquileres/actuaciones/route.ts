import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirAccionAlquileres } from "@/lib/alquileres/auth-guard";
import { MATRIZ_GESTION } from "@/lib/alquileres/permisos";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioInmuebles } from "@/lib/alquileres/datos/inmuebles";
import { getRepositorioActuacionHitos } from "@/lib/alquileres/datos/actuacion-hitos";
import { validarCadenaActuacion } from "@/lib/alquileres/reglas/r3-cadena-actuaciones";
import { generarHitosParaActuacion } from "@/lib/alquileres/reglas/rf19-generar-hitos";
import { CFG_HITOS_TIPO_SEED } from "@/lib/alquileres/catalogos/hitos-seed";
import type { Actuacion } from "@/lib/alquileres/tipos";

/**
 * RF-11 — alta rápida de una actuación con pocos datos (tipo, inmueble,
 * sector, estado); el resto se exige más adelante, al formalizar (R4',
 * RF-12 — todavía no implementado, queda para cuando se construya el
 * flujo de formalización guiada junto con hitos/dashboard en Fase 2).
 */
export async function GET() {
  const sesion = await requerirAccionAlquileres("leer", MATRIZ_GESTION);
  if (esRespuestaError(sesion)) return sesion;

  const actuaciones = await getRepositorioActuaciones().listar();
  return NextResponse.json(actuaciones);
}

export async function POST(req: NextRequest) {
  const sesion = await requerirAccionAlquileres("crear", MATRIZ_GESTION);
  if (esRespuestaError(sesion)) return sesion;

  const body = (await req.json()) as Partial<Actuacion>;

  if (!body.tipoActuacion) {
    return NextResponse.json({ error: "El tipo de actuación es obligatorio." }, { status: 400 });
  }
  if (!body.inmuebleId?.trim()) {
    return NextResponse.json({ error: "El inmueble es obligatorio." }, { status: 400 });
  }
  if (!body.sectorInteresadoAreaId?.trim()) {
    return NextResponse.json({ error: "El sector interesado es obligatorio (define destinatarios del aviso)." }, { status: 400 });
  }

  const inmueble = await getRepositorioInmuebles().obtener(body.inmuebleId.trim());
  if (!inmueble) {
    return NextResponse.json({ error: "El inmueble indicado no existe." }, { status: 400 });
  }

  const todas = await getRepositorioActuaciones().listar({ soloActivos: false });

  // R3': SIEMPRE se valida la cadena, no solo cuando se informa actuacion_anterior_id —
  // ADENDA y LEGITIMO_ABONO lo EXIGEN (validarCadenaActuacion rechaza si falta), así que
  // validar solo "cuando viene informado" dejaría pasar una ADENDA sin anterior.
  const simulada = {
    actuacionId: "(nueva)",
    tipoActuacion: body.tipoActuacion,
    inmuebleId: body.inmuebleId.trim(),
    actuacionAnteriorId: body.actuacionAnteriorId?.trim() || undefined,
  } as Actuacion;
  const validacionCadena = validarCadenaActuacion(simulada, [...todas, simulada]);
  if (!validacionCadena.valida) {
    return NextResponse.json({ error: validacionCadena.error }, { status: 400 });
  }

  // RF-11: se crea siempre como PENDIENTE_AVISO para CONTRATO (R14); ADENDA/LEGITIMO_ABONO arrancan EN_TRAMITE (sin hitos).
  const estadoInicial = body.tipoActuacion === "CONTRATO" ? "PENDIENTE_AVISO" : "EN_TRAMITE";

  const creada = await getRepositorioActuaciones().crear(
    {
      tipoActuacion: body.tipoActuacion,
      inmuebleId: body.inmuebleId.trim(),
      expedienteId: body.expedienteId?.trim(),
      actuacionAnteriorId: body.actuacionAnteriorId?.trim(),
      sectorInteresadoAreaId: body.sectorInteresadoAreaId.trim(),
      estadoActuacion: estadoInicial,
    },
    sesion.email
  );

  // RF-19: generación automática de hitos al crear un CONTRATO (R14: ADENDA/
  // LEGITIMO_ABONO no generan ninguno — generarHitosParaActuacion ya los
  // filtra). Config activa: CFG_HITOS_TIPO_SEED (todavía no hay una pantalla
  // de Administración que la haga editable en runtime, RF-34 queda para
  // Fase 4 — usar el seed ya es "una sola fuente de verdad", solo que
  // estática por ahora). Feriados: lista vacía (no hay RF-36/pantalla de
  // carga todavía) — R13 ya contempla ese caso con el cómputo aproximado,
  // no es un valor inventado, es el comportamiento documentado del PRD.
  const hitosAGenerar = generarHitosParaActuacion({
    actuacion: creada,
    todasLasActuaciones: [...todas, creada],
    cfgHitosTipo: CFG_HITOS_TIPO_SEED,
    feriados: [],
  });
  for (const hito of hitosAGenerar) {
    await getRepositorioActuacionHitos().crear(
      {
        actuacionId: creada.actuacionId,
        hitoId: hito.hitoId,
        estadoHito: hito.estadoHito,
        fechaPrevista: hito.fechaPrevista,
        reprogramada: hito.reprogramada,
      },
      sesion.email
    );
  }

  return NextResponse.json(creada, { status: 201 });
}
