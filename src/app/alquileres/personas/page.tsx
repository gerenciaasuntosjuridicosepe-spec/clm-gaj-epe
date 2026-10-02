import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/domain/alert";
import { AlquileresPersonasClient } from "@/components/pages/alquileres-personas-client";
import { getRepositorioPersonas } from "@/lib/alquileres/datos/personas";
import { puedeAlquileres, MATRIZ_PERSONAS } from "@/lib/alquileres/permisos";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/**
 * RF-09 — Personas (locadores). Matriz de permisos: LECTOR no tiene NI
 * SIQUIERA "leer" acá (dato personal, PRD v1 sección 3: "—" en la columna
 * de Personas) — a diferencia de Inmuebles/Expedientes. Por eso la página
 * misma (que llama al repositorio directo, sin pasar por la ruta de API
 * que sí tiene esta guardia) chequea el permiso ANTES de leer la tabla:
 * no alcanza con ocultar botones si de todos modos se trae la lista
 * completa al Server Component.
 */
export default async function AlquileresPersonasPage() {
  const session = await auth();
  const rol = session?.user?.rolAlquileres;

  if (!puedeAlquileres(rol, "leer", MATRIZ_PERSONAS)) {
    return (
      <AppShell titulo="Personas">
        <Alert variant="warning">Tu rol no tiene acceso a los datos de personas (locadores).</Alert>
      </AppShell>
    );
  }

  const personas = await getRepositorioPersonas().listar();

  return (
    <AppShell titulo="Personas">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Personas</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Locadores y otras personas (humanas, jurídicas o sucesiones) — se reutilizan entre actuaciones (R9).
      </p>

      <AlquileresPersonasClient
        personasIniciales={personas}
        puedeCrear={puedeAlquileres(rol, "crear", MATRIZ_PERSONAS)}
      />
    </AppShell>
  );
}
