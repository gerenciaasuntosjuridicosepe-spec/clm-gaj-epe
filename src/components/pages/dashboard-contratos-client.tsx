"use client";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/domain/kpi-card";
import { Alert } from "@/components/domain/alert";
import { SemaforoBarra } from "@/components/domain/semaforo-barra";
import { GraficoBarrasCategorias } from "@/components/domain/grafico-barras-categorias";
import type {
  ResumenDashboardContratos,
  ItemPorEtapa,
  ItemPorTipo,
  ItemVencimientoPorMesContrato,
  SegmentoSemaforoContratos,
} from "@/lib/dashboard";

const LABEL_NIVEL: Record<SegmentoSemaforoContratos["nivel"], string> = {
  rojo: "Vence en ≤ 7 días o vencido",
  amarillo: "Vence en 8-30 días",
  verde: "Vence en más de 30 días",
  gris: "Sin fecha de vigencia cargada",
};

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function etiquetaMes(mes: string): string {
  const [anio, mesNum] = mes.split("-").map(Number);
  return `${MESES_CORTOS[mesNum - 1]} '${String(anio).slice(2)}`;
}

/**
 * Dashboard del módulo de Contratos — KPIs y gráficos elegidos a partir de
 * lo que ya existe en el modelo (etapas del flujo, estado de vigencia,
 * plazo prudencial, tipo de contrato), sin inventar métricas nuevas. Todo
 * se calcula en el servidor (`calcularDashboardContratos`) — este
 * componente solo pinta.
 */
export function DashboardContratosClient({
  resumen,
  contratosPorEtapa,
  contratosPorTipo,
  vencimientosPorMes,
  semaforoVigencia,
}: {
  resumen: ResumenDashboardContratos;
  contratosPorEtapa: ItemPorEtapa[];
  contratosPorTipo: ItemPorTipo[];
  vencimientosPorMes: ItemVencimientoPorMesContrato[];
  semaforoVigencia: SegmentoSemaforoContratos[];
}) {
  return (
    <AppShell titulo="Dashboard">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Dashboard</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Panorama general de los contratos a los que tenés acceso — vigencia, flujo y tipo.
      </p>

      {resumen.plazoPrudencialVencido > 0 && (
        <Alert variant="danger">
          {resumen.plazoPrudencialVencido} solicitud(es) con el plazo prudencial de aprobación vencido —{" "}
          <Link href="/calendario" className="underline">
            ver en el calendario
          </Link>
          .
        </Alert>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard label="Contratos visibles" value={resumen.total} color="blue" />
        <KpiCard label="Vigentes" value={resumen.vigentes} color="success" />
        <KpiCard label="Vencidos" value={resumen.vencidos} color={resumen.vencidos > 0 ? "danger" : "blue"} />
        <KpiCard label="En prórroga" value={resumen.prorroga} color="orange" />
        <KpiCard label="Solicitudes pendientes de aprobación" value={resumen.solicitudesPendientes} color="orange" />
        <KpiCard
          label="Plazo prudencial vencido"
          value={resumen.plazoPrudencialVencido}
          color={resumen.plazoPrudencialVencido > 0 ? "danger" : "blue"}
        />
      </div>

      <SemaforoBarra
        titulo="Semáforo de vigencia — contratos vigentes o en prórroga"
        segmentos={semaforoVigencia.map((s) => ({
          nivel: s.nivel,
          label: LABEL_NIVEL[s.nivel],
          cantidad: s.cantidad,
        }))}
      />

      <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4.5 shadow-[var(--shadow-sm)]">
        <div className="mb-2.5 text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
          Vencimientos de vigencia por mes — próximos 12 meses
        </div>
        <GraficoBarrasCategorias
          datos={vencimientosPorMes.map((d) => ({
            clave: d.mes,
            etiqueta: etiquetaMes(d.mes),
            cantidad: d.cantidad,
            tooltip: `${d.cantidad} vencimiento${d.cantidad !== 1 ? "s" : ""} en ${etiquetaMes(d.mes)}`,
          }))}
        />
      </div>

      <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4.5 shadow-[var(--shadow-sm)]">
        <div className="mb-2.5 text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
          Contratos por etapa del flujo
        </div>
        <GraficoBarrasCategorias
          datos={contratosPorEtapa.map((e) => ({
            clave: e.etapa,
            etiqueta: e.label,
            cantidad: e.cantidad,
            tooltip: `${e.cantidad} contrato${e.cantidad !== 1 ? "s" : ""} en ${e.label}`,
          }))}
        />
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-3.5">
          <h3 className="font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">Contratos por tipo</h3>
        </div>
        {contratosPorTipo.length === 0 ? (
          <p className="p-4.5 text-[var(--color-text-muted)]">Sin contratos cargados todavía.</p>
        ) : (
          <table className="w-full text-[var(--text-base)]">
            <thead>
              <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
                <th className="px-3.5 py-2.5">Tipo de contrato</th>
                <th className="px-3.5 py-2.5 text-right">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {contratosPorTipo.map((item) => (
                <tr key={item.tipoContrato} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-3.5 py-2.5">{item.tipoContrato}</td>
                  <td className="px-3.5 py-2.5 text-right font-semibold">{item.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-5 flex gap-4 text-[var(--text-sm)]">
        <Link href="/alertas" className="text-brand-blue-700 hover:underline">
          Ver alertas de vencimiento →
        </Link>
        <Link href="/" className="text-brand-blue-700 hover:underline">
          Ver bandeja de tareas →
        </Link>
      </div>
    </AppShell>
  );
}
