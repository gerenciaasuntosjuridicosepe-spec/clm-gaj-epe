import { cn } from "@/lib/utils";
import type { EstadoActuacion } from "@/lib/alquileres/tipos";

/**
 * Secuencia del trámite de renovación de un CONTRATO — mismo patrón visual
 * que `EstadoFlow` del CLM (nodos conectados, clickeables). Los estados
 * terminales (DESISTIDA/NO_RENOVADO/ANULADA) no forman parte de esta
 * secuencia lineal: una actuación en esos estados no aparece en la vista de
 * "procesos en curso" que usa este componente.
 */
const ESTADOS_RENOVACION_ORDEN: { id: EstadoActuacion; label: string }[] = [
  { id: "PENDIENTE_AVISO", label: "Aviso pendiente" },
  { id: "AVISO_ENVIADO", label: "Aviso enviado" },
  { id: "EN_TRAMITE", label: "En trámite" },
  { id: "FORMALIZADA", label: "Formalizada" },
  { id: "CERRADA", label: "Cerrada" },
];

export function EstadoFlowAlquileres({
  actual,
  seleccionada,
  onSeleccionar,
}: {
  actual: EstadoActuacion;
  seleccionada?: EstadoActuacion;
  onSeleccionar?: (estado: EstadoActuacion) => void;
}) {
  const idxActual = ESTADOS_RENOVACION_ORDEN.findIndex((e) => e.id === actual);
  return (
    <div className="flex flex-wrap items-center gap-1 text-[var(--text-sm)]">
      {ESTADOS_RENOVACION_ORDEN.map((estado, idx) => {
        const estadoVisual = idxActual < 0 ? "pending" : idx < idxActual ? "done" : idx === idxActual ? "current" : "pending";
        const Tag = onSeleccionar ? "button" : "span";
        return (
          <span key={estado.id} className="flex items-center gap-1">
            <Tag
              onClick={onSeleccionar ? () => onSeleccionar(estado.id) : undefined}
              className={cn(
                "whitespace-nowrap rounded-[var(--radius-pill)] px-2.5 py-1 font-semibold",
                onSeleccionar && "cursor-pointer transition-shadow",
                estadoVisual === "done" && "bg-[var(--color-success-bg)] text-[var(--color-success)]",
                estadoVisual === "current" && "bg-brand-blue-700 text-white",
                estadoVisual === "pending" && "bg-surface-2 text-[var(--color-text-muted)]",
                seleccionada === estado.id && "ring-2 ring-brand-orange-500 ring-offset-1"
              )}
            >
              {estado.label}
            </Tag>
            {idx < ESTADOS_RENOVACION_ORDEN.length - 1 && <span className="text-[var(--color-text-muted)] font-bold">›</span>}
          </span>
        );
      })}
    </div>
  );
}
