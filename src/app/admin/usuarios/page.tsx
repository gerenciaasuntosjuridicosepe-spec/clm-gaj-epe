import { AppShell } from "@/components/layout/app-shell";
import { AdminUsuariosClient } from "@/components/pages/admin-usuarios-client";
import { listarUsuarios } from "@/lib/data/usuarios-provider";

export const dynamic = "force-dynamic";

/** Usuarios y roles — PRD sección 3/6.7: gestión propia del CLM, sin SSO. */
export default async function UsuariosPage() {
  const usuarios = await listarUsuarios();

  return (
    <AppShell titulo="Usuarios y roles">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Usuarios y roles</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Gestión de usuarios dentro del propio CLM — no hay directorio corporativo a integrar (PRD sección 3). El
        email cargado acá es el que habilita el login con Google.
      </p>

      <AdminUsuariosClient usuariosIniciales={usuarios} />
    </AppShell>
  );
}
