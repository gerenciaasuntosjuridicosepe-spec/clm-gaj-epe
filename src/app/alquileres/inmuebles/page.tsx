import { AppShell } from "@/components/layout/app-shell";
import { AlquileresInmueblesClient } from "@/components/pages/alquileres-inmuebles-client";
import { getRepositorioInmuebles } from "@/lib/alquileres/datos/inmuebles";
import { puedeAlquileres, MATRIZ_GESTION } from "@/lib/alquileres/permisos";
import { auth } from "@/auth";

// Los datos vienen de Sheets/mock y cambian en cualquier momento; no tiene sentido cachear esta página en build time.
export const dynamic = "force-dynamic";

/**
 * RF-05/RF-06 — Inmuebles del módulo de Alquileres. El acceso al módulo ya
 * lo filtra el proxy (callback `authorized` de src/auth.ts, T19): si se
 * llega hasta acá es porque la sesión tiene `rolAlquileres`. Esta página
 * solo decide qué botones mostrar según la matriz de permisos (el servidor
 * en /api/alquileres/inmuebles vuelve a exigirlo, no es solo cosmético).
 */
export default async function AlquileresInmueblesPage() {
  const session = await auth();
  const rol = session?.user?.rolAlquileres;
  const inmuebles = await getRepositorioInmuebles().listar();

  return (
    <AppShell titulo="Inmuebles">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Inmuebles</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Raíz del modelo del módulo: Inmueble → Expediente → Actuación.
      </p>

      <AlquileresInmueblesClient
        inmueblesIniciales={inmuebles}
        puedeCrear={puedeAlquileres(rol, "crear", MATRIZ_GESTION)}
      />
    </AppShell>
  );
}
