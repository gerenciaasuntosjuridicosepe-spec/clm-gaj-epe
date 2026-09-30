import * as React from "react";
import { cn } from "@/lib/utils";

/** Input — sección 3.2 del design system: borde 1.5px, radio 8px, focus ring azul. */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-[var(--radius-sm)] border-[1.5px] border-[var(--color-border)] bg-white px-[11px] py-[7px] text-[var(--text-base)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
        "focus:outline-none focus:border-brand-blue-500 focus:ring-[3px] focus:ring-[rgba(0,102,192,0.1)]",
        "disabled:bg-surface disabled:text-[var(--color-text-muted)]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
