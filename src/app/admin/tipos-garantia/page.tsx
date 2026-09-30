import { AppShell } from "@/components/layout/app-shell";
import { CatalogoSimpleClient } from "@/components/pages/catalogo-simple-client";
import { listarTiposGarantia } from "@/lib/data/catalogos-provider";

export const dynamic = "force-dynamic";

/**
 * Catálogo configurable de tipos de garantía exigida (etapa Renovación /
 * Cierre) — administrable en Administración > Tipos de garantía. Antes era
 * texto libre; se convirtió en catálogo a pedido del usuario.
 */
export default async function TiposGarantiaPage() {
  const tipos = await listarTiposGarantia();

  return (
    <AppShell titulo="Tipos de garantía">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Tipos de garantía</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Catálogo de tipos disponibles al cargar una garantía exigida en la etapa de Renovación/Cierre
      </p>

      <CatalogoSimpleClient tituloItem="tipo de garantía" endpoint="/api/catalogos/tipos-garantia" itemsIniciales={tipos} />
    </AppShell>
  );
}
