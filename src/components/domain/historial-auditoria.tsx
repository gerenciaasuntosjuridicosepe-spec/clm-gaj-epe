import { EventoHistorial } from "@/lib/types";
import { formatearFecha } from "@/lib/fechas";

/**
 * Historial de auditoría — sección 3.12/6.5 del PRD ("quién, cuándo, qué").
 * Nota de arquitectura (PRD 7.1): con Google Sheets como almacenamiento esto
 * depende de que la aplicación lo escriba activamente en una hoja de log al
 * hacer cada operación; no es una garantía nativa del almacenamiento.
 */
export function HistorialAuditoria({ eventos }: { eventos: EventoHistorial[] }) {
  if (eventos.length === 0) {
    return <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">Sin eventos registrados todavía.</p>;
  }
  return (
    <div>
      {eventos.map((ev, i) => (
        <div key={i} className="flex gap-2.5 border-b border-[var(--color-border)] py-2 last:border-b-0">
          <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand-blue-500" />
          <div>
            <div className="text-[var(--text-base)]">{ev.descripcion}</div>
            <div className="text-[var(--text-2xs)] text-[var(--color-text-muted)]">
              {formatearFecha(ev.fecha)} · {ev.usuario}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
