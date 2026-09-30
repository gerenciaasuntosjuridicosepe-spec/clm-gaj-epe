import { AppShell } from "@/components/layout/app-shell";
import { CatalogoSimpleClient } from "@/components/pages/catalogo-simple-client";
import { listarTiposContrato } from "@/lib/data/catalogos-provider";

export const dynamic = "force-dynamic";

/** Catálogo de tipos de contrato — PRD sección 4.1bis: administrable, no codificado en el software. */
export default async function TiposContratoPage() {
  const tipos = await listarTiposContrato();

  return (
    <AppShell titulo="Tipos de contrato">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Tipos de contrato</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Catálogo administrable por Jurídicos, independiente del campo Documento (PRD 4.1bis). La asignación de sector
        emisor se edita en Biblioteca de sectores.
      </p>

      <CatalogoSimpleClient
        tituloItem="tipo de contrato"
        endpoint="/api/catalogos/tipos-contrato"
        itemsIniciales={tipos.map((t) => t.nombre)}
      />
    </AppShell>
  );
}
