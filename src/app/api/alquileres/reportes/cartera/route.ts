import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirSesionAlquileres } from "@/lib/alquileres/auth-guard";
import { puedeExportarReporte, puedeVerReporte } from "@/lib/alquileres/permisos";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioInmuebles } from "@/lib/alquileres/datos/inmuebles";
import { getRepositorioActuacionPartes } from "@/lib/alquileres/datos/actuacion-partes";
import { getRepositorioPersonas } from "@/lib/alquileres/datos/personas";
import { calcularCarteraVigente } from "@/lib/alquileres/reglas/rp02-cartera";
import { aCsv } from "@/lib/alquileres/exportar";
import { hoy } from "@/lib/alquileres/fechas";
import { numeroParametro, PARAMETROS_SEED } from "@/lib/alquileres/catalogos/parametros-seed";

/**
 * RP-02 — Cartera de contratos vigentes. Todos los roles pueden VER (la
 * sección 3 del PRD v1 no excluye a LECTOR de este reporte), pero LECTOR
 * ve `locadores` vacío (dato personal) y no puede exportar — ver
 * `MATRIZ_REPORTES` en `permisos.ts`.
 */
export async function GET(req: NextRequest) {
  const sesion = await requerirSesionAlquileres();
  if (esRespuestaError(sesion)) return sesion;
  if (!puedeVerReporte(sesion.rolAlquileres, "RP-02")) {
    return NextResponse.json({ error: "Tu rol no tiene acceso a este reporte." }, { status: 403 });
  }

  const [actuaciones, inmuebles, partes, personas] = await Promise.all([
    getRepositorioActuaciones().listar(),
    getRepositorioInmuebles().listar(),
    getRepositorioActuacionPartes().listar(),
    getRepositorioPersonas().listar(),
  ]);

  const resultado = calcularCarteraVigente({
    actuaciones,
    inmuebles,
    partes,
    personas,
    hoy: hoy(),
    alicuotaIva: numeroParametro(PARAMETROS_SEED, "alicuota_iva", 21),
  });

  // LECTOR: dato personal enmascarado (no se oculta el reporte entero, solo la columna de locadores).
  const esLector = sesion.rolAlquileres === "LECTOR";
  const filas = esLector ? resultado.filas.map((f) => ({ ...f, locadores: "" })) : resultado.filas;

  const formato = req.nextUrl.searchParams.get("formato");
  if (formato === "csv") {
    if (!puedeExportarReporte(sesion.rolAlquileres, "RP-02")) {
      return NextResponse.json({ error: "Tu rol no puede exportar este reporte." }, { status: 403 });
    }
    const csv = aCsv(filas, [
      { clave: "actuacionId", titulo: "Actuación" },
      { clave: "inmuebleId", titulo: "Inmueble" },
      { clave: "inmuebleDomicilio", titulo: "Domicilio" },
      { clave: "locadores", titulo: "Locadores" },
      { clave: "sectorInteresadoAreaId", titulo: "Sector/Área" },
      { clave: "destinoCategoria", titulo: "Destino" },
      { clave: "plazoMeses", titulo: "Plazo (meses)" },
      { clave: "fechaInicio", titulo: "Fecha de inicio" },
      { clave: "fechaFin", titulo: "Fecha de fin" },
      { clave: "canonInicial", titulo: "Canon inicial" },
      { clave: "condicionIvaCanon", titulo: "Condición de IVA" },
      { clave: "canonNeto", titulo: "Canon neto" },
      { clave: "reglaActualizacion", titulo: "Regla de actualización" },
      { clave: "expedienteId", titulo: "Expediente" },
    ]);
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="rp02-cartera.csv"' },
    });
  }

  return NextResponse.json({ filas, totalNeto: resultado.totalNeto, cantidadSinDatoIva: resultado.cantidadSinDatoIva });
}
