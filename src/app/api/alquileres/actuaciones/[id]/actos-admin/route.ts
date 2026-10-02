import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirAccionAlquileres } from "@/lib/alquileres/auth-guard";
import { MATRIZ_DOCUMENTOS } from "@/lib/alquileres/permisos";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioActosAdmin } from "@/lib/alquileres/datos/actos-admin";
import type { ActoAdmin } from "@/lib/alquileres/tipos";

/** RF-16 (parcial): actos administrativos de una actuación puntual. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await requerirAccionAlquileres("leer", MATRIZ_DOCUMENTOS);
  if (esRespuestaError(sesion)) return sesion;

  const { id } = await params;
  const todos = await getRepositorioActosAdmin().listar();
  return NextResponse.json(todos.filter((a) => a.actuacionId === id));
}

/**
 * RF-29 — Registrar un acto administrativo. Sobre todo relevante para
 * LEGITIMO_ABONO: R4' (`validarObligatoriosFormalizacion`) exige al menos
 * uno antes de FORMALIZADA — esta ruta es la única forma de cargarlos, así
 * que es la que destraba esa validación en la práctica (ver el `PATCH` de
 * `[id]/route.ts`, que ahora consulta esta tabla).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await requerirAccionAlquileres("crear", MATRIZ_DOCUMENTOS);
  if (esRespuestaError(sesion)) return sesion;

  const { id } = await params;
  const actuacion = await getRepositorioActuaciones().obtener(id);
  if (!actuacion) {
    return NextResponse.json({ error: "Actuación no encontrada." }, { status: 404 });
  }

  const body = (await req.json()) as Partial<ActoAdmin>;

  if (!body.tipoActo?.trim()) {
    return NextResponse.json({ error: "El tipo de acto es obligatorio." }, { status: 400 });
  }
  if (!body.numeroActo?.trim()) {
    return NextResponse.json({ error: "El número de acto es obligatorio." }, { status: 400 });
  }
  if (!body.fechaActo?.trim()) {
    return NextResponse.json({ error: "La fecha del acto es obligatoria." }, { status: 400 });
  }
  if (!body.organoEmisor?.trim()) {
    return NextResponse.json({ error: "El órgano emisor es obligatorio." }, { status: 400 });
  }

  const creado = await getRepositorioActosAdmin().crear(
    {
      actuacionId: id,
      tipoActo: body.tipoActo.trim(),
      numeroActo: body.numeroActo.trim(),
      fechaActo: body.fechaActo.trim(),
      organoEmisor: body.organoEmisor.trim(),
      documentoId: body.documentoId,
    },
    sesion.email
  );

  return NextResponse.json(creado, { status: 201 });
}
