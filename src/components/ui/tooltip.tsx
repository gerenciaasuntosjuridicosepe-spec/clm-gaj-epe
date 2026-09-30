"use client";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

/** Tooltip real (Radix) — sección 3.13: reemplaza el `title` nativo de la referencia. */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-[var(--radius-sm)] bg-[var(--color-brand-blue-900)] px-2.5 py-1.5 text-[var(--text-sm)] text-white shadow-[var(--shadow-md)] max-w-[260px]",
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
