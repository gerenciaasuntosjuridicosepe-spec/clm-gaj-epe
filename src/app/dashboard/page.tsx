import { listarVisibles } from "@/lib/data/provider";
import { calcularDashboardContratos } from "@/lib/dashboard";
import { hoyEnArgentina } from "@/lib/fechas";
import { DashboardContratosClient } from "@/components/pages/dashboard-contratos-client";
import { auth } from "@/auth";
import { rolClmDeSesion } from "@/lib/auth-guard";

// Los datos vienen de Sheets/mock y cambian en cualquier momento; no tiene sentido cachear esta página en build time.
export const dynamic = "force-dynamic";

/** Dashboard del módulo de Contratos (a pedido de Carlos, 2026-10-12) — mismo alcance de contratos visibles que el resto del CLM (`listarVisibles`). */
export default async function DashboardPage() {
  const session = await auth();
  const contratos = await listarVisibles(rolClmDeSesion(session));
  const datos = calcularDashboardContratos(contratos, hoyEnArgentina());

  return <DashboardContratosClient {...datos} />;
}
