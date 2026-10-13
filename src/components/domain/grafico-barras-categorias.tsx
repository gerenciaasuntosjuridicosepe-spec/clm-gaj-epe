import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface ItemGraficoBarras {
  /** Clave estable para la columna (ej. "2026-10" o un EtapaId) — no se muestra, solo evita colisiones de key. */
  clave: string;
  /** Texto corto debajo de la columna. */
  etiqueta: string;
  cantidad: number;
  /** Texto del tooltip al pasar el mouse; si no se informa, usa "{cantidad} · {etiqueta}". */
  tooltip?: string;
}

const ALTO_GRAFICO_PX = 120;

/**
 * Gráfico de barras de una sola serie — genérico (no conoce Contrato ni
 * Actuación): cada módulo arma sus propias columnas con la cantidad y la
 * etiqueta que corresponda (meses, etapas, lo que sea) y las pasa acá. Sin
 * leyenda (sección 6 del método de dataviz: "a single series needs no
 * legend box"). Cada columna lleva su valor directamente arriba — pensado
 * para una docena de columnas más o menos; con muchas más, conviene otra
 * forma (ver `choosing-a-form.md`), no forzar este componente.
 */
export function GraficoBarrasCategorias({ datos }: { datos: ItemGraficoBarras[] }) {
  const max = Math.max(1, ...datos.map((d) => d.cantidad));

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-end gap-1.5 px-2" style={{ height: ALTO_GRAFICO_PX + 36 }}>
        {datos.map((d) => {
          const alturaPx = d.cantidad === 0 ? 0 : Math.max(4, Math.round((d.cantidad / max) * ALTO_GRAFICO_PX));
          return (
            <div key={d.clave} className="flex flex-1 flex-col items-center justify-end" style={{ height: ALTO_GRAFICO_PX + 36 }}>
              <span
                className={d.cantidad === 0 ? "text-[var(--text-xs)] text-[var(--color-text-muted)]" : "text-[var(--text-xs)] font-semibold text-[var(--color-text-primary)]"}
              >
                {d.cantidad}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    tabIndex={0}
                    style={{ height: Math.max(alturaPx, 2), width: 20 }}
                    className={d.cantidad === 0 ? "mt-1 rounded-t-[4px] bg-[var(--color-border)]" : "mt-1 rounded-t-[4px] bg-brand-blue-500 transition-[filter] hover:brightness-110 focus-visible:brightness-110 focus-visible:outline-none"}
                  />
                </TooltipTrigger>
                <TooltipContent>{d.tooltip ?? `${d.cantidad} · ${d.etiqueta}`}</TooltipContent>
              </Tooltip>
              <span className="mt-1.5 whitespace-nowrap text-[var(--text-xs)] text-[var(--color-text-secondary)]">{d.etiqueta}</span>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
