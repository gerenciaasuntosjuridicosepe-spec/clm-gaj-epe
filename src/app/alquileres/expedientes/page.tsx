import { AppShell } from "@/components/layout/app-shell";
import { AlquileresExpedientesClient } from "@/components/pages/alquileres-expedientes-client";
import { getRepositorioExpedientes } from "@/lib/alquileres/datos/expedientes";
import { getRepositorioInmuebles } from "@/lib/alquileres/datos/inmuebles";
import { puedeAlquileres, MATRIZ_GESTION } from "@/lib/alquileres/permisos";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/** RF-07/RF-08 — Expedientes del módulo de Alquileres. El acceso al módulo ya lo filtra el proxy (T19). */
export default async function AlquileresExpedientesPage() {
  const session = await auth();
  const rol = session?.user?.rolAlquileres;
  const [expedientes, inmuebles] = await Promise.all([
    getRepositorioExpedientes().listar(),
    getRepositorioInmuebles().listar(),
  ]);

  return (
    <AppShell titulo="Expedientes">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Expedientes</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Expediente administrativo: pertenece a un solo inmueble (R2); un expediente reúne varias actuaciones.
      </p>

      <AlquileresExpedientesClient
        expedientesIniciales={expedientes}
        inmuebles={inmuebles}
        puedeCrear={puedeAlquileres(rol, "crear", MATRIZ_GESTION)}
      />
    </AppShell>
  );
}
