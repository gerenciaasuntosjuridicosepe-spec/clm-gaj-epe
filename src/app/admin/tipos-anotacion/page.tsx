"use client";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_TIPOS_ANOTACION } from "@/lib/data/mock-catalogos";

/**
 * Catálogo configurable de tipos de anotación de seguimiento (Redacción /
 * Negociación) — agregado a pedido del usuario, no viene del PRD original.
 * Mismo patrón que "Tipos de contrato": administrable, no codificado.
 */
export default function TiposAnotacionPage() {
  return (
    <AppShell titulo="Tipos de anotación">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Tipos de anotación</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Catálogo de tipos de ingreso disponibles al cargar una anotación de seguimiento en Redacción/Negociación
      </p>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-3.5">
          <h3 className="font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">
            {MOCK_TIPOS_ANOTACION.length} tipos dados de alta
          </h3>
          <Button size="sm" variant="orange">+ Nuevo tipo</Button>
        </div>
        <table className="w-full text-[var(--text-base)]">
          <tbody>
            {MOCK_TIPOS_ANOTACION.map((t) => (
              <tr key={t} className="border-b border-[var(--color-border)] last:border-b-0">
                <td className="px-3.5 py-2.5">
                  <Badge variant="blue">{t}</Badge>
                </td>
                <td className="px-3.5 py-2.5 text-right">
                  <Button size="xs" variant="ghost">Editar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
