import { NextRequest, NextResponse } from "next/server";
import { getContratosProvider, listarVisibles } from "@/lib/data/provider";
import { Contrato } from "@/lib/types";
import { requerirSesion, esRespuestaError } from "@/lib/auth-guard";
import { puedeVerContrato } from "@/lib/permisos";

/**
 * Route Handler para contratos. Es el único lugar donde el navegador puede
 * disparar una escritura hacia el provider (mock o Google Sheets): el
 * cliente de Sheets (`googleapis`) no puede correr en el navegador, así que
 * cualquier componente `"use client"` que necesite crear/actualizar un
 * contrato tiene que pasar por acá vía `fetch`, nunca importar el provider
 * directamente.
 */
export async function GET() {
  // F0-1 (hallazgo crítico): antes este handler no exigía sesión y
  // devolvía TODOS los contratos sin filtrar por rol — una petición
  // anónima a /api/contratos exponía datos completos (incluidos datos
  // personales de contraparte). Ahora exige sesión y filtra con el mismo
  // criterio que usan las páginas de servidor (`listarVisibles`), para que
  // ningún llamador (humano o script) reciba más de lo que su rol permite,
  // sea cual sea el canal por el que entre.
  const sesion = await requerirSesion();
  if (esRespuestaError(sesion)) return sesion;

  const contratos = await listarVisibles(sesion.rolId);
  return NextResponse.json(contratos);
}

export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (esRespuestaError(sesion)) return sesion;

  // No hay todavía un contrato contra el cual chequear etapa (se está
  // creando), así que el gate acá es más simple: el rol tiene que tener
  // algún acceso a la etapa "solicitud" (R para área solicitante, V como
  // mínimo para los roles con visibilidad total).
  if (!puedeVerContrato(sesion.rolId, "solicitud")) {
    return NextResponse.json({ error: "Tu rol no puede iniciar solicitudes." }, { status: 403 });
  }

  const body = (await req.json()) as Partial<Contrato>;

  if (!body.objeto || !body.contraparteRazonSocial || !body.documento || !body.tipoContrato || !body.areaSolicitante) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios del formulario de intake (PRD sección 4.2)." },
      { status: 400 }
    );
  }

  const nuevo: Contrato = {
    id: body.id ?? generarIdExpediente(),
    areaSolicitante: body.areaSolicitante,
    documento: body.documento,
    tipoContrato: body.tipoContrato,
    objeto: body.objeto,
    contraparteRazonSocial: body.contraparteRazonSocial,
    contraparteIdentificacion: body.contraparteIdentificacion ?? "",
    estadoAprobacionSolicitud: "Pendiente",
    respaldoEnExpediente: false,
    etapaActual: "solicitud",
    estadoContrato: "Vigente",
    gerenciaResponsable: body.areaSolicitante,
    hitos: [],
    clausulaProrroga: false,
    clausulaRescision: false,
    clausulaPenalidad: false,
    garantiasExigidas: [],
    anotacionesSeguimiento: [],
    historial: [
      {
        fecha: new Date().toISOString(),
        // Antes venía hardcodeado ("Usuario actual" / rol fijo) — ahora sale
        // siempre de la sesión del servidor, nunca de lo que mande el cliente.
        usuario: sesion.nombre,
        rol: sesion.rolId,
        descripcion: "Solicitud creada — PDF de requerimiento generado.",
      },
    ],
  };

  const creado = await getContratosProvider().crear(nuevo);
  return NextResponse.json(creado, { status: 201 });
}

function generarIdExpediente(): string {
  const año = new Date().getFullYear();
  const correlativo = Math.floor(1000 + Math.random() * 9000);
  return `EXP-${año}-${correlativo}`;
}
