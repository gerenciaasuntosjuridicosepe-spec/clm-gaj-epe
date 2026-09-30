"use client";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/domain/alert";
import { SectorEmisor } from "@/lib/data/mock-catalogos";
import { TipoContratoItem } from "@/lib/data/catalogos-provider";

/**
 * Biblioteca de sectores (PRD 4.3): alta de sectores/Directorio + asignación
 * de sector emisor por tipo de contrato. Dos escrituras separadas: crear
 * sector pega a /api/catalogos/sectores, reasignar pega a
 * /api/catalogos/tipos-contrato/asignacion (el nombre del tipo de contrato
 * no cambia acá, ver admin/tipos-contrato para renombrarlo).
 */
export function AdminSectoresClient({
  sectoresIniciales,
  tiposIniciales,
}: {
  sectoresIniciales: SectorEmisor[];
  tiposIniciales: TipoContratoItem[];
}) {
  const [sectores, setSectores] = React.useState(sectoresIniciales);
  const [tipos, setTipos] = React.useState(tiposIniciales);
  const [error, setError] = React.useState<string | null>(null);

  const [agregandoSector, setAgregandoSector] = React.useState(false);
  const [nuevoSector, setNuevoSector] = React.useState("");
  const [guardandoSector, setGuardandoSector] = React.useState(false);

  const [editandoTipo, setEditandoTipo] = React.useState<string | null>(null);
  const [sectorElegido, setSectorElegido] = React.useState("");
  const [guardandoAsignacion, setGuardandoAsignacion] = React.useState(false);

  async function agregarSector() {
    if (!nuevoSector.trim()) return;
    setGuardandoSector(true);
    setError(null);
    try {
      const res = await fetch("/api/catalogos/sectores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoSector.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo agregar el sector.");
      }
      const creado = (await res.json()) as SectorEmisor;
      setSectores([...sectores, creado]);
      setNuevoSector("");
      setAgregandoSector(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar el sector.");
    } finally {
      setGuardandoSector(false);
    }
  }

  async function guardarAsignacion(nombreTipo: string) {
    setGuardandoAsignacion(true);
    setError(null);
    try {
      const res = await fetch("/api/catalogos/tipos-contrato/asignacion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombreTipo, sectorAsignadoId: sectorElegido || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo actualizar la asignación.");
      }
      setTipos(tipos.map((t) => (t.nombre === nombreTipo ? { ...t, sectorAsignadoId: sectorElegido || null } : t)));
      setEditandoTipo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar la asignación.");
    } finally {
      setGuardandoAsignacion(false);
    }
  }

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4.5 shadow-[var(--shadow-sm)]">
        <h3 className="mb-3 font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">
          Sectores/Directorio dados de alta
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {sectores.map((s) => (
            <Badge key={s.id} variant="blue">{s.nombre}</Badge>
          ))}
          {agregandoSector ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                value={nuevoSector}
                onChange={(e) => setNuevoSector(e.target.value)}
                placeholder="Nombre del sector"
                className="w-[220px]"
              />
              <Button size="xs" variant="primary" onClick={agregarSector} disabled={guardandoSector || !nuevoSector.trim()}>
                {guardandoSector ? "Guardando…" : "Guardar"}
              </Button>
              <Button size="xs" variant="ghost" onClick={() => { setAgregandoSector(false); setNuevoSector(""); }}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button size="xs" variant="ghost" onClick={() => setAgregandoSector(true)}>+ Agregar sector</Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-3.5">
          <h3 className="font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">
            Asignación por tipo de contrato
          </h3>
        </div>
        <table className="w-full text-[var(--text-base)]">
          <thead>
            <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
              <th className="px-3.5 py-2.5">Tipo de contrato</th>
              <th className="px-3.5 py-2.5">Sector/Directorio emisor</th>
              <th className="px-3.5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {tipos.map((t) => {
              const sector = sectores.find((s) => s.id === t.sectorAsignadoId);
              return (
                <tr key={t.nombre} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-3.5 py-2.5 font-medium">{t.nombre}</td>
                  <td className="px-3.5 py-2.5">
                    {editandoTipo === t.nombre ? (
                      <Select value={sectorElegido} onChange={(e) => setSectorElegido(e.target.value)} className="max-w-[240px]">
                        <option value="">Sin asignar</option>
                        {sectores.map((s) => (
                          <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))}
                      </Select>
                    ) : sector ? (
                      <Badge variant="blue">{sector.nombre}</Badge>
                    ) : (
                      <Badge variant="warning">Sin asignar</Badge>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    {editandoTipo === t.nombre ? (
                      <div className="flex justify-end gap-2">
                        <Button size="xs" variant="ghost" onClick={() => setEditandoTipo(null)}>Cancelar</Button>
                        <Button size="xs" variant="primary" onClick={() => guardarAsignacion(t.nombre)} disabled={guardandoAsignacion}>
                          {guardandoAsignacion ? "Guardando…" : "Guardar"}
                        </Button>
                      </div>
                    ) : (
                      <Button size="xs" variant="ghost" onClick={() => { setEditandoTipo(t.nombre); setSectorElegido(t.sectorAsignadoId ?? ""); }}>
                        Editar
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
