"use client";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/domain/alert";
import { Usuario } from "@/lib/data/mock-catalogos";
import { ROLES, ROLES_LISTA } from "@/lib/permisos";
import { RolId } from "@/lib/types";

type FormUsuario = { nombre: string; email: string; rolId: RolId; area: string };

const FORM_VACIO: FormUsuario = { nombre: "", email: "", rolId: ROLES_LISTA[0].id, area: "" };

/**
 * Usuarios y roles (PRD 3/6.7) — el email cargado acá es lo que habilita el
 * login con Google (ver src/auth.ts / usuarios-provider.ts): si un email no
 * está en esta lista, Google lo autentica pero el CLM le niega el acceso.
 */
export function AdminUsuariosClient({ usuariosIniciales }: { usuariosIniciales: Usuario[] }) {
  const [usuarios, setUsuarios] = React.useState(usuariosIniciales);
  const [error, setError] = React.useState<string | null>(null);

  const [agregando, setAgregando] = React.useState(false);
  const [formNuevo, setFormNuevo] = React.useState<FormUsuario>(FORM_VACIO);
  const [guardandoNuevo, setGuardandoNuevo] = React.useState(false);

  const [editandoId, setEditandoId] = React.useState<string | null>(null);
  const [formEdit, setFormEdit] = React.useState<FormUsuario>(FORM_VACIO);
  const [guardandoEdicion, setGuardandoEdicion] = React.useState(false);

  async function agregar() {
    if (!formNuevo.nombre.trim() || !formNuevo.email.trim()) return;
    setGuardandoNuevo(true);
    setError(null);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formNuevo),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo crear el usuario.");
      }
      const creado = (await res.json()) as Usuario;
      setUsuarios([...usuarios, creado]);
      setFormNuevo(FORM_VACIO);
      setAgregando(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el usuario.");
    } finally {
      setGuardandoNuevo(false);
    }
  }

  function empezarEdicion(u: Usuario) {
    setEditandoId(u.id);
    setFormEdit({ nombre: u.nombre, email: u.email, rolId: u.rolId as RolId, area: u.area ?? "" });
  }

  async function guardarEdicion(id: string) {
    if (!formEdit.nombre.trim() || !formEdit.email.trim()) return;
    setGuardandoEdicion(true);
    setError(null);
    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formEdit),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo actualizar el usuario.");
      }
      const actualizado = (await res.json()) as Usuario;
      setUsuarios(usuarios.map((u) => (u.id === id ? actualizado : u)));
      setEditandoId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el usuario.");
    } finally {
      setGuardandoEdicion(false);
    }
  }

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-3.5">
          <h3 className="font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">
            {usuarios.length} usuarios
          </h3>
          {!agregando && (
            <Button size="sm" variant="orange" onClick={() => setAgregando(true)}>+ Nuevo usuario</Button>
          )}
        </div>

        {agregando && (
          <div className="flex flex-wrap items-end gap-3 border-b border-[var(--color-border)] bg-surface p-3.5">
            <CampoForm label="Nombre">
              <Input autoFocus value={formNuevo.nombre} onChange={(e) => setFormNuevo({ ...formNuevo, nombre: e.target.value })} />
            </CampoForm>
            <CampoForm label="Email (Google)">
              <Input type="email" value={formNuevo.email} onChange={(e) => setFormNuevo({ ...formNuevo, email: e.target.value })} placeholder="nombre@dominio.com" />
            </CampoForm>
            <CampoForm label="Rol">
              <Select value={formNuevo.rolId} onChange={(e) => setFormNuevo({ ...formNuevo, rolId: e.target.value as RolId })}>
                {ROLES_LISTA.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </Select>
            </CampoForm>
            <CampoForm label="Área (opcional)">
              <Input value={formNuevo.area} onChange={(e) => setFormNuevo({ ...formNuevo, area: e.target.value })} />
            </CampoForm>
            <div className="flex gap-2 pb-0.5">
              <Button size="sm" variant="primary" onClick={agregar} disabled={guardandoNuevo || !formNuevo.nombre.trim() || !formNuevo.email.trim()}>
                {guardandoNuevo ? "Guardando…" : "Guardar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setAgregando(false); setFormNuevo(FORM_VACIO); }}>Cancelar</Button>
            </div>
          </div>
        )}

        <table className="w-full text-[var(--text-base)]">
          <thead>
            <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
              <th className="px-3.5 py-2.5">Nombre</th>
              <th className="px-3.5 py-2.5">Email</th>
              <th className="px-3.5 py-2.5">Rol</th>
              <th className="px-3.5 py-2.5">Área</th>
              <th className="px-3.5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-[var(--color-border)] last:border-b-0">
                {editandoId === u.id ? (
                  <>
                    <td className="px-3.5 py-2.5"><Input value={formEdit.nombre} onChange={(e) => setFormEdit({ ...formEdit, nombre: e.target.value })} /></td>
                    <td className="px-3.5 py-2.5"><Input type="email" value={formEdit.email} onChange={(e) => setFormEdit({ ...formEdit, email: e.target.value })} /></td>
                    <td className="px-3.5 py-2.5">
                      <Select value={formEdit.rolId} onChange={(e) => setFormEdit({ ...formEdit, rolId: e.target.value as RolId })}>
                        {ROLES_LISTA.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </Select>
                    </td>
                    <td className="px-3.5 py-2.5"><Input value={formEdit.area} onChange={(e) => setFormEdit({ ...formEdit, area: e.target.value })} /></td>
                    <td className="px-3.5 py-2.5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="xs" variant="ghost" onClick={() => setEditandoId(null)}>Cancelar</Button>
                        <Button size="xs" variant="primary" onClick={() => guardarEdicion(u.id)} disabled={guardandoEdicion}>
                          {guardandoEdicion ? "Guardando…" : "Guardar"}
                        </Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3.5 py-2.5 font-medium">{u.nombre}</td>
                    <td className="px-3.5 py-2.5 text-[var(--color-text-secondary)]">{u.email}</td>
                    <td className="px-3.5 py-2.5">
                      <Badge variant="blue">{ROLES[u.rolId as RolId]?.nombre ?? u.rolId}</Badge>
                    </td>
                    <td className="px-3.5 py-2.5">{u.area ?? "—"}</td>
                    <td className="px-3.5 py-2.5 text-right">
                      <Button size="xs" variant="ghost" onClick={() => empezarEdicion(u)}>Editar</Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CampoForm({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-[160px]">
      <label className="mb-1 block text-[var(--text-2xs)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
        {label}
      </label>
      {children}
    </div>
  );
}
