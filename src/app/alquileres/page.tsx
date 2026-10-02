import { AppShell } from "@/components/layout/app-shell";
import { AlquileresDashboardClient } from "@/components/pages/alquileres-dashboard-client";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioActuacionHitos } from "@/lib/alquileres/datos/actuacion-hitos";
import { calcularDashboard } from "@/lib/alquileres/reglas/dashboard";
import { CFG_HITOS_TIPO_SEED } from "@/lib/alquileres/catalogos/hitos-seed";
import { numeroParametro, PARAMETROS_SEED } from "@/lib/alquileres/catalogos/parametros-seed";
import { hoy } from "@/lib/alquileres/fechas";

export const dynamic = "force-dynamic";

/**
 * Dashboard del módulo (RF-40/sección 8 del PRD v1) — página de inicio de
 * Alquileres. Nota de alcance (Fase 2): varios indicadores dependen de
 * `fecha_fin` (situación de vigencia, semáforo, canon), que recién se
 * carga al formalizar una actuación (RF-12, todavía no construido) — con
 * los datos de prueba de esta fase (altas rápidas, RF-11) esos
 * indicadores dan 0, correctamente (no es un bug: no hay ningún contrato
 * formalizado todavía para contar).
 */
export default async function AlquileresDashboardPage() {
  const [actuaciones, hitos] = await Promise.all([
    getRepositorioActuaciones().listar(),
    getRepositorioActuacionHitos().listar(),
  ]);

  const { resumen, colaDeTrabajo } = calcularDashboard({
    actuaciones,
    hitos,
    documentos: [], // sin ABM de Documentos todavía (Fase 3) — A6 da 0 hasta entonces, correcto.
    cfgHitosTipo: CFG_HITOS_TIPO_SEED,
    hoy: hoy(),
    alicuotaIva: numeroParametro(PARAMETROS_SEED, "alicuota_iva", 21),
  });

  return (
    <AppShell titulo="Dashboard — Alquileres">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Dashboard</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Qué está en riesgo hoy, qué vence en los próximos meses y qué hay que hacer (PRD v1, sección 8).
      </p>

      <AlquileresDashboardClient resumen={resumen} colaDeTrabajo={colaDeTrabajo} />
    </AppShell>
  );
}
