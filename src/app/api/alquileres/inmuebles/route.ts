import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirAccionAlquileres } from "@/lib/alquileres/auth-guard";
import { MATRIZ_GESTION } from "@/lib/alquileres/permisos";
import { getRepositorioInmuebles } from "@/lib/alquileres/datos/inmuebles";
import { validarPartidaInmobiliaria } from "@/lib/alquileres/reglas/validaciones";
import type { Inmueble } from "@/lib/alquileres/tipos";

/** RF-05: alta, edición y baja lógica de inmuebles. Esta ruta: listado y alta. */
export async function GET() {
  const sesion = await requerirAccionAlquileres("leer", MATRIZ_GESTION);
  if (esRespuestaError(sesion)) return sesion;

  const inmuebles = await getRepositorioInmuebles().listar();
  return NextResponse.json(inmuebles);
}

export async function POST(req: NextRequest) {
  const sesion = await requerirAccionAlquileres("crear", MATRIZ_GESTION);
  if (esRespuestaError(sesion)) return sesion;

  const body = (await req.json()) as Partial<Inmueble>;

  if (!body.domicilio?.trim()) {
    return NextResponse.json({ error: "El domicilio es obligatorio." }, { status: 400 });
  }
  if (!body.localidadId?.trim()) {
    return NextResponse.json({ error: "La localidad es obligatoria." }, { status: 400 });
  }
  if (body.partidaInmobiliaria && !validarPartidaInmobiliaria(body.partidaInmobiliaria)) {
    return NextResponse.json(
      { error: "Formato de partida inmobiliaria inválido (NN-NN-NN-NNNNNN/NNNN-N)." },
      { status: 400 }
    );
  }

  // RF-05: rechaza partida duplicada entre inmuebles activos.
  // TODO(revisión adversarial, Fase 1): "leer para chequear, después crear"
  // tiene una ventana de carrera — dos altas con la misma partida casi
  // simultáneas podrían pasar las dos esta validación antes de que
  // cualquiera de las dos exista todavía. Mismo tipo de ventana que el PRD
  // v2.1 ya acepta explícitamente para el control de versión en ediciones
  // (sección 4, punto 2: "milisegundos... se acepta para GAJ, hasta 15
  // usuarios") — acá es alta, no edición, pero la escala de uso es la
  // misma. No se resuelve en Fase 1: necesitaría una restricción de
  // unicidad del lado del repositorio (ej. un segundo intento de lectura
  // justo antes de escribir, o una cola de escritura), que hoy no existe
  // para ninguna tabla. Si en el piloto real aparece un duplicado por esta
  // vía, es la señal de que hay que resolverlo antes de Fase 5.
  if (body.partidaInmobiliaria) {
    const existentes = await getRepositorioInmuebles().listar();
    if (existentes.some((i) => i.partidaInmobiliaria === body.partidaInmobiliaria)) {
      return NextResponse.json({ error: "Ya existe un inmueble activo con esa partida inmobiliaria." }, { status: 409 });
    }
  }

  const creado = await getRepositorioInmuebles().crear(
    {
      domicilio: body.domicilio.trim(),
      localidadId: body.localidadId.trim(),
      partidaInmobiliaria: body.partidaInmobiliaria?.trim(),
      observaciones: body.observaciones?.trim(),
    },
    sesion.email
  );

  return NextResponse.json(creado, { status: 201 });
}
