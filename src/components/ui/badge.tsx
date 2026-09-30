import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Badge — sección 3.8 del design system: pill pequeño, variantes por color de estado + marca. */
const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius-pill)] px-[7px] py-[2px] text-[var(--text-xs)] font-bold uppercase tracking-wide",
  {
    variants: {
      variant: {
        blue: "bg-[var(--overlay-brand-12)] text-brand-blue-700",
        orange: "bg-brand-orange-500/15 text-brand-orange-700",
        gray: "bg-surface-2 text-[var(--color-text-secondary)]",
        success: "bg-[var(--color-success-bg)] text-[var(--color-success)]",
        danger: "bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
        warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
        info: "bg-[var(--color-info-bg)] text-[var(--color-info)]",
      },
    },
    defaultVariants: { variant: "gray" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
