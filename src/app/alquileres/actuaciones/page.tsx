import { AppShell } from "@/components/layout/app-shell";
import { AlquileresActuacionesClient } from "@/components/pages/alquileres-actuaciones-client";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioInmuebles } from "@/lib/alquileres/datos/inmuebles";
import { puedeAlquileres, MATRIZ_GESTION } from "@/lib/alquileres/permisos";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/** RF-11 — Actuaciones del módulo de Alquileres (alta rápida; la formalización guiada, RF-12, queda para Fase 2/3). */
export default async function AlquileresActuacionesPage() {
  const session = await auth();
  const rol = session?.user?.rolAlquileres;
  const [actuaciones, inmuebles] = await Promise.all([
    getRepositorioActuaciones().listar(),
    getRepositorioInmuebles().listar(),
  ]);

  return (
    <AppShell titulo="Actuaciones">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Actuaciones</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Gestión sobre un inmueble: CONTRATO (inicial o renovación), ADENDA o LEGITIMO_ABONO.
      </p>

      <AlquileresActuacionesClient
        actuacionesIniciales={actuaciones}
        inmuebles={inmuebles}
        puedeCrear={puedeAlquileres(rol, "crear", MATRIZ_GESTION)}
      />
    </AppShell>
  );
}
