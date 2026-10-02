"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/domain/alert";
import type { Persona, TipoPersona } from "@/lib/alquileres/tipos";

const TIPOS_PERSONA: TipoPersona[] = ["FISICA", "JURIDICA", "SUCESION"];

/** Personas/locadores (RF-09) — listado + alta con búsqueda previa por documento (R9, del lado del servidor). */
export function AlquileresPersonasClient({
  personasIniciales,
  puedeCrear,
}: {
  personasIniciales: Persona[];
  puedeCrear: boolean;
}) {
  const [personas, setPersonas] = React.useState(personasIniciales);
  const [error, setError] = React.useState<string | null>(null);
  const [mostrandoForm, setMostrandoForm] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [nombre, setNombre] = React.useState("");
  const [tipoPersona, setTipoPersona] = React.useState<TipoPersona>("FISICA");
  const [dni, setDni] = React.useState("");
  const [cuit, setCuit] = React.useState("");

  async function crear() {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/alquileres/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apellidoNombreRazonSocial: nombre,
          tipoPersona,
          dni: dni || undefined,
          cuitCuil: cuit || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear la persona.");
      setPersonas([data as Persona, ...personas]);
      setNombre("");
      setDni("");
      setCuit("");
      setMostrandoForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la persona.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}

      {puedeCrear && (
        <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4.5 shadow-[var(--shadow-sm)]">
          {mostrandoForm ? (
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="mb-1 block text-[var(--text-xs)] font-semibold text-[var(--color-text-secondary)]">
                  Nombre / razón social *
                </label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-[240px]" />
              </div>
              <div>
                <label className="mb-1 block text-[var(--text-xs)] font-semibold text-[var(--color-text-secondary)]">Tipo *</label>
                <select
                  value={tipoPersona}
                  onChange={(e) => setTipoPersona(e.target.value as TipoPersona)}
                  className="h-9 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 text-[var(--text-sm)]"
                >
                  {TIPOS_PERSONA.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[var(--text-xs)] font-semibold text-[var(--color-text-secondary)]">DNI</label>
                <Input value={dni} onChange={(e) => setDni(e.target.value)} className="w-[120px]" />
              </div>
              <div>
                <label className="mb-1 block text-[var(--text-xs)] font-semibold text-[var(--color-text-secondary)]">CUIT/CUIL</label>
                <Input value={cuit} onChange={(e) => setCuit(e.target.value)} placeholder="NN-NNNNNNNN-N" className="w-[160px]" />
              </div>
              <Button size="sm" variant="primary" onClick={crear} disabled={guardando || !nombre.trim()}>
                {guardando ? "Guardando…" : "Guardar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMostrandoForm(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="primary" onClick={() => setMostrandoForm(true)}>
              + Nueva persona
            </Button>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <table className="w-full text-[var(--text-base)]">
          <thead>
            <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
              <th className="px-3.5 py-2.5">ID</th>
              <th className="px-3.5 py-2.5">Nombre / razón social</th>
              <th className="px-3.5 py-2.5">Tipo</th>
              <th className="px-3.5 py-2.5">DNI</th>
              <th className="px-3.5 py-2.5">CUIT/CUIL</th>
            </tr>
          </thead>
          <tbody>
            {personas.map((p) => (
              <tr key={p.personaId} className="border-b border-[var(--color-border)] last:border-b-0">
                <td className="px-3.5 py-2.5 font-mono text-[var(--text-sm)]">{p.personaId}</td>
                <td className="px-3.5 py-2.5 font-medium">{p.apellidoNombreRazonSocial}</td>
                <td className="px-3.5 py-2.5">{p.tipoPersona}</td>
                <td className="px-3.5 py-2.5">{p.dni ?? "—"}</td>
                <td className="px-3.5 py-2.5">{p.cuitCuil ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {personas.length === 0 && (
          <p className="p-4.5 text-[var(--color-text-muted)]">Todavía no hay personas cargadas.</p>
        )}
      </div>
    </>
  );
}
