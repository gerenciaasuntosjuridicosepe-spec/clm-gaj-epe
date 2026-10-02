import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirAccionAlquileres } from "@/lib/alquileres/auth-guard";
import { enmascararSiLector, MATRIZ_PERSONAS } from "@/lib/alquileres/permisos";
import { getRepositorioPersonas } from "@/lib/alquileres/datos/personas";
import { buscarPersonaDuplicada } from "@/lib/alquileres/reglas/r9-persona-duplicada";
import { validarCuit, validarDni } from "@/lib/alquileres/reglas/validaciones";
import type { Persona } from "@/lib/alquileres/tipos";

/**
 * RF-09 — alta de personas (locadores) con búsqueda previa por CUIT/CUIL o
 * DNI (R9). LECTOR no tiene acceso en absoluto (MATRIZ_PERSONAS: dato
 * personal) — a diferencia de Inmuebles/Expedientes, acá ni siquiera
 * "leer" está permitido para ese rol; `enmascararSiLector` queda como
 * segunda capa de defensa, por si en el futuro se expone esta lista desde
 * una vista agregada donde LECTOR sí tiene "leer".
 */
export async function GET() {
  const sesion = await requerirAccionAlquileres("leer", MATRIZ_PERSONAS);
  if (esRespuestaError(sesion)) return sesion;

  const personas = await getRepositorioPersonas().listar();
  const enmascaradas = personas.map((p) => enmascararSiLector(p, sesion.rolAlquileres));
  return NextResponse.json(enmascaradas);
}

export async function POST(req: NextRequest) {
  const sesion = await requerirAccionAlquileres("crear", MATRIZ_PERSONAS);
  if (esRespuestaError(sesion)) return sesion;

  const body = (await req.json()) as Partial<Persona>;

  if (!body.apellidoNombreRazonSocial?.trim()) {
    return NextResponse.json({ error: "El nombre/razón social es obligatorio." }, { status: 400 });
  }
  if (!body.tipoPersona) {
    return NextResponse.json({ error: "El tipo de persona es obligatorio." }, { status: 400 });
  }
  if (body.dni && !validarDni(body.dni)) {
    return NextResponse.json({ error: "DNI inválido (solo dígitos, 7 u 8)." }, { status: 400 });
  }
  if (body.cuitCuil && !validarCuit(body.cuitCuil)) {
    return NextResponse.json({ error: "CUIT/CUIL inválido (dígito verificador incorrecto)." }, { status: 400 });
  }

  // R9: no duplicar — buscar antes por CUIT/CUIL o DNI y proponer reutilizar.
  // TODO(revisión adversarial, Fase 1): misma ventana de carrera leer-antes-
  // de-escribir que en inmuebles/expedientes (ver esos archivos) — acá
  // además importa más, porque crear una PERSONA duplicada en paralelo
  // puede derivar en dos fichas de locador con el mismo documento. Mismo
  // criterio: aceptado a la escala de GAJ, no resuelto en Fase 1.
  const existentes = await getRepositorioPersonas().listar();
  const duplicada = buscarPersonaDuplicada(existentes, { dni: body.dni, cuitCuil: body.cuitCuil });
  if (duplicada) {
    return NextResponse.json(
      { error: "Ya existe una persona activa con ese documento.", personaExistente: duplicada },
      { status: 409 }
    );
  }

  const creada = await getRepositorioPersonas().crear(
    {
      tipoPersona: body.tipoPersona,
      apellidoNombreRazonSocial: body.apellidoNombreRazonSocial.trim(),
      dni: body.dni?.trim(),
      cuitCuil: body.cuitCuil?.trim(),
      condicionFiscal: body.condicionFiscal,
      domicilioLegal: body.domicilioLegal?.trim(),
      mail: body.mail?.trim(),
      telefono: body.telefono?.trim(),
    },
    sesion.email
  );

  return NextResponse.json(creada, { status: 201 });
}
