"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/domain/alert";
import type { Expediente, Inmueble } from "@/lib/alquileres/tipos";

/** Expedientes (RF-07/RF-08) — listado + alta rápida, con los dos formatos de numeración (T11). */
export function AlquileresExpedientesClient({
  expedientesIniciales,
  inmuebles,
  puedeCrear,
}: {
  expedientesIniciales: Expediente[];
  inmuebles: Inmueble[];
  puedeCrear: boolean;
}) {
  const [expedientes, setExpedientes] = React.useState(expedientesIniciales);
  const [error, setError] = React.useState<string | null>(null);
  const [mostrandoForm, setMostrandoForm] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [inmuebleId, setInmuebleId] = React.useState("");
  const [nroExpediente, setNroExpediente] = React.useState("");

  async function crear() {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/alquileres/expedientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inmuebleId, nroExpediente }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear el expediente.");
      setExpedientes([data as Expediente, ...expedientes]);
      setInmuebleId("");
      setNroExpediente("");
      setMostrandoForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el expediente.");
    } finally {
      setGuardando(false);
    }
  }

  function domicilioDe(inmuebleIdBuscado: string): string {
    return inmuebles.find((i) => i.inmuebleId === inmuebleIdBuscado)?.domicilio ?? inmuebleIdBuscado;
  }

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}

      {puedeCrear && (
        <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4.5 shadow-[var(--shadow-sm)]">
          {mostrandoForm ? (
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="mb-1 block text-[var(--text-xs)] font-semibold text-[var(--color-text-secondary)]">Inmueble (ID) *</label>
                <select
                  value={inmuebleId}
                  onChange={(e) => setInmuebleId(e.target.value)}
                  className="h-9 w-[260px] rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 text-[var(--text-sm)]"
                >
                  <option value="">Elegir inmueble…</option>
                  {inmuebles.map((i) => (
                    <option key={i.inmuebleId} value={i.inmuebleId}>
                      {i.inmuebleId} — {i.domicilio}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[var(--text-xs)] font-semibold text-[var(--color-text-secondary)]">
                  Nº de expediente *
                </label>
                <Input
                  value={nroExpediente}
                  onChange={(e) => setNroExpediente(e.target.value)}
                  placeholder="1-2020-966273 o EE-2026-00045698-APPSF-OD"
                  className="w-[300px]"
                />
              </div>
              <Button size="sm" variant="primary" onClick={crear} disabled={guardando || !inmuebleId || !nroExpediente.trim()}>
                {guardando ? "Guardando…" : "Guardar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMostrandoForm(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="primary" onClick={() => setMostrandoForm(true)}>
              + Nuevo expediente
            </Button>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <table className="w-full text-[var(--text-base)]">
          <thead>
            <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
              <th className="px-3.5 py-2.5">ID</th>
              <th className="px-3.5 py-2.5">Nº de expediente</th>
              <th className="px-3.5 py-2.5">Inmueble</th>
            </tr>
          </thead>
          <tbody>
            {expedientes.map((e) => (
              <tr key={e.expedienteId} className="border-b border-[var(--color-border)] last:border-b-0">
                <td className="px-3.5 py-2.5 font-mono text-[var(--text-sm)]">{e.expedienteId}</td>
                <td className="px-3.5 py-2.5 font-medium">{e.nroExpediente}</td>
                <td className="px-3.5 py-2.5">{domicilioDe(e.inmuebleId)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {expedientes.length === 0 && (
          <p className="p-4.5 text-[var(--color-text-muted)]">Todavía no hay expedientes cargados.</p>
        )}
      </div>
    </>
  );
}
