import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/domain/alert";
import { HistorialAuditoria } from "@/components/domain/historial-auditoria";
import { listarVisibles } from "@/lib/data/provider";
import { auth } from "@/auth";
import { rolClmDeSesion } from "@/lib/auth-guard";

// Los datos vienen de Sheets/mock y cambian en cualquier momento (nuevas
// solicitudes, aprobaciones, vencimientos); no tiene sentido cachear esta
// página en build time ni servir una versión vieja.
export const dynamic = "force-dynamic";

/**
 * Auditoría — PRD sección 6.5/7.1: registro de quién/cuándo/qué por
 * expediente. Con Google Sheets como almacenamiento esto depende de que la
 * aplicación lo escriba activamente en una hoja de log; no cubre cambios
 * hechos directamente sobre el Sheet por fuera de la app (riesgo aceptado, 8.2).
 */
export default async function AuditoriaPage() {
  const session = await auth();
  const contratos = await listarVisibles(rolClmDeSesion(session));
  const eventos = contratos.flatMap((c) => c.historial.map((h) => ({ ...h, contratoId: c.id })));

  return (
    <AppShell titulo="Auditoría">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Auditoría</div>
      <p className="mb-4 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Registro de quién, cuándo y qué se modificó por expediente
      </p>

      <Alert variant="warning">
        Auditoría fina limitada (PRD 8.2): con Google Sheets como almacenamiento, este registro depende de que la
        aplicación lo escriba en cada operación. No cubre ediciones hechas directamente sobre el Sheet por fuera de la app.
      </Alert>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4.5 shadow-[var(--shadow-sm)]">
        <HistorialAuditoria eventos={eventos} />
      </div>
    </AppShell>
  );
}
