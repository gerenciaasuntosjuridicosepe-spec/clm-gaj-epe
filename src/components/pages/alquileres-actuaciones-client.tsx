"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/domain/alert";
import { Badge } from "@/components/ui/badge";
import type { Actuacion, Inmueble, TipoActuacion } from "@/lib/alquileres/tipos";

const TIPOS: TipoActuacion[] = ["CONTRATO", "ADENDA", "LEGITIMO_ABONO"];

/** Actuaciones (RF-11) — listado + alta rápida (tipo, inmueble, sector). La formalización guiada (RF-12) queda para Fase 2/3. */
export function AlquileresActuacionesClient({
  actuacionesIniciales,
  inmuebles,
  puedeCrear,
  puedeGenerarBorrador,
}: {
  actuacionesIniciales: Actuacion[];
  inmuebles: Inmueble[];
  puedeCrear: boolean;
  /** RF-25/26/27 (decisión 2026-10-03, ver docs/DECISIONES.md): mismo permiso que ver documentos (`MATRIZ_DOCUMENTOS`, acción "leer") — generar un borrador no persiste nada, es equivalente a leer. */
  puedeGenerarBorrador: boolean;
}) {
  const [actuaciones, setActuaciones] = React.useState(actuacionesIniciales);
  const [error, setError] = React.useState<string | null>(null);
  const [mostrandoForm, setMostrandoForm] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [tipoActuacion, setTipoActuacion] = React.useState<TipoActuacion>("CONTRATO");
  const [inmuebleId, setInmuebleId] = React.useState("");
  const [sectorInteresadoAreaId, setSectorInteresadoAreaId] = React.useState("");

  async function crear() {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/alquileres/actuaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipoActuacion, inmuebleId, sectorInteresadoAreaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear la actuación.");
      setActuaciones([data as Actuacion, ...actuaciones]);
      setInmuebleId("");
      setSectorInteresadoAreaId("");
      setMostrandoForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la actuación.");
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
                <label className="mb-1 block text-[var(--text-xs)] font-semibold text-[var(--color-text-secondary)]">Tipo *</label>
                <select
                  value={tipoActuacion}
                  onChange={(e) => setTipoActuacion(e.target.value as TipoActuacion)}
                  className="h-9 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 text-[var(--text-sm)]"
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[var(--text-xs)] font-semibold text-[var(--color-text-secondary)]">Inmueble *</label>
                <select
                  value={inmuebleId}
                  onChange={(e) => setInmuebleId(e.target.value)}
                  className="h-9 w-[240px] rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 text-[var(--text-sm)]"
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
                  Sector interesado (ID de área) *
                </label>
                <input
                  value={sectorInteresadoAreaId}
                  onChange={(e) => setSectorInteresadoAreaId(e.target.value)}
                  placeholder="AR-06"
                  className="h-9 w-[140px] rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 text-[var(--text-sm)]"
                />
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={crear}
                disabled={guardando || !inmuebleId || !sectorInteresadoAreaId.trim()}
              >
                {guardando ? "Guardando…" : "Guardar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMostrandoForm(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="primary" onClick={() => setMostrandoForm(true)}>
              + Nueva actuación
            </Button>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <table className="w-full text-[var(--text-base)]">
          <thead>
            <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
              <th className="px-3.5 py-2.5">ID</th>
              <th className="px-3.5 py-2.5">Tipo</th>
              <th className="px-3.5 py-2.5">Inmueble</th>
              <th className="px-3.5 py-2.5">Estado</th>
              {puedeGenerarBorrador && <th className="px-3.5 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {actuaciones.map((a) => (
              <tr key={a.actuacionId} className="border-b border-[var(--color-border)] last:border-b-0">
                <td className="px-3.5 py-2.5 font-mono text-[var(--text-sm)]">{a.actuacionId}</td>
                <td className="px-3.5 py-2.5">{a.tipoActuacion}</td>
                <td className="px-3.5 py-2.5">{domicilioDe(a.inmuebleId)}</td>
                <td className="px-3.5 py-2.5">
                  <Badge variant={a.estadoActuacion === "FORMALIZADA" || a.estadoActuacion === "CERRADA" ? "blue" : "warning"}>
                    {a.estadoActuacion}
                  </Badge>
                </td>
                {puedeGenerarBorrador && (
                  <td className="px-3.5 py-2.5 text-right">
                    <Button size="xs" variant="ghost" asChild>
                      <a href={`/api/alquileres/actuaciones/${a.actuacionId}/documentos/generar-contrato`}>
                        Generar borrador (.docx)
                      </a>
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {actuaciones.length === 0 && (
          <p className="p-4.5 text-[var(--color-text-muted)]">Todavía no hay actuaciones cargadas.</p>
        )}
      </div>
    </>
  );
}
