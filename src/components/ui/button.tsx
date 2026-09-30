import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Botón — sección 3.1 del design system.
 * Tamaños: base / sm / xs. Variantes: primary / orange / ghost / danger / success / warning.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] font-semibold transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--color-brand-blue-500)]",
  {
    variants: {
      variant: {
        primary: "bg-brand-blue-700 text-white hover:bg-brand-blue-900",
        orange: "bg-brand-orange-500 text-[#1A2940] hover:bg-brand-orange-700 hover:text-white",
        ghost:
          "bg-transparent border-[1.5px] border-brand-blue-700 text-brand-blue-700 hover:bg-brand-blue-700 hover:text-white",
        danger: "bg-[var(--color-danger)] text-white hover:opacity-90",
        success: "bg-[var(--color-success)] text-white hover:opacity-90",
        warning: "bg-[var(--color-warning)] text-white hover:opacity-90",
      },
      size: {
        base: "px-3.5 py-1.5 text-[var(--text-base)]",
        sm: "px-2.5 py-1 text-[var(--text-sm)]",
        xs: "px-1.5 py-0.5 text-[var(--text-xs)]",
      },
    },
    defaultVariants: { variant: "primary", size: "base" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
