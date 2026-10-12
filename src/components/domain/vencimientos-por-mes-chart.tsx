import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ItemVencimientoPorMes } from "@/lib/alquileres/reglas/dashboard";

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function etiquetaMes(mes: string): string {
  const [anio, mesNum] = mes.split("-").map(Number);
  return `${MESES_CORTOS[mesNum - 1]} '${String(anio).slice(2)}`;
}

const ALTO_GRAFICO_PX = 120;

/**
 * Vencimientos por mes (a pedido de Carlos, 2026-10-12) — serie única, así
 * que sin leyenda (sección 6 del método de dataviz: "a single series needs
 * no legend box"). Cada columna lleva su valor directamente arriba (son
 * solo 12, entran sin amontonarse) y el eje Y se omite a propósito, ya que
 * todas las columnas ya están etiquetadas.
 */
export function VencimientosPorMesChart({ datos }: { datos: ItemVencimientoPorMes[] }) {
  const max = Math.max(1, ...datos.map((d) => d.cantidad));

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-end gap-1.5 px-2" style={{ height: ALTO_GRAFICO_PX + 36 }}>
        {datos.map((d) => {
          const alturaPx = d.cantidad === 0 ? 0 : Math.max(4, Math.round((d.cantidad / max) * ALTO_GRAFICO_PX));
          return (
            <div key={d.mes} className="flex flex-1 flex-col items-center justify-end" style={{ height: ALTO_GRAFICO_PX + 36 }}>
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
                <TooltipContent>
                  <span className="font-semibold">{d.cantidad}</span> vencimiento{d.cantidad !== 1 ? "s" : ""} en {etiquetaMes(d.mes)}
                </TooltipContent>
              </Tooltip>
              <span className="mt-1.5 whitespace-nowrap text-[var(--text-xs)] text-[var(--color-text-secondary)]">{etiquetaMes(d.mes)}</span>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
