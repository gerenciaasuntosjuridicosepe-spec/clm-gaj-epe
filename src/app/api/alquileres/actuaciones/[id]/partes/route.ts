import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirAccionAlquileres } from "@/lib/alquileres/auth-guard";
import { MATRIZ_PERSONAS } from "@/lib/alquileres/permisos";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioActuacionPartes } from "@/lib/alquileres/datos/actuacion-partes";
import { getRepositorioPersonas } from "@/lib/alquileres/datos/personas";
import type { ActuacionParte } from "@/lib/alquileres/tipos";

/**
 * RF-10 — Partes de una actuación (titulares/locadores, firmantes).
 * Hallazgo de esta tarea (Fase 4): el modelo y el esquema de
 * ACTUACION_PARTES existían desde Fase 1 (`tipos.ts`/`esquema.ts`,
 * R8/R9), pero ninguna ruta de API los exponía — RF-10 quedó sin
 * implementar. Se corrige acá, reutilizando `MATRIZ_PERSONAS` para el
 * permiso (las partes son, en los hechos, datos de las mismas personas
 * que esa matriz protege — mismo criterio de acceso, LECTOR sin acceso en
 * absoluto por ser dato personal).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await requerirAccionAlquileres("leer", MATRIZ_PERSONAS);
  if (esRespuestaError(sesion)) return sesion;

  const { id } = await params;
  const todas = await getRepositorioActuacionPartes().listar();
  return NextResponse.json(todas.filter((p) => p.actuacionId === id));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await requerirAccionAlquileres("crear", MATRIZ_PERSONAS);
  if (esRespuestaError(sesion)) return sesion;

  const { id } = await params;
  const actuacion = await getRepositorioActuaciones().obtener(id);
  if (!actuacion) {
    return NextResponse.json({ error: "Actuación no encontrada." }, { status: 404 });
  }

  const body = (await req.json()) as Partial<ActuacionParte>;

  if (!body.personaId?.trim()) {
    return NextResponse.json({ error: "La persona es obligatoria." }, { status: 400 });
  }
  const persona = await getRepositorioPersonas().obtener(body.personaId);
  if (!persona) {
    return NextResponse.json({ error: "La persona indicada no existe." }, { status: 404 });
  }
  if (body.rolParte !== "TITULAR" && body.rolParte !== "FIRMANTE") {
    return NextResponse.json({ error: "rolParte debe ser TITULAR o FIRMANTE." }, { status: 400 });
  }
  if (typeof body.orden !== "number") {
    return NextResponse.json({ error: "El orden es obligatorio." }, { status: 400 });
  }

  const creada = await getRepositorioActuacionPartes().crear(
    {
      actuacionId: id,
      personaId: body.personaId.trim(),
      rolParte: body.rolParte,
      orden: body.orden,
      representaAPersonaId: body.representaAPersonaId?.trim(),
      caracter: body.caracter?.trim(),
      domicilioVigente: body.domicilioVigente?.trim(),
      mailVigente: body.mailVigente?.trim(),
    },
    sesion.email
  );

  return NextResponse.json(creada, { status: 201 });
}
