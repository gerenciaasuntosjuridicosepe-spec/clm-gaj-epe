import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/auth";
import { puedeVerReporte, type CodigoReporte } from "@/lib/alquileres/permisos";

export const dynamic = "force-dynamic";

const REPORTES: { codigo: CodigoReporte; href: string; titulo: string; descripcion: string }[] = [
  { codigo: "RP-01", href: "/alquileres/reportes/vencimientos", titulo: "RP-01 — Vencimientos por horizonte", descripcion: "Contratos que vencen en 30/60/90/120/180/365 días, con semáforo y estado de la renovación." },
  { codigo: "RP-02", href: "/alquileres/reportes/cartera", titulo: "RP-02 — Cartera de contratos vigentes", descripcion: "Inmueble, locadores, destino, canon neto de IVA (R16), regla de actualización, expediente." },
  { codigo: "RP-09", href: "/alquileres/reportes/calidad-datos", titulo: "RP-09 — Calidad de datos", descripcion: "Actuaciones sin firmante, sin condición de IVA, sin mail del locador; inmuebles sin partida; personas duplicadas." },
  { codigo: "RP-10", href: "/alquileres/reportes/actividad", titulo: "RP-10 — Actividad y cambios", descripcion: "Quién modificó qué y cuándo (LOG_CAMBIOS) — altas, modificaciones, bajas y conflictos de versión." },
];

/**
 * Reportes (RF-41 ítem de menú + sección 9 del PRD v1, RP-01 a RP-12).
 * Esta Fase 4 construyó 4 de los 12 (ver `docs/PROGRESO.md` para el resto,
 * pendiente) — los más directamente ligados al criterio de cierre de la
 * fase ("las cifras de los reportes coinciden con el dashboard") y el que
 * valida RF-38/LOG_CAMBIOS (recién conectado en esta misma tarea).
 */
export default async function AlquileresReportesPage() {
  const session = await auth();
  const rol = session?.user?.rolAlquileres;
  const visibles = REPORTES.filter((r) => puedeVerReporte(rol, r.codigo));

  return (
    <AppShell titulo="Reportes — Alquileres">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Reportes</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        RP-01 a RP-12 (PRD v1, sección 9) — se muestran solo los que tu rol puede ver.
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {visibles.map((r) => (
          <Link
            key={r.codigo}
            href={r.href}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4.5 shadow-[var(--shadow-sm)] transition-colors hover:border-brand-blue-500"
          >
            <div className="mb-1 font-[var(--font-display)] text-[var(--text-md)] font-bold">{r.titulo}</div>
            <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">{r.descripcion}</p>
          </Link>
        ))}
      </div>

      {visibles.length === 0 && <p className="text-[var(--color-text-muted)]">Tu rol no tiene acceso a ningún reporte.</p>}
    </AppShell>
  );
}
