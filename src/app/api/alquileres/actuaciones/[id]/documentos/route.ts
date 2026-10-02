import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirAccionAlquileres } from "@/lib/alquileres/auth-guard";
import { MATRIZ_DOCUMENTOS } from "@/lib/alquileres/permisos";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioDocumentos } from "@/lib/alquileres/datos/documentos";
import { validarUrlDocumento } from "@/lib/alquileres/reglas/validaciones";
import type { DocumentoAlquiler } from "@/lib/alquileres/tipos";

/** RF-16 (parcial): documentos de una actuación puntual. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await requerirAccionAlquileres("leer", MATRIZ_DOCUMENTOS);
  if (esRespuestaError(sesion)) return sesion;

  const { id } = await params;
  const todos = await getRepositorioDocumentos().listar();
  return NextResponse.json(todos.filter((d) => d.actuacionId === id));
}

/**
 * RF-28 — Adjuntar el enlace de un documento (típicamente el escaneado
 * firmado, `tipoDocumento: "ESCANEADO"` + `firmado: true`, que es lo que
 * apaga la alerta A6). Solo acepta enlaces de `drive.google.com` o
 * `docs.google.com` (sin esto, cualquier URL arbitraria quedaría listada
 * como "el documento firmado" sin que la app pueda verificar nada de su
 * contenido). `origen: "CARGADO"` siempre acá — "GENERADO" es para
 * documentos creados por la app desde una plantilla (RF-25, no esta ruta).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await requerirAccionAlquileres("crear", MATRIZ_DOCUMENTOS);
  if (esRespuestaError(sesion)) return sesion;

  const { id } = await params;
  const actuacion = await getRepositorioActuaciones().obtener(id);
  if (!actuacion) {
    return NextResponse.json({ error: "Actuación no encontrada." }, { status: 404 });
  }

  const body = (await req.json()) as Partial<DocumentoAlquiler>;

  if (!body.tipoDocumento?.trim()) {
    return NextResponse.json({ error: "El tipo de documento es obligatorio." }, { status: 400 });
  }
  if (!body.urlDocumento || !validarUrlDocumento(body.urlDocumento)) {
    return NextResponse.json({ error: "El enlace debe ser https:// de drive.google.com o docs.google.com." }, { status: 400 });
  }

  const creado = await getRepositorioDocumentos().crear(
    {
      actuacionId: id,
      tipoDocumento: body.tipoDocumento.trim(),
      origen: "CARGADO",
      urlDocumento: body.urlDocumento.trim(),
      firmado: Boolean(body.firmado),
      fechaDocumento: body.fechaDocumento,
      observaciones: body.observaciones?.trim(),
    },
    sesion.email
  );

  return NextResponse.json(creado, { status: 201 });
}
