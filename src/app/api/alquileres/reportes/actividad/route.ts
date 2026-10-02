import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirSesionAlquileres } from "@/lib/alquileres/auth-guard";
import { puedeExportarReporte, puedeVerReporte } from "@/lib/alquileres/permisos";
import { listarLogCambios } from "@/lib/alquileres/repositorio/log-cambios";
import { aCsv } from "@/lib/alquileres/exportar";

/** RP-10 — Actividad y cambios (M9/RF-38 + M17). Solo ADMIN/SUPERVISOR. */
export async function GET(req: NextRequest) {
  const sesion = await requerirSesionAlquileres();
  if (esRespuestaError(sesion)) return sesion;
  if (!puedeVerReporte(sesion.rolAlquileres, "RP-10")) {
    return NextResponse.json({ error: "Tu rol no tiene acceso a este reporte." }, { status: 403 });
  }

  const entradas = (await listarLogCambios()).slice().sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));

  const formato = req.nextUrl.searchParams.get("formato");
  if (formato === "csv") {
    if (!puedeExportarReporte(sesion.rolAlquileres, "RP-10")) {
      return NextResponse.json({ error: "Tu rol no puede exportar este reporte." }, { status: 403 });
    }
    const csv = aCsv(entradas, [
      { clave: "fechaHora", titulo: "Fecha y hora" },
      { clave: "usuarioEmail", titulo: "Usuario" },
      { clave: "accion", titulo: "Acción" },
      { clave: "hoja", titulo: "Hoja" },
      { clave: "registroId", titulo: "ID del registro" },
      { clave: "campo", titulo: "Campo" },
      { clave: "valorAnterior", titulo: "Valor anterior" },
      { clave: "valorNuevo", titulo: "Valor nuevo" },
      { clave: "motivo", titulo: "Motivo" },
    ]);
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="rp10-actividad.csv"' },
    });
  }

  return NextResponse.json({ entradas });
}
