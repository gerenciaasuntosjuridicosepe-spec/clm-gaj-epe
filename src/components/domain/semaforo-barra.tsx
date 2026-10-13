import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface SegmentoSemaforo {
  nivel: "verde" | "amarillo" | "naranja" | "rojo" | "gris";
  label: string;
  cantidad: number;
}

const FILL: Record<SegmentoSemaforo["nivel"], string> = {
  verde: "bg-[var(--color-success)]",
  amarillo: "bg-[var(--color-warning)]",
  naranja: "bg-brand-orange-500",
  rojo: "bg-[var(--color-danger)]",
  gris: "bg-[var(--color-text-muted)]",
};

/**
 * Semáforo de vencimientos como barra proporcional — un vistazo a qué
 * porción del total está en cada franja, en vez de N números aislados.
 * Genérico a propósito (no conoce Contrato ni Actuación): cada módulo (CLM,
 * Alquileres) arma sus propios segmentos con sus propios umbrales de
 * `nivelSemaforo` y le pasa a este componente solo `{nivel, label,
 * cantidad}` — la regla de negocio de qué es "rojo" vive en cada módulo,
 * acá solo se pinta. Reutiliza el Tooltip real del design system (sección
 * 3.13).
 */
export function SemaforoBarra({ titulo, segmentos }: { titulo: string; segmentos: SegmentoSemaforo[] }) {
  const total = segmentos.reduce((acc, s) => acc + s.cantidad, 0);
  const conDatos = segmentos.filter((s) => s.cantidad > 0);

  return (
    <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4.5 shadow-[var(--shadow-sm)]">
      <div className="mb-2.5 text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">{titulo}</div>

      {total === 0 ? (
        <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">Sin datos todavía.</p>
      ) : (
        <TooltipProvider delayDuration={100}>
          <div className="flex h-5 gap-[2px]" role="img" aria-label={segmentos.map((s) => `${s.label}: ${s.cantidad}`).join(", ")}>
            {conDatos.map((s, i) => (
              <Tooltip key={s.nivel}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    style={{ width: `${(s.cantidad / total) * 100}%` }}
                    className={cn(
                      "h-full transition-[filter] hover:brightness-110 focus-visible:brightness-110 focus-visible:outline-none",
                      FILL[s.nivel],
                      i === 0 && "rounded-l-[4px]",
                      i === conDatos.length - 1 && "rounded-r-[4px]"
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <span className="font-semibold">{s.cantidad}</span> · {s.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      )}

      {total > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {segmentos.map((s) => (
            <div key={s.nivel} className="flex items-center gap-1.5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
              <span className={cn("h-2.5 w-2.5 rounded-[2px]", FILL[s.nivel])} />
              {s.label} <span className="font-semibold text-[var(--color-text-primary)]">({s.cantidad})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
