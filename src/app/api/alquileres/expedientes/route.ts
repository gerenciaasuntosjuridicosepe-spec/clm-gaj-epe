import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirAccionAlquileres } from "@/lib/alquileres/auth-guard";
import { MATRIZ_GESTION } from "@/lib/alquileres/permisos";
import { getRepositorioExpedientes } from "@/lib/alquileres/datos/expedientes";
import { getRepositorioInmuebles } from "@/lib/alquileres/datos/inmuebles";
import { validarNroExpediente } from "@/lib/alquileres/reglas/validaciones";
import type { Expediente } from "@/lib/alquileres/tipos";

/** RF-07/RF-08: alta y edición de expedientes, con los dos formatos de numeración (T11) y vínculo R2 (mismo inmueble). */
export async function GET() {
  const sesion = await requerirAccionAlquileres("leer", MATRIZ_GESTION);
  if (esRespuestaError(sesion)) return sesion;

  const expedientes = await getRepositorioExpedientes().listar();
  return NextResponse.json(expedientes);
}

export async function POST(req: NextRequest) {
  const sesion = await requerirAccionAlquileres("crear", MATRIZ_GESTION);
  if (esRespuestaError(sesion)) return sesion;

  const body = (await req.json()) as Partial<Expediente>;

  if (!body.inmuebleId?.trim()) {
    return NextResponse.json({ error: "El inmueble es obligatorio." }, { status: 400 });
  }
  if (!body.nroExpediente?.trim()) {
    return NextResponse.json({ error: "El número de expediente es obligatorio." }, { status: 400 });
  }
  if (!validarNroExpediente(body.nroExpediente.trim())) {
    return NextResponse.json(
      { error: "Formato de número de expediente inválido (1-AAAA-N o EE-AAAA-NNNNNNNN-APPSF-OD)." },
      { status: 400 }
    );
  }

  // RF-07: único entre expedientes activos.
  // TODO(revisión adversarial, Fase 1): misma ventana de carrera leer-antes-
  // de-escribir que en src/app/api/alquileres/inmuebles/route.ts (ver el
  // comentario ahí) — dos altas casi simultáneas con el mismo número
  // podrían pasar las dos esta validación. Aceptado por ahora a la escala
  // de GAJ (≤15 usuarios); no se resuelve en Fase 1.
  const existentes = await getRepositorioExpedientes().listar();
  if (existentes.some((e) => e.nroExpediente === body.nroExpediente)) {
    return NextResponse.json({ error: "Ya existe un expediente activo con ese número." }, { status: 409 });
  }

  // R2: el inmueble indicado debe existir (la validación de que una ACTUACION
  // vinculada sea del mismo inmueble ocurre al vincular la actuación, no acá).
  const inmueble = await getRepositorioInmuebles().obtener(body.inmuebleId.trim());
  if (!inmueble) {
    return NextResponse.json({ error: "El inmueble indicado no existe." }, { status: 400 });
  }

  const creado = await getRepositorioExpedientes().crear(
    {
      inmuebleId: body.inmuebleId.trim(),
      nroExpediente: body.nroExpediente.trim(),
      fechaApertura: body.fechaApertura,
      observaciones: body.observaciones?.trim(),
    },
    sesion.email
  );

  return NextResponse.json(creado, { status: 201 });
}
