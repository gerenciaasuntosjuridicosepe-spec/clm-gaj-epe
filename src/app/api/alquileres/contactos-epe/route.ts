import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirAccionAlquileres } from "@/lib/alquileres/auth-guard";
import { MATRIZ_CONTACTOS_EPE } from "@/lib/alquileres/permisos";
import { getRepositorioContactosEpe } from "@/lib/alquileres/datos/contactos-epe";
import { validarMailEpe } from "@/lib/alquileres/reglas/validaciones";
import { hoy } from "@/lib/alquileres/fechas";
import type { ContactoEpe } from "@/lib/alquileres/tipos";

/**
 * RF-33 (parcial) — Contactos EPE, con historial de vigencia. Alta mínima
 * para destrabar RF-22 (destinatarios del aviso) — sin ABM completo
 * todavía (edición, ni el "al cargar un nuevo titular, la app propone
 * cerrar vigente_hasta del anterior" de RF-33, que queda para cuando haya
 * una pantalla propia).
 */
export async function GET() {
  const sesion = await requerirAccionAlquileres("leer", MATRIZ_CONTACTOS_EPE);
  if (esRespuestaError(sesion)) return sesion;

  const contactos = await getRepositorioContactosEpe().listar();
  return NextResponse.json(contactos);
}

export async function POST(req: NextRequest) {
  const sesion = await requerirAccionAlquileres("crear", MATRIZ_CONTACTOS_EPE);
  if (esRespuestaError(sesion)) return sesion;

  const body = (await req.json()) as Partial<ContactoEpe>;

  if (!body.areaId?.trim()) {
    return NextResponse.json({ error: "El área es obligatoria." }, { status: 400 });
  }
  if (!body.nombre?.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }
  if (!body.cargo?.trim()) {
    return NextResponse.json({ error: "El cargo es obligatorio." }, { status: 400 });
  }
  if (!body.mail || !validarMailEpe(body.mail)) {
    return NextResponse.json({ error: "El mail debe tener formato válido y ser del dominio @epe.santafe.gov.ar." }, { status: 400 });
  }

  const creado = await getRepositorioContactosEpe().crear(
    {
      areaId: body.areaId.trim(),
      nombre: body.nombre.trim(),
      cargo: body.cargo.trim(),
      mail: body.mail.trim(),
      telefono: body.telefono?.trim(),
      vigenteDesde: body.vigenteDesde?.trim() || hoy(),
      vigenteHasta: body.vigenteHasta?.trim(),
    },
    sesion.email
  );

  return NextResponse.json(creado, { status: 201 });
}
