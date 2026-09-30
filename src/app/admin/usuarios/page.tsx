"use client";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_USUARIOS } from "@/lib/data/mock-catalogos";
import { ROLES } from "@/lib/permisos";
import { RolId } from "@/lib/types";

/** Usuarios y roles — PRD sección 3/6.7: gestión propia del CLM, sin SSO. */
export default function UsuariosPage() {
  return (
    <AppShell titulo="Usuarios y roles">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Usuarios y roles</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Gestión de usuarios dentro del propio CLM — no hay directorio corporativo a integrar (PRD sección 3)
      </p>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-3.5">
          <h3 className="font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">
            {MOCK_USUARIOS.length} usuarios
          </h3>
          <Button size="sm" variant="orange">+ Nuevo usuario</Button>
        </div>
        <table className="w-full text-[var(--text-base)]">
          <thead>
            <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
              <th className="px-3.5 py-2.5">Nombre</th>
              <th className="px-3.5 py-2.5">Rol</th>
              <th className="px-3.5 py-2.5">Área</th>
              <th className="px-3.5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {MOCK_USUARIOS.map((u) => (
              <tr key={u.id} className="border-b border-[var(--color-border)] last:border-b-0">
                <td className="px-3.5 py-2.5 font-medium">{u.nombre}</td>
                <td className="px-3.5 py-2.5">
                  <Badge variant="blue">{ROLES[u.rolId as RolId]?.nombre ?? u.rolId}</Badge>
                </td>
                <td className="px-3.5 py-2.5">{u.area ?? "—"}</td>
                <td className="px-3.5 py-2.5 text-right">
                  <Button size="xs" variant="ghost">Editar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
