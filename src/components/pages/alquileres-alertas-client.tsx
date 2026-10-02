"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ItemColaTrabajo } from "@/lib/alquileres/reglas/dashboard";

const ETIQUETA_ALERTA: Record<ItemColaTrabajo["alerta"], string> = {
  A1: "Iniciar aviso",
  A4: "Hito atrasado",
  A5: "Ocupación sin contrato",
  A6: "Formalizada sin escaneado",
};

type Filtro = "TODAS" | ItemColaTrabajo["alerta"];

/**
 * Alertas (PRD v1 sección 6 + menú RF-41) — vista propia, filtrable, de las
 * mismas alertas que alimentan la cola de trabajo del dashboard (A1, A4,
 * A5, A6 — las únicas que hoy tienen todos sus datos de entrada cargados;
 * A2/A3 necesitan datos de Partes/Propuesta del locador que todavía no
 * tienen ABM, y A7/A8 son del módulo de Administración, no de esta
 * pantalla). No repite ningún cálculo: recibe la `colaDeTrabajo` ya
 * calculada en el servidor por `calcularDashboard` y solo filtra en el
 * cliente.
 */
export function AlquileresAlertasClient({ colaDeTrabajo }: { colaDeTrabajo: ItemColaTrabajo[] }) {
  const [filtro, setFiltro] = useState<Filtro>("TODAS");

  const porTipo = (tipo: ItemColaTrabajo["alerta"]) => colaDeTrabajo.filter((item) => item.alerta === tipo).length;
  const visibles = filtro === "TODAS" ? colaDeTrabajo : colaDeTrabajo.filter((item) => item.alerta === filtro);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant={filtro === "TODAS" ? "primary" : "ghost"} size="sm" onClick={() => setFiltro("TODAS")}>
          Todas ({colaDeTrabajo.length})
        </Button>
        {(Object.keys(ETIQUETA_ALERTA) as ItemColaTrabajo["alerta"][]).map((tipo) => (
          <Button key={tipo} variant={filtro === tipo ? "primary" : "ghost"} size="sm" onClick={() => setFiltro(tipo)}>
            {tipo} · {ETIQUETA_ALERTA[tipo]} ({porTipo(tipo)})
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        {visibles.length === 0 ? (
          <p className="p-4.5 text-[var(--color-text-muted)]">Sin alertas{filtro !== "TODAS" ? ` de tipo ${filtro}` : ""}.</p>
        ) : (
          <table className="w-full text-[var(--text-base)]">
            <thead>
              <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
                <th className="px-3.5 py-2.5">Actuación</th>
                <th className="px-3.5 py-2.5">Inmueble</th>
                <th className="px-3.5 py-2.5">Alerta</th>
                <th className="px-3.5 py-2.5">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((item, i) => (
                <tr key={`${item.actuacionId}-${item.alerta}-${i}`} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-3.5 py-2.5 font-mono text-[var(--text-sm)]">{item.actuacionId}</td>
                  <td className="px-3.5 py-2.5">{item.inmuebleId}</td>
                  <td className="px-3.5 py-2.5 font-semibold">
                    {item.alerta} · {ETIQUETA_ALERTA[item.alerta]}
                  </td>
                  <td className="px-3.5 py-2.5 text-[var(--color-text-secondary)]">{item.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
