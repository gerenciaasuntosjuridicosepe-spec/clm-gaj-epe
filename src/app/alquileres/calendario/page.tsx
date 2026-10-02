import { AppShell } from "@/components/layout/app-shell";
import { AlquileresCalendarioClient } from "@/components/pages/alquileres-calendario-client";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioActuacionHitos } from "@/lib/alquileres/datos/actuacion-hitos";
import { construirEventosCalendarioAlquileres } from "@/lib/alquileres/reglas/calendario";
import { hoy } from "@/lib/alquileres/fechas";

export const dynamic = "force-dynamic";

/** RF-40 — Calendario propio del módulo: vencimientos efectivos (R15) e hitos previstos, con semáforo (C3). */
export default async function AlquileresCalendarioPage() {
  const [actuaciones, hitos] = await Promise.all([
    getRepositorioActuaciones().listar(),
    getRepositorioActuacionHitos().listar(),
  ]);

  const eventos = construirEventosCalendarioAlquileres(actuaciones, hitos, hoy());

  return (
    <AppShell titulo="Calendario — Alquileres">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Calendario</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Vencimientos efectivos e hitos previstos, con semáforo (PRD v2.1, RF-40).
      </p>

      <AlquileresCalendarioClient eventos={eventos} />
    </AppShell>
  );
}
