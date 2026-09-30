import { AppShell } from "@/components/layout/app-shell";
import { NuevaSolicitudForm } from "@/components/pages/nueva-solicitud-form";
import { listarTiposContrato } from "@/lib/data/catalogos-provider";

// El catálogo de tipos de contrato se administra en vivo — no cachear en build.
export const dynamic = "force-dynamic";

export default async function NuevaSolicitudPage() {
  const tipos = await listarTiposContrato();

  return (
    <AppShell titulo="Nueva solicitud">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Nueva solicitud</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Formulario de intake único, común a todos los tipos de contrato en esta v1
      </p>

      <NuevaSolicitudForm tiposContrato={tipos.map((t) => t.nombre)} />
    </AppShell>
  );
}
