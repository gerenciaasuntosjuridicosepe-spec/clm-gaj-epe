import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirSesionAlquileres } from "@/lib/alquileres/auth-guard";
import { puedeExportarReporte, puedeVerReporte } from "@/lib/alquileres/permisos";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioInmuebles } from "@/lib/alquileres/datos/inmuebles";
import { calcularVencimientosPorHorizonte } from "@/lib/alquileres/reglas/rp01-vencimientos";
import { aCsv } from "@/lib/alquileres/exportar";
import { hoy } from "@/lib/alquileres/fechas";

/** RP-01 — Vencimientos por horizonte (30/60/90/120/180/365 días), con semáforo y renovación en curso. Acceso: todos los roles del módulo. */
export async function GET(req: NextRequest) {
  const sesion = await requerirSesionAlquileres();
  if (esRespuestaError(sesion)) return sesion;
  if (!puedeVerReporte(sesion.rolAlquileres, "RP-01")) {
    return NextResponse.json({ error: "Tu rol no tiene acceso a este reporte." }, { status: 403 });
  }

  const [actuaciones, inmuebles] = await Promise.all([getRepositorioActuaciones().listar(), getRepositorioInmuebles().listar()]);
  const filas = calcularVencimientosPorHorizonte(actuaciones, inmuebles, hoy());

  const formato = req.nextUrl.searchParams.get("formato");
  if (formato === "csv") {
    if (!puedeExportarReporte(sesion.rolAlquileres, "RP-01")) {
      return NextResponse.json({ error: "Tu rol no puede exportar este reporte." }, { status: 403 });
    }
    const csv = aCsv(filas, [
      { clave: "actuacionId", titulo: "Actuación" },
      { clave: "inmuebleId", titulo: "Inmueble" },
      { clave: "sectorInteresadoAreaId", titulo: "Sector/Área" },
      { clave: "localidadId", titulo: "Localidad" },
      { clave: "vencimientoEfectivo", titulo: "Vencimiento efectivo" },
      { clave: "diasRestantes", titulo: "Días restantes" },
      { clave: "nivel", titulo: "Semáforo" },
      { clave: "horizonte", titulo: "Horizonte (días)" },
      { clave: "renovacionEnCurso", titulo: "Renovación en curso" },
    ]);
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="rp01-vencimientos.csv"' },
    });
  }

  return NextResponse.json({ filas });
}
