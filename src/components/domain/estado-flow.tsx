import { cn } from "@/lib/utils";
import { ETAPAS_ORDEN, EtapaId } from "@/lib/types";

/**
 * Estado-flow — sección 3.12 del design system: nodos conectados por
 * flechas, mapea el flujo lineal del PRD (sección 5).
 *
 * `actual` sigue marcando en qué etapa real está el expediente (colores
 * done/current/pending). `seleccionada` + `onSeleccionar` son opcionales:
 * si se pasan, cada nodo se vuelve clickeable para ver los datos de esa
 * instancia puntual sin perder de vista el progreso real del expediente
 * (la etapa seleccionada se marca con un anillo, independiente del color
 * de progreso).
 */
export function EstadoFlow({
  actual,
  seleccionada,
  onSeleccionar,
}: {
  actual: EtapaId;
  seleccionada?: EtapaId;
  onSeleccionar?: (etapa: EtapaId) => void;
}) {
  const idxActual = ETAPAS_ORDEN.findIndex((e) => e.id === actual);
  return (
    <div className="flex flex-wrap items-center gap-1 text-[var(--text-sm)]">
      {ETAPAS_ORDEN.map((etapa, idx) => {
        const estado = idx < idxActual ? "done" : idx === idxActual ? "current" : "pending";
        const Tag = onSeleccionar ? "button" : "span";
        return (
          <span key={etapa.id} className="flex items-center gap-1">
            <Tag
              onClick={onSeleccionar ? () => onSeleccionar(etapa.id) : undefined}
              className={cn(
                "whitespace-nowrap rounded-[var(--radius-pill)] px-2.5 py-1 font-semibold",
                onSeleccionar && "cursor-pointer transition-shadow",
                estado === "done" && "bg-[var(--color-success-bg)] text-[var(--color-success)]",
                estado === "current" && "bg-brand-blue-700 text-white",
                estado === "pending" && "bg-surface-2 text-[var(--color-text-muted)]",
                seleccionada === etapa.id && "ring-2 ring-brand-orange-500 ring-offset-1"
              )}
            >
              {etapa.label}
            </Tag>
            {idx < ETAPAS_ORDEN.length - 1 && <span className="text-[var(--color-text-muted)] font-bold">›</span>}
          </span>
        );
      })}
    </div>
  );
}
