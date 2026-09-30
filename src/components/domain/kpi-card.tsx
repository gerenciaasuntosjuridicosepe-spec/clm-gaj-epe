import { cn } from "@/lib/utils";

const BARRA: Record<string, string> = {
  blue: "bg-brand-blue-500",
  orange: "bg-brand-orange-500",
  success: "bg-[var(--color-success)]",
  danger: "bg-[var(--color-danger)]",
};

/** KpiCard — sección 3.4 del design system: barra superior de 3px por categoría cromática. */
export function KpiCard({
  label,
  value,
  delta,
  color = "blue",
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  color?: "blue" | "orange" | "success" | "danger";
}) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)]">
      <span className={cn("absolute inset-x-0 top-0 h-[3px]", BARRA[color])} />
      <div className="mb-1.5 text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
        {label}
      </div>
      <div className="font-[var(--font-display)] text-[var(--text-3xl)] font-bold leading-none">{value}</div>
      {delta && <div className="mt-1.5 text-[var(--text-xs)] text-[var(--color-text-muted)]">{delta}</div>}
    </div>
  );
}
