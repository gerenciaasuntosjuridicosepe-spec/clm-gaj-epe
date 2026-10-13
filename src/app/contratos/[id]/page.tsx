import { notFound } from "next/navigation";
import { getContratosProvider } from "@/lib/data/provider";
import { listarUsuarios } from "@/lib/data/usuarios-provider";
import { ContratoDetalleClient } from "@/components/pages/contrato-detalle-client";
import { auth } from "@/auth";
import { puedeVerContrato } from "@/lib/permisos";
import { rolClmDeSesion } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export default async function ContratoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const contrato = await getContratosProvider().obtener(id);
  // 404 (no 403): no confirmamos ni siquiera que el expediente existe a un
  // rol que no debería verlo en su etapa actual (mismo criterio para "no
  // existe" y "no te corresponde" — ver hallazgo crítico #3 del informe).
  if (!contrato || !puedeVerContrato(rolClmDeSesion(session), contrato.etapaActual)) notFound();

  // 2026-10-13: antes este selector listaba MOCK_USUARIOS (datos ficticios,
  // "M. Cardozo"/"R. Fassi") en vez de los abogados reales — asignar a
  // alguien de esa lista no coincidía con ningún usuario real, lo que ahora
  // importa de verdad porque la asignación pasa a restringir quién puede
  // escribir en el contrato (ver permisos.ts, puedeEscribirContrato).
  const usuarios = await listarUsuarios();
  const abogadosDisponibles = usuarios.filter((u) => u.rolId === "abogado" && u.activo !== false);

  return <ContratoDetalleClient contrato={contrato} abogadosDisponibles={abogadosDisponibles} />;
}
