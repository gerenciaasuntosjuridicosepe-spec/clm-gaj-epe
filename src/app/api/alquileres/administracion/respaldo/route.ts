import { NextResponse } from "next/server";
import { esRespuestaError, requerirSesionAlquileres } from "@/lib/alquileres/auth-guard";
import { obtenerParametro, guardarParametro } from "@/lib/alquileres/datos/parametros";
import { alertaA8SinRespaldoReciente } from "@/lib/alquileres/reglas/alertas";
import { numeroParametro, PARAMETROS_SEED } from "@/lib/alquileres/catalogos/parametros-seed";
import { diferenciaDias, hoy } from "@/lib/alquileres/fechas";

/**
 * RF-39 [CAMBIO v2.1] — Respaldo MANUAL (D13): la app no copia nada a
 * Drive sola (necesitaría la API de Drive con credenciales reales, fuera
 * de los límites duros de este desarrollo — "nunca hablar con Google
 * real"). El ADMINISTRADOR hace la copia de verdad por fuera de la app
 * (Drive, manualmente) y usa este botón para REGISTRAR que ya la hizo —
 * mismo patrón que RF-23 ("Marcar como enviado": el envío real pasa por
 * la casilla del gestor, la app solo registra que pasó). Así "Último
 * respaldo: hace N días" y la alerta A8 funcionan de verdad sin que la
 * app necesite tocar Drive. Ver docs/PENDIENTES-HUMANOS.md para el paso
 * real de automatizar la copia cuando haya credenciales.
 */
export async function GET() {
  const sesion = await requerirSesionAlquileres();
  if (esRespuestaError(sesion)) return sesion;
  if (sesion.rolAlquileres !== "ADMINISTRADOR") {
    return NextResponse.json({ error: "Solo el ADMINISTRADOR ve el estado del respaldo." }, { status: 403 });
  }

  const parametro = await obtenerParametro("ultimo_respaldo_en");
  const ultimoRespaldoEn = parametro?.valor;
  const diasAlertaRespaldo = numeroParametro(PARAMETROS_SEED, "dias_alerta_respaldo", 7);

  return NextResponse.json({
    ultimoRespaldoEn,
    diasDesdeUltimoRespaldo: ultimoRespaldoEn ? diferenciaDias(ultimoRespaldoEn, hoy()) : undefined,
    alertaA8: alertaA8SinRespaldoReciente(ultimoRespaldoEn, hoy(), diasAlertaRespaldo),
  });
}

export async function POST() {
  const sesion = await requerirSesionAlquileres();
  if (esRespuestaError(sesion)) return sesion;
  if (sesion.rolAlquileres !== "ADMINISTRADOR") {
    return NextResponse.json({ error: "Solo el ADMINISTRADOR puede registrar un respaldo." }, { status: 403 });
  }

  const parametro = await guardarParametro("ultimo_respaldo_en", hoy(), sesion.email, "Fecha del último respaldo manual registrado (RF-39).");
  return NextResponse.json({ ultimoRespaldoEn: parametro.valor });
}
