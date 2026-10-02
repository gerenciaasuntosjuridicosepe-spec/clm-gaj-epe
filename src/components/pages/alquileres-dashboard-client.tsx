"use client";
import { KpiCard } from "@/components/domain/kpi-card";
import { Alert } from "@/components/domain/alert";
import type { ItemColaTrabajo, ResumenDashboard } from "@/lib/alquileres/reglas/dashboard";
import { formatearMonto } from "@/lib/alquileres/fechas";

const ETIQUETA_ALERTA: Record<ItemColaTrabajo["alerta"], string> = {
  A1: "Iniciar aviso",
  A4: "Hito atrasado",
  A5: "Ocupación sin contrato",
  A6: "Formalizada sin escaneado",
};

/**
 * Dashboard (PRD v1 sección 8): tarjetas de indicadores + cola de trabajo.
 * Todo se calcula en el servidor (`calcularDashboard`, reglas puras ya
 * probadas) — este componente solo pinta lo que ya viene calculado, sin
 * repetir ninguna cuenta en el cliente.
 */
export function AlquileresDashboardClient({ resumen, colaDeTrabajo }: { resumen: ResumenDashboard; colaDeTrabajo: ItemColaTrabajo[] }) {
  return (
    <>
      {resumen.ocupacionSinContrato > 0 && (
        <Alert variant="danger">
          {resumen.ocupacionSinContrato} inmueble(s) en ocupación sin contrato (A5) — riesgo alto.
        </Alert>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Contratos vigentes" value={resumen.contratosVigentes} color="blue" />
        <KpiCard label="Ocupación sin contrato" value={resumen.ocupacionSinContrato} color={resumen.ocupacionSinContrato > 0 ? "danger" : "blue"} />
        <KpiCard label="Avisos por iniciar" value={resumen.avisosPorIniciar} color="orange" />
        <KpiCard label="Hitos atrasados" value={resumen.hitosAtrasados} color="orange" />
        <KpiCard label="Renovaciones en curso" value={resumen.renovacionesEnCurso} color="blue" />
        <KpiCard label="Legítimo abono en curso" value={resumen.legitimoAbonoEnCurso} color="blue" />
        <KpiCard label="Formalizadas sin escaneado" value={resumen.formalizadasSinEscaneado} color="orange" />
        <KpiCard
          label="Canon mensual neto de IVA"
          value={formatearMonto(resumen.canonNetoTotal)}
          delta={`${resumen.contratosSinDatoIva} contrato(s) sin dato de IVA excluidos — no incluye actualizaciones`}
          color="success"
        />
      </div>

      <div className="mb-5 grid grid-cols-4 gap-3">
        <KpiCard label="Vence &gt; 180 días" value={resumen.vencenVerde} color="success" />
        <KpiCard label="Vence 121-180 días" value={resumen.vencenAmarillo} color="orange" />
        <KpiCard label="Vence 61-120 días" value={resumen.vencenNaranja} color="orange" />
        <KpiCard label="Vence ≤ 60 días o vencido" value={resumen.vencenRojo} color="danger" />
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-3.5">
          <h3 className="font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">Cola de trabajo</h3>
        </div>
        {colaDeTrabajo.length === 0 ? (
          <p className="p-4.5 text-[var(--color-text-muted)]">Sin alertas pendientes.</p>
        ) : (
          <table className="w-full text-[var(--text-base)]">
            <thead>
              <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
                <th className="px-3.5 py-2.5">Actuación</th>
                <th className="px-3.5 py-2.5">Inmueble</th>
                <th className="px-3.5 py-2.5">Alerta</th>
                <th className="px-3.5 py-2.5">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {colaDeTrabajo.map((item, i) => (
                <tr key={`${item.actuacionId}-${item.alerta}-${i}`} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-3.5 py-2.5 font-mono text-[var(--text-sm)]">{item.actuacionId}</td>
                  <td className="px-3.5 py-2.5">{item.inmuebleId}</td>
                  <td className="px-3.5 py-2.5 font-semibold">{ETIQUETA_ALERTA[item.alerta]}</td>
                  <td className="px-3.5 py-2.5 text-[var(--color-text-secondary)]">{item.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
