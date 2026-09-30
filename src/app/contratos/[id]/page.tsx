import { notFound } from "next/navigation";
import { getContratosProvider } from "@/lib/data/provider";
import { ContratoDetalleClient } from "@/components/pages/contrato-detalle-client";
import { auth } from "@/auth";
import { puedeVerContrato } from "@/lib/permisos";

export const dynamic = "force-dynamic";

export default async function ContratoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const contrato = await getContratosProvider().obtener(id);
  // 404 (no 403): no confirmamos ni siquiera que el expediente existe a un
  // rol que no debería verlo en su etapa actual (mismo criterio para "no
  // existe" y "no te corresponde" — ver hallazgo crítico #3 del informe).
  if (!contrato || !puedeVerContrato(session!.user.rolId, contrato.etapaActual)) notFound();
  return <ContratoDetalleClient contrato={contrato} />;
}
