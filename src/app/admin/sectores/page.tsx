import { AppShell } from "@/components/layout/app-shell";
import { AdminSectoresClient } from "@/components/pages/admin-sectores-client";
import { listarSectores, listarTiposContrato } from "@/lib/data/catalogos-provider";

// Los catálogos se administran en vivo (alta de sectores, reasignación por tipo) — no cachear en build.
export const dynamic = "force-dynamic";

/**
 * Biblioteca de sectores emisores de Acto Administrativo — PRD sección 4.3.
 * Único punto del flujo de aprobación que varía según el Tipo de contrato
 * (sección 6.2).
 */
export default async function SectoresPage() {
  const [sectores, tipos] = await Promise.all([listarSectores(), listarTiposContrato()]);

  return (
    <AppShell titulo="Biblioteca de sectores">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Biblioteca de sectores</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Asignación de sector/Directorio que emite el Acto Administrativo, por Tipo de contrato (PRD 4.3)
      </p>

      <AdminSectoresClient sectoresIniciales={sectores} tiposIniciales={tipos} />
    </AppShell>
  );
}
