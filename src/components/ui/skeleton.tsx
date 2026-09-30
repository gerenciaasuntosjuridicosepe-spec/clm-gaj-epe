import { cn } from "@/lib/utils";

/** Skeleton loader — sección 3.13, ausente en la referencia. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-[var(--radius-sm)] bg-surface-2", className)} {...props} />;
}
