import { AppShell } from "@/components/layout/app-shell";
import { AlquileresAlertasClient } from "@/components/pages/alquileres-alertas-client";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioActuacionHitos } from "@/lib/alquileres/datos/actuacion-hitos";
import { getRepositorioDocumentos } from "@/lib/alquileres/datos/documentos";
import { calcularDashboard } from "@/lib/alquileres/reglas/dashboard";
import { CFG_HITOS_TIPO_SEED } from "@/lib/alquileres/catalogos/hitos-seed";
import { numeroParametro, PARAMETROS_SEED } from "@/lib/alquileres/catalogos/parametros-seed";
import { hoy } from "@/lib/alquileres/fechas";

export const dynamic = "force-dynamic";

/**
 * Alertas (PRD v1 sección 6 + menú RF-41) — vista propia y filtrable de
 * A1/A4/A5/A6 (ver nota de alcance en `alquileres-alertas-client.tsx`).
 * Reutiliza `calcularDashboard` (ya probado en `reglas/dashboard.test.ts`)
 * en vez de recalcular nada acá.
 */
export default async function AlquileresAlertasPage() {
  const [actuaciones, hitos, documentos] = await Promise.all([
    getRepositorioActuaciones().listar(),
    getRepositorioActuacionHitos().listar(),
    getRepositorioDocumentos().listar(),
  ]);

  const { colaDeTrabajo } = calcularDashboard({
    actuaciones,
    hitos,
    documentos,
    cfgHitosTipo: CFG_HITOS_TIPO_SEED,
    hoy: hoy(),
    alicuotaIva: numeroParametro(PARAMETROS_SEED, "alicuota_iva", 21),
  });

  return (
    <AppShell titulo="Alertas — Alquileres">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Alertas</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Todo lo que necesita acción, filtrable por tipo (PRD v1, sección 6).
      </p>

      <AlquileresAlertasClient colaDeTrabajo={colaDeTrabajo} />
    </AppShell>
  );
}
