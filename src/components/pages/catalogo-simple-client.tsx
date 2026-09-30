"use client";
import * as React from "react";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/domain/alert";

/**
 * Catálogo administrable de un solo campo (nombre) — hoy usado por
 * "Tipos de anotación" y "Tipos de garantía". Alta al final de la lista y
 * renombrar por fila; ambas operaciones pegan a `endpoint` (POST para
 * crear, PATCH con `{ original, nuevo }` para renombrar).
 */
export function CatalogoSimpleClient({
  tituloItem,
  endpoint,
  itemsIniciales,
}: {
  tituloItem: string;
  endpoint: string;
  itemsIniciales: string[];
}) {
  const [items, setItems] = React.useState(itemsIniciales);
  const [error, setError] = React.useState<string | null>(null);

  const [agregando, setAgregando] = React.useState(false);
  const [nuevoNombre, setNuevoNombre] = React.useState("");
  const [guardandoNuevo, setGuardandoNuevo] = React.useState(false);

  const [editando, setEditando] = React.useState<number | null>(null);
  const [nombreEditado, setNombreEditado] = React.useState("");
  const [guardandoEdicion, setGuardandoEdicion] = React.useState(false);

  async function agregar() {
    if (!nuevoNombre.trim()) return;
    setGuardandoNuevo(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoNombre.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `No se pudo agregar el ${tituloItem}.`);
      }
      setItems([...items, nuevoNombre.trim()]);
      setNuevoNombre("");
      setAgregando(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Error al agregar el ${tituloItem}.`);
    } finally {
      setGuardandoNuevo(false);
    }
  }

  async function guardarEdicion(i: number) {
    if (!nombreEditado.trim()) return;
    setGuardandoEdicion(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original: items[i], nuevo: nombreEditado.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `No se pudo actualizar el ${tituloItem}.`);
      }
      const copia = [...items];
      copia[i] = nombreEditado.trim();
      setItems(copia);
      setEditando(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Error al actualizar el ${tituloItem}.`);
    } finally {
      setGuardandoEdicion(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-3.5">
        <h3 className="font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">
          {items.length} {items.length === 1 ? tituloItem : `${tituloItem}s`} dados de alta
        </h3>
        {!agregando && (
          <Button size="sm" variant="orange" onClick={() => setAgregando(true)}>
            + Nuevo tipo
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4.5 pb-0">
          <Alert variant="danger">{error}</Alert>
        </div>
      )}

      {agregando && (
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-surface p-3.5">
          <Input
            autoFocus
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder={`Nombre del nuevo ${tituloItem}`}
            className="max-w-[320px]"
          />
          <Button size="sm" variant="primary" onClick={agregar} disabled={guardandoNuevo || !nuevoNombre.trim()}>
            {guardandoNuevo ? "Guardando…" : "Guardar"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setAgregando(false); setNuevoNombre(""); }}>
            Cancelar
          </Button>
        </div>
      )}

      <table className="w-full text-[var(--text-base)]">
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-[var(--color-border)] last:border-b-0">
              <td className="px-3.5 py-2.5">
                {editando === i ? (
                  <Input
                    autoFocus
                    value={nombreEditado}
                    onChange={(e) => setNombreEditado(e.target.value)}
                    className="max-w-[320px]"
                  />
                ) : (
                  <Badge variant="blue">{item}</Badge>
                )}
              </td>
              <td className="px-3.5 py-2.5 text-right">
                {editando === i ? (
                  <div className="flex justify-end gap-2">
                    <Button size="xs" variant="ghost" onClick={() => setEditando(null)}>Cancelar</Button>
                    <Button size="xs" variant="primary" onClick={() => guardarEdicion(i)} disabled={guardandoEdicion || !nombreEditado.trim()}>
                      {guardandoEdicion ? "Guardando…" : "Guardar"}
                    </Button>
                  </div>
                ) : (
                  <Button size="xs" variant="ghost" onClick={() => { setEditando(i); setNombreEditado(item); }}>
                    <Pencil size={11} /> Editar
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
