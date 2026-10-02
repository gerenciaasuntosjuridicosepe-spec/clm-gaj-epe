import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirAccionAlquileres } from "@/lib/alquileres/auth-guard";
import { MATRIZ_ADMINISTRACION } from "@/lib/alquileres/permisos";
import { getRepositorioAreas } from "@/lib/alquileres/datos/areas";
import type { Area } from "@/lib/alquileres/tipos";

/**
 * RF-33 (parcial) — Áreas de EPE. Sin fila propia en la matriz de permisos
 * de la sección 3 del PRD v1 (ver `permisos.ts`, `MATRIZ_CONTACTOS_EPE`):
 * se usa `MATRIZ_ADMINISTRACION` (solo ADMINISTRADOR escribe) como default
 * razonable para la estructura organizativa de EPE.
 *
 * Alta mínima para destrabar RF-22 (destinatarios del aviso, que necesitan
 * `tipoArea` de la actuación) — sin ABM completo todavía (edición/baja).
 * `tipoArea` no se valida contra una lista fija acá (R20: el catálogo
 * `tipo_area` es editable por ADMINISTRADOR sin tocar código, y los
 * valores reales más allá de SUCURSAL/GERENCIA están pendientes del libro
 * original — `docs/PENDIENTES-HUMANOS.md`); se exige solo que no esté
 * vacío, igual que el resto de los catálogos abiertos de este módulo.
 */
export async function GET() {
  const sesion = await requerirAccionAlquileres("leer", MATRIZ_ADMINISTRACION);
  if (esRespuestaError(sesion)) return sesion;

  const areas = await getRepositorioAreas().listar();
  return NextResponse.json(areas);
}

export async function POST(req: NextRequest) {
  const sesion = await requerirAccionAlquileres("crear", MATRIZ_ADMINISTRACION);
  if (esRespuestaError(sesion)) return sesion;

  const body = (await req.json()) as Partial<Area>;

  if (!body.nombre?.trim()) {
    return NextResponse.json({ error: "El nombre del área es obligatorio." }, { status: 400 });
  }
  if (!body.tipoArea?.trim()) {
    return NextResponse.json({ error: "El tipo de área es obligatorio." }, { status: 400 });
  }

  const creada = await getRepositorioAreas().crear(
    { nombre: body.nombre.trim(), tipoArea: body.tipoArea.trim(), areaPadreId: body.areaPadreId },
    sesion.email
  );

  return NextResponse.json(creada, { status: 201 });
}
