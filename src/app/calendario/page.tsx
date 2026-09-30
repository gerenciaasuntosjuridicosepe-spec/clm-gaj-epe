import { getContratosProvider } from "@/lib/data/provider";
import { construirEventosCalendario } from "@/lib/calendario";
import { CalendarioClient } from "@/components/pages/calendario-client";

// Los datos vienen de Sheets/mock y cambian en cualquier momento; no tiene
// sentido cachear esta página en build time.
export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const contratos = await getContratosProvider().listar();
  const eventos = construirEventosCalendario(contratos);
  return <CalendarioClient eventos={eventos} />;
}
