"use client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EstadoFlowAlquileres } from "@/components/domain/estado-flow-alquileres";
import { formatearFecha } from "@/lib/alquileres/fechas";
import type { Actuacion } from "@/lib/alquileres/tipos";
import type { NivelSemaforo } from "@/lib/alquileres/fechas";

const BADGE_POR_NIVEL: Record<NivelSemaforo, "success" | "warning" | "orange" | "danger" | "info"> = {
  verde: "success",
  amarillo: "warning",
  naranja: "orange",
  rojo: "danger",
  gris: "info",
};

export interface ProcesoRenovacion {
  actuacion: Actuacion;
  inmuebleDomicilio: string;
  vencimientoEfectivo?: string;
  nivel?: NivelSemaforo;
}

/** Lista de procesos de renovación en curso — cada fila con su propio flujo (clickeable, lleva al detalle). */
export function AlquileresProcesosRenovacionClient({ procesos }: { procesos: ProcesoRenovacion[] }) {
  if (procesos.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 text-center text-[var(--color-text-muted)] shadow-[var(--shadow-sm)]">
        No hay procesos de renovación en curso en este momento.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {procesos.map((p) => (
        <Link
          key={p.actuacion.actuacionId}
          href={`/alquileres/procesos-renovacion/${p.actuacion.actuacionId}`}
          className="block rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4.5 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-md"
        >
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[var(--text-base)] font-semibold text-brand-blue-700">{p.actuacion.actuacionId}</span>
            <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">{p.inmuebleDomicilio}</span>
            {p.vencimientoEfectivo && (
              <Badge variant={p.nivel ? BADGE_POR_NIVEL[p.nivel] : "info"}>
                Vence {formatearFecha(p.vencimientoEfectivo)}
              </Badge>
            )}
          </div>
          <EstadoFlowAlquileres actual={p.actuacion.estadoActuacion} />
        </Link>
      ))}
    </div>
  );
}
