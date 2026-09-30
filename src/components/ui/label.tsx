"use client";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

/** Label — sección 3.2: 11px, 600, mayúscula, encima del input. */
export function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]",
        className
      )}
      {...props}
    />
  );
}
