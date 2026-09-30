import { AppShell } from "@/components/layout/app-shell";
import { CatalogoSimpleClient } from "@/components/pages/catalogo-simple-client";
import { listarTiposAnotacion } from "@/lib/data/catalogos-provider";

export const dynamic = "force-dynamic";

/**
 * Catálogo configurable de tipos de anotación de seguimiento (Redacción /
 * Negociación) — agregado a pedido del usuario, no viene del PRD original.
 */
export default async function TiposAnotacionPage() {
  const tipos = await listarTiposAnotacion();

  return (
    <AppShell titulo="Tipos de anotación">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Tipos de anotación</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Catálogo de tipos de ingreso disponibles al cargar una anotación de seguimiento en Redacción/Negociación
      </p>

      <CatalogoSimpleClient tituloItem="tipo de anotación" endpoint="/api/catalogos/tipos-anotacion" itemsIniciales={tipos} />
    </AppShell>
  );
}
