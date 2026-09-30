import { cn } from "@/lib/utils";
import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";

const ESTILOS: Record<string, { border: string; bg: string; icon: React.ReactNode }> = {
  info: { border: "border-[var(--color-info)]", bg: "bg-[var(--color-info-bg)]", icon: <Info size={16} /> },
  warning: { border: "border-[var(--color-warning)]", bg: "bg-[var(--color-warning-bg)]", icon: <AlertTriangle size={16} /> },
  success: { border: "border-[var(--color-success)]", bg: "bg-[var(--color-success-bg)]", icon: <CheckCircle2 size={16} /> },
  danger: { border: "border-[var(--color-danger)]", bg: "bg-[var(--color-danger-bg)]", icon: <XCircle size={16} /> },
};

/** Alert inline — sección 3.11: barra izquierda 4px + fondo tenue + ícono. */
export function Alert({
  variant = "info",
  children,
  className,
}: {
  variant?: "info" | "warning" | "success" | "danger";
  children: React.ReactNode;
  className?: string;
}) {
  const e = ESTILOS[variant];
  return (
    <div className={cn("mb-3.5 flex gap-2.5 rounded-[var(--radius-sm)] border-l-4 p-3.5 text-[var(--text-base)]", e.border, e.bg, className)}>
      <span className="mt-0.5 flex-shrink-0">{e.icon}</span>
      <div>{children}</div>
    </div>
  );
}
