import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/domain/alert";
import { auth } from "@/auth";
import { puedeExportarReporte, puedeVerReporte } from "@/lib/alquileres/permisos";
import { listarLogCambios } from "@/lib/alquileres/repositorio/log-cambios";

export const dynamic = "force-dynamic";

/** RP-10 — Actividad y cambios (M9/RF-38 + M17). */
export default async function ReporteActividadPage() {
  const session = await auth();
  const rol = session?.user?.rolAlquileres;

  if (!puedeVerReporte(rol, "RP-10")) {
    return (
      <AppShell titulo="RP-10 — Actividad">
        <Alert variant="warning">Tu rol no tiene acceso a este reporte.</Alert>
      </AppShell>
    );
  }

  const entradas = (await listarLogCambios()).slice().sort((a, b) => b.fechaHora.localeCompare(a.fechaHora)).slice(0, 500);

  return (
    <AppShell titulo="RP-10 — Actividad y cambios">
      <div className="mb-1 flex items-center justify-between">
        <div className="font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Actividad y cambios</div>
        {puedeExportarReporte(rol, "RP-10") && (
          <a href="/api/alquileres/reportes/actividad?formato=csv" className="text-[var(--text-sm)] font-semibold text-brand-blue-700 hover:underline">
            Exportar CSV
          </a>
        )}
      </div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Últimas {entradas.length} entradas de LOG_CAMBIOS (más reciente primero).
      </p>

      <div className="overflow-x-auto overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        {entradas.length === 0 ? (
          <p className="p-4.5 text-[var(--color-text-muted)]">Sin actividad registrada todavía.</p>
        ) : (
          <table className="w-full text-[var(--text-base)]">
            <thead>
              <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
                <th className="px-3.5 py-2.5">Fecha y hora</th>
                <th className="px-3.5 py-2.5">Usuario</th>
                <th className="px-3.5 py-2.5">Acción</th>
                <th className="px-3.5 py-2.5">Hoja</th>
                <th className="px-3.5 py-2.5">Registro</th>
                <th className="px-3.5 py-2.5">Campo</th>
                <th className="px-3.5 py-2.5">Anterior</th>
                <th className="px-3.5 py-2.5">Nuevo</th>
              </tr>
            </thead>
            <tbody>
              {entradas.map((e) => (
                <tr key={e.logId} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-3.5 py-2.5 text-[var(--text-sm)]">{e.fechaHora}</td>
                  <td className="px-3.5 py-2.5">{e.usuarioEmail}</td>
                  <td className="px-3.5 py-2.5 font-semibold">{e.accion}</td>
                  <td className="px-3.5 py-2.5">{e.hoja}</td>
                  <td className="px-3.5 py-2.5 font-mono text-[var(--text-sm)]">{e.registroId}</td>
                  <td className="px-3.5 py-2.5">{e.campo ?? "—"}</td>
                  <td className="px-3.5 py-2.5 text-[var(--color-text-secondary)]">{e.valorAnterior ?? "—"}</td>
                  <td className="px-3.5 py-2.5 text-[var(--color-text-secondary)]">{e.valorNuevo ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
