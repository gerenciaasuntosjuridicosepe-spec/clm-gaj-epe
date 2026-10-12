import { NextResponse } from "next/server";
import { requerirAdmin, esRespuestaError } from "@/lib/auth-guard";
import { googleSheetsConfigurado } from "@/lib/data/google-sheets-client";
import { auth } from "@/auth";
import { buscarUsuarioPorEmail } from "@/lib/data/usuarios-provider";
import { comoRolAlquileres } from "@/lib/acceso-modulo";

/** Endpoint temporal de diagnóstico — remover apenas se resuelva el bug de rol_alquileres en producción. */
export async function GET() {
  const sesion = await requerirAdmin();
  if (esRespuestaError(sesion)) return sesion;

  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? "";
  const idAlquileres = process.env.GOOGLE_SHEETS_ALQUILERES_ID ?? "";

  const session = await auth();
  const email = session?.user?.email ?? "";
  const usuario = email ? await buscarUsuarioPorEmail(email) : undefined;

  return NextResponse.json({
    sheetsConfigurado: googleSheetsConfigurado(),
    spreadsheetIdUltimos6: id.slice(-6),
    alquileresIdUltimos6: idAlquileres.slice(-6),
    nodeEnv: process.env.NODE_ENV,
    usuarioEncontrado: Boolean(usuario),
    usuarioId: usuario?.id ?? null,
    rolId: usuario?.rolId ?? null,
    rolAlquileresCrudo: usuario?.rolAlquileres ?? null,
    rolAlquileresNormalizado: comoRolAlquileres(usuario?.rolAlquileres) ?? null,
    activo: usuario?.activo ?? null,
  });
}
