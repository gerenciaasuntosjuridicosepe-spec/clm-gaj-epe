import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/domain/alert";
import { auth } from "@/auth";
import { puedeExportarReporte, puedeVerReporte } from "@/lib/alquileres/permisos";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioInmuebles } from "@/lib/alquileres/datos/inmuebles";
import { calcularVencimientosPorHorizonte } from "@/lib/alquileres/reglas/rp01-vencimientos";
import { formatearFecha } from "@/lib/alquileres/fechas";
import { hoy } from "@/lib/alquileres/fechas";

export const dynamic = "force-dynamic";

const ETIQUETA_NIVEL: Record<string, string> = { verde: "Verde", amarillo: "Amarillo", naranja: "Naranja", rojo: "Rojo", gris: "—" };

/** RP-01 — Vencimientos por horizonte. */
export default async function ReporteVencimientosPage() {
  const session = await auth();
  const rol = session?.user?.rolAlquileres;

  if (!puedeVerReporte(rol, "RP-01")) {
    return (
      <AppShell titulo="RP-01 — Vencimientos">
        <Alert variant="warning">Tu rol no tiene acceso a este reporte.</Alert>
      </AppShell>
    );
  }

  const [actuaciones, inmuebles] = await Promise.all([getRepositorioActuaciones().listar(), getRepositorioInmuebles().listar()]);
  const filas = calcularVencimientosPorHorizonte(actuaciones, inmuebles, hoy());

  return (
    <AppShell titulo="RP-01 — Vencimientos por horizonte">
      <div className="mb-1 flex items-center justify-between">
        <div className="font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Vencimientos por horizonte</div>
        {puedeExportarReporte(rol, "RP-01") && (
          <a href="/api/alquileres/reportes/vencimientos?formato=csv" className="text-[var(--text-sm)] font-semibold text-brand-blue-700 hover:underline">
            Exportar CSV
          </a>
        )}
      </div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Contratos vigentes que vencen en 30/60/90/120/180/365 días, con semáforo y renovación en curso (C4).
      </p>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        {filas.length === 0 ? (
          <p className="p-4.5 text-[var(--color-text-muted)]">Sin contratos vigentes con vencimiento cargado.</p>
        ) : (
          <table className="w-full text-[var(--text-base)]">
            <thead>
              <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
                <th className="px-3.5 py-2.5">Actuación</th>
                <th className="px-3.5 py-2.5">Inmueble</th>
                <th className="px-3.5 py-2.5">Localidad</th>
                <th className="px-3.5 py-2.5">Vence</th>
                <th className="px-3.5 py-2.5">Días</th>
                <th className="px-3.5 py-2.5">Semáforo</th>
                <th className="px-3.5 py-2.5">Horizonte</th>
                <th className="px-3.5 py-2.5">Renovación</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.actuacionId} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-3.5 py-2.5 font-mono text-[var(--text-sm)]">{f.actuacionId}</td>
                  <td className="px-3.5 py-2.5">{f.inmuebleId}</td>
                  <td className="px-3.5 py-2.5">{f.localidadId ?? "—"}</td>
                  <td className="px-3.5 py-2.5">{formatearFecha(f.vencimientoEfectivo)}</td>
                  <td className="px-3.5 py-2.5">{f.diasRestantes}</td>
                  <td className="px-3.5 py-2.5">{ETIQUETA_NIVEL[f.nivel]}</td>
                  <td className="px-3.5 py-2.5">{f.horizonte ?? "> 365"}</td>
                  <td className="px-3.5 py-2.5">{f.renovacionEnCurso ? "Sí" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
