import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/domain/alert";
import { auth } from "@/auth";
import { listarErrores } from "@/lib/alquileres/repositorio/errores";

export const dynamic = "force-dynamic";

/** Fase 4 — "pantalla de errores": errores no capturados en rutas de Alquileres, registrados automáticamente (ver src/instrumentation.ts, onRequestError). */
export default async function ErroresPage() {
  const session = await auth();
  const rol = session?.user?.rolAlquileres;

  if (rol !== "ADMINISTRADOR") {
    return (
      <AppShell titulo="Errores — Alquileres">
        <Alert variant="warning">Solo el ADMINISTRADOR ve esta pantalla.</Alert>
      </AppShell>
    );
  }

  const errores = (await listarErrores()).slice().sort((a, b) => b.fechaHora.localeCompare(a.fechaHora)).slice(0, 500);

  return (
    <AppShell titulo="Errores — Alquileres">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Pantalla de errores</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Errores no capturados en rutas del módulo, registrados automáticamente (más reciente primero).
      </p>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        {errores.length === 0 ? (
          <p className="p-4.5 text-[var(--color-text-muted)]">Sin errores registrados — buena señal.</p>
        ) : (
          <table className="w-full text-[var(--text-base)]">
            <thead>
              <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
                <th className="px-3.5 py-2.5">Fecha y hora</th>
                <th className="px-3.5 py-2.5">Función/ruta</th>
                <th className="px-3.5 py-2.5">Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {errores.map((e, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-3.5 py-2.5 text-[var(--text-sm)]">{e.fechaHora}</td>
                  <td className="px-3.5 py-2.5 font-mono text-[var(--text-sm)]">{e.funcion}</td>
                  <td className="px-3.5 py-2.5 text-[var(--color-text-secondary)]">{e.mensaje}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
