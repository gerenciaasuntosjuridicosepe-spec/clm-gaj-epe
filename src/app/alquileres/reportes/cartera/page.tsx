import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/domain/alert";
import { auth } from "@/auth";
import { puedeExportarReporte, puedeVerReporte } from "@/lib/alquileres/permisos";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioInmuebles } from "@/lib/alquileres/datos/inmuebles";
import { getRepositorioActuacionPartes } from "@/lib/alquileres/datos/actuacion-partes";
import { getRepositorioPersonas } from "@/lib/alquileres/datos/personas";
import { calcularCarteraVigente } from "@/lib/alquileres/reglas/rp02-cartera";
import { formatearFecha, formatearMonto, hoy } from "@/lib/alquileres/fechas";
import { numeroParametro, PARAMETROS_SEED } from "@/lib/alquileres/catalogos/parametros-seed";

export const dynamic = "force-dynamic";

/** RP-02 — Cartera de contratos vigentes. */
export default async function ReporteCarteraPage() {
  const session = await auth();
  const rol = session?.user?.rolAlquileres;

  if (!puedeVerReporte(rol, "RP-02")) {
    return (
      <AppShell titulo="RP-02 — Cartera">
        <Alert variant="warning">Tu rol no tiene acceso a este reporte.</Alert>
      </AppShell>
    );
  }

  const [actuaciones, inmuebles, partes, personas] = await Promise.all([
    getRepositorioActuaciones().listar(),
    getRepositorioInmuebles().listar(),
    getRepositorioActuacionPartes().listar(),
    getRepositorioPersonas().listar(),
  ]);

  const { filas, totalNeto, cantidadSinDatoIva } = calcularCarteraVigente({
    actuaciones,
    inmuebles,
    partes,
    personas,
    hoy: hoy(),
    alicuotaIva: numeroParametro(PARAMETROS_SEED, "alicuota_iva", 21),
  });

  const esLector = rol === "LECTOR";

  return (
    <AppShell titulo="RP-02 — Cartera de contratos vigentes">
      <div className="mb-1 flex items-center justify-between">
        <div className="font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Cartera de contratos vigentes</div>
        {puedeExportarReporte(rol, "RP-02") && (
          <a href="/api/alquileres/reportes/cartera?formato=csv" className="text-[var(--text-sm)] font-semibold text-brand-blue-700 hover:underline">
            Exportar CSV
          </a>
        )}
      </div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Canon neto total: {formatearMonto(totalNeto)} — {cantidadSinDatoIva} contrato(s) sin dato de IVA excluidos del total.
        {esLector && " Los locadores no se muestran a tu rol (dato personal)."}
      </p>

      <div className="overflow-x-auto overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        {filas.length === 0 ? (
          <p className="p-4.5 text-[var(--color-text-muted)]">Sin contratos vigentes.</p>
        ) : (
          <table className="w-full text-[var(--text-base)]">
            <thead>
              <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
                <th className="px-3.5 py-2.5">Actuación</th>
                <th className="px-3.5 py-2.5">Inmueble</th>
                {!esLector && <th className="px-3.5 py-2.5">Locadores</th>}
                <th className="px-3.5 py-2.5">Destino</th>
                <th className="px-3.5 py-2.5">Inicio</th>
                <th className="px-3.5 py-2.5">Fin</th>
                <th className="px-3.5 py-2.5">Canon neto</th>
                <th className="px-3.5 py-2.5">Expediente</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.actuacionId} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-3.5 py-2.5 font-mono text-[var(--text-sm)]">{f.actuacionId}</td>
                  <td className="px-3.5 py-2.5">{f.inmuebleDomicilio || f.inmuebleId}</td>
                  {!esLector && <td className="px-3.5 py-2.5">{f.locadores || "—"}</td>}
                  <td className="px-3.5 py-2.5">{f.destinoCategoria ?? "—"}</td>
                  <td className="px-3.5 py-2.5">{formatearFecha(f.fechaInicio)}</td>
                  <td className="px-3.5 py-2.5">{formatearFecha(f.fechaFin)}</td>
                  <td className="px-3.5 py-2.5">{f.canonNeto !== undefined ? formatearMonto(f.canonNeto) : "sin dato de IVA"}</td>
                  <td className="px-3.5 py-2.5">{f.expedienteId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
