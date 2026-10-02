import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirSesionAlquileres } from "@/lib/alquileres/auth-guard";
import { puedeExportarReporte, puedeVerReporte } from "@/lib/alquileres/permisos";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioInmuebles } from "@/lib/alquileres/datos/inmuebles";
import { getRepositorioActuacionPartes } from "@/lib/alquileres/datos/actuacion-partes";
import { getRepositorioPersonas } from "@/lib/alquileres/datos/personas";
import { getRepositorioDocumentos } from "@/lib/alquileres/datos/documentos";
import { calcularCalidadDatos } from "@/lib/alquileres/reglas/rp09-calidad-datos";
import { aCsv } from "@/lib/alquileres/exportar";

/** RP-09 — Calidad de datos (V5). ADMIN/GESTOR/SUPERVISOR; LECTOR sin acceso (muestra nombres de personas). */
export async function GET(req: NextRequest) {
  const sesion = await requerirSesionAlquileres();
  if (esRespuestaError(sesion)) return sesion;
  if (!puedeVerReporte(sesion.rolAlquileres, "RP-09")) {
    return NextResponse.json({ error: "Tu rol no tiene acceso a este reporte." }, { status: 403 });
  }

  const [actuaciones, inmuebles, partes, personas, documentos] = await Promise.all([
    getRepositorioActuaciones().listar(),
    getRepositorioInmuebles().listar(),
    getRepositorioActuacionPartes().listar(),
    getRepositorioPersonas().listar(),
    getRepositorioDocumentos().listar(),
  ]);

  const hallazgos = calcularCalidadDatos({ actuaciones, inmuebles, partes, personas, documentos });

  const formato = req.nextUrl.searchParams.get("formato");
  if (formato === "csv") {
    if (!puedeExportarReporte(sesion.rolAlquileres, "RP-09")) {
      return NextResponse.json({ error: "Tu rol no puede exportar este reporte." }, { status: 403 });
    }
    const csv = aCsv(hallazgos, [
      { clave: "tipo", titulo: "Tipo de hallazgo" },
      { clave: "actuacionId", titulo: "Actuación" },
      { clave: "inmuebleId", titulo: "Inmueble" },
      { clave: "personaId", titulo: "Persona" },
      { clave: "descripcion", titulo: "Descripción" },
    ]);
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="rp09-calidad-datos.csv"' },
    });
  }

  return NextResponse.json({ hallazgos });
}
