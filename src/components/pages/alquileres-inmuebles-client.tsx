"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/domain/alert";
import type { Inmueble } from "@/lib/alquileres/tipos";

/**
 * Inmuebles (RF-05/RF-06) — listado + alta rápida. La edición/baja y la
 * línea de tiempo de actuaciones quedan para cuando exista la ficha del
 * inmueble (Fase 2, junto con el calendario/dashboard). El servidor es la
 * única barrera real de permisos (ver /api/alquileres/inmuebles); acá solo
 * se oculta el formulario de alta para roles que de todos modos el
 * servidor rechazaría, por prolijidad de UI.
 */
export function AlquileresInmueblesClient({
  inmueblesIniciales,
  puedeCrear,
}: {
  inmueblesIniciales: Inmueble[];
  puedeCrear: boolean;
}) {
  const [inmuebles, setInmuebles] = React.useState(inmueblesIniciales);
  const [error, setError] = React.useState<string | null>(null);
  const [mostrandoForm, setMostrandoForm] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [domicilio, setDomicilio] = React.useState("");
  const [localidadId, setLocalidadId] = React.useState("");
  const [partida, setPartida] = React.useState("");

  async function crear() {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/alquileres/inmuebles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domicilio, localidadId, partidaInmobiliaria: partida || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear el inmueble.");
      setInmuebles([data as Inmueble, ...inmuebles]);
      setDomicilio("");
      setLocalidadId("");
      setPartida("");
      setMostrandoForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el inmueble.");
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
                <label className="mb-1 block text-[var(--text-xs)] font-semibold text-[var(--color-text-secondary)]">Domicilio *</label>
                <Input value={domicilio} onChange={(e) => setDomicilio(e.target.value)} className="w-[260px]" />
              </div>
              <div>
                <label className="mb-1 block text-[var(--text-xs)] font-semibold text-[var(--color-text-secondary)]">Localidad (ID) *</label>
                <Input value={localidadId} onChange={(e) => setLocalidadId(e.target.value)} className="w-[160px]" />
              </div>
              <div>
                <label className="mb-1 block text-[var(--text-xs)] font-semibold text-[var(--color-text-secondary)]">
                  Partida inmobiliaria
                </label>
                <Input
                  value={partida}
                  onChange={(e) => setPartida(e.target.value)}
                  placeholder="NN-NN-NN-NNNNNN/NNNN-N"
                  className="w-[220px]"
                />
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={crear}
                disabled={guardando || !domicilio.trim() || !localidadId.trim()}
              >
                {guardando ? "Guardando…" : "Guardar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMostrandoForm(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="primary" onClick={() => setMostrandoForm(true)}>
              + Nuevo inmueble
            </Button>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <table className="w-full text-[var(--text-base)]">
          <thead>
            <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
              <th className="px-3.5 py-2.5">ID</th>
              <th className="px-3.5 py-2.5">Domicilio</th>
              <th className="px-3.5 py-2.5">Localidad</th>
              <th className="px-3.5 py-2.5">Partida</th>
            </tr>
          </thead>
          <tbody>
            {inmuebles.map((i) => (
              <tr key={i.inmuebleId} className="border-b border-[var(--color-border)] last:border-b-0">
                <td className="px-3.5 py-2.5 font-mono text-[var(--text-sm)]">{i.inmuebleId}</td>
                <td className="px-3.5 py-2.5 font-medium">{i.domicilio}</td>
                <td className="px-3.5 py-2.5">{i.localidadId}</td>
                <td className="px-3.5 py-2.5">{i.partidaInmobiliaria ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {inmuebles.length === 0 && (
          <p className="p-4.5 text-[var(--color-text-muted)]">Todavía no hay inmuebles cargados.</p>
        )}
      </div>
    </>
  );
}
