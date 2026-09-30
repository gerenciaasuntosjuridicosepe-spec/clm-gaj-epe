import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Select — sección 3.3: la referencia usa el control nativo del navegador
 * sin skinning propio; se mantiene el mismo criterio acá (estilo compartido
 * con Input) en vez de introducir Radix Select, para no sumar complejidad
 * sin necesidad real todavía.
 */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-[var(--radius-sm)] border-[1.5px] border-[var(--color-border)] bg-white px-[11px] py-[7px] text-[var(--text-base)] text-[var(--color-text-primary)]",
        "focus:outline-none focus:border-brand-blue-500 focus:ring-[3px] focus:ring-[rgba(0,102,192,0.1)]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
