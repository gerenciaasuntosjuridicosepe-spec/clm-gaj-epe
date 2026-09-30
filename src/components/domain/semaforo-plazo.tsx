import { cn } from "@/lib/utils";
import { diasRestantes, nivelSemaforo } from "@/lib/fechas";

const COLOR: Record<string, string> = {
  verde: "bg-[var(--color-success)]",
  amarillo: "bg-[var(--color-warning)]",
  rojo: "bg-[var(--color-danger)]",
  gris: "bg-[var(--color-text-muted)]",
};

/**
 * Semáforo de plazo — sección 3.8 del design system: "el componente más
 * de producto de toda la referencia". Reutilizado casi sin cambios acá,
 * tal como recomienda la sección 10.3 del mismo documento.
 */
export function SemaforoPlazo({ fechaISO, sinPlazoLabel = "Sin plazo" }: { fechaISO?: string; sinPlazoLabel?: string }) {
  const dias = diasRestantes(fechaISO);
  const nivel = nivelSemaforo(dias);
  let texto: string;
  if (dias === null) texto = sinPlazoLabel;
  else if (dias < 0) texto = `Vencido hace ${Math.abs(dias)} d`;
  else if (dias === 0) texto = "Vence hoy";
  else texto = `Vence en ${dias} d`;

  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--text-sm)] font-semibold">
      <span className={cn("h-2 w-2 rounded-full flex-shrink-0", COLOR[nivel])} />
      {texto}
    </span>
  );
}
