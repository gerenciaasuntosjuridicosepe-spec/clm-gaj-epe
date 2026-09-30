import { listarVisibles } from "@/lib/data/provider";
import { BandejaClient } from "@/components/pages/bandeja-client";
import { auth } from "@/auth";

// Los datos vienen de Sheets/mock y cambian en cualquier momento (nuevas
// solicitudes, aprobaciones, vencimientos); no tiene sentido cachear esta
// página en build time ni servir una versión vieja.
export const dynamic = "force-dynamic";

/**
 * Server Component: acá (y solo acá) se llama a `getContratosProvider()`.
 * Cuando esté configurado Google Sheets, esta línea empieza a traer datos
 * reales sin que `BandejaClient` ni ningún otro componente cambie.
 */
export default async function BandejaPage() {
  const session = await auth();
  const contratos = await listarVisibles(session!.user.rolId);
  return <BandejaClient contratos={contratos} />;
}
