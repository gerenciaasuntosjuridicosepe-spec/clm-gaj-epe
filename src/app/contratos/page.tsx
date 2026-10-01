import { listarVisibles } from "@/lib/data/provider";
import { ContratosClient } from "@/components/pages/contratos-client";
import { auth } from "@/auth";
import { rolClmDeSesion } from "@/lib/auth-guard";

// Los datos vienen de Sheets/mock y cambian en cualquier momento (nuevas
// solicitudes, aprobaciones, vencimientos); no tiene sentido cachear esta
// página en build time ni servir una versión vieja.
export const dynamic = "force-dynamic";

export default async function ContratosPage() {
  const session = await auth();
  const contratos = await listarVisibles(rolClmDeSesion(session));
  return <ContratosClient contratos={contratos} />;
}
