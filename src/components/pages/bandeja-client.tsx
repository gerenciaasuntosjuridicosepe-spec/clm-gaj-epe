"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/domain/kpi-card";
import { Alert } from "@/components/domain/alert";
import { SemaforoPlazo } from "@/components/domain/semaforo-plazo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Contrato } from "@/lib/types";
import { useRol } from "@/lib/session";
import { puedeVerContrato } from "@/lib/permisos";

/**
 * Componente cliente de la Bandeja de tareas. Recibe los contratos ya
 * resueltos por el Server Component (`app/page.tsx`), que es quien llama a
 * `getContratosProvider().listar()` — googleapis no puede correr en el
 * navegador, por eso la lectura de datos pasa por el servidor y acá solo se
 * filtra/renderiza según el rol simulado.
 */
export function BandejaClient({ contratos }: { contratos: Contrato[] }) {
  const { rolId } = useRol();
  const router = useRouter();

  const visibles = contratos.filter((c) => puedeVerContrato(rolId, c.etapaActual));
  const pendientes = visibles.filter(
    (c) => c.estadoAprobacionSolicitud === "Pendiente" || ["encuadre_legal", "analisis_financiero"].includes(c.etapaActual)
  );
  const vigentes = visibles.filter((c) => c.estadoContrato === "Vigente").length;

  function abrir(c: Contrato) {
    router.push(`/contratos/${c.id}`);
  }

  return (
    <AppShell titulo="Bandeja de tareas">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Bandeja de tareas</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Expedientes pendientes de tu rol · calculado al ingresar (PRD 6.3/7.1 — sin tareas de fondo programadas)
      </p>

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(148px,1fr))] gap-4">
        <KpiCard label="Contratos vigentes" value={vigentes} delta={`de ${contratos.length} cargados`} color="blue" />
        <KpiCard label="Pendientes de mi rol" value={pendientes.length} delta="según tu rol simulado" color="orange" />
        <KpiCard label="Vencimientos ≤30 días" value={2} delta="requieren revisión de renovación" color="danger" />
        <KpiCard
          label="Ciclo promedio (solic.→firma)"
          value={<>38<span className="text-[14px] font-semibold">d</span></>}
          delta="acumulado del período"
          color="success"
        />
      </div>

      <Alert variant="warning">
        <strong>Convenio SAE — Cooperativa Litoral</strong> vence el plazo prudencial de aprobación en pocos días. Verificar respaldo en expediente antes de aprobar o archivar.
      </Alert>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-3.5">
          <h3 className="font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">
            Expedientes pendientes ({pendientes.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[var(--text-base)]">
            <thead>
              <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
                <th className="px-3.5 py-2.5">Expediente</th>
                <th className="px-3.5 py-2.5">Documento / Tipo</th>
                <th className="px-3.5 py-2.5">Contraparte</th>
                <th className="px-3.5 py-2.5">Abogado</th>
                <th className="px-3.5 py-2.5">Plazo</th>
                <th className="px-3.5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {pendientes.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => abrir(c)}
                  className="cursor-pointer border-b border-[var(--color-border)] last:border-b-0 hover:bg-surface"
                >
                  <td className="px-3.5 py-2.5">
                    <div className="font-semibold">{c.id}</div>
                    <div className="text-[var(--text-sm)] text-[var(--color-text-muted)]">{c.objeto}</div>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <Badge variant="blue">{c.documento}</Badge> <Badge variant="gray">{c.tipoContrato}</Badge>
                  </td>
                  <td className="px-3.5 py-2.5">{c.contraparteRazonSocial}</td>
                  <td className="px-3.5 py-2.5">{c.abogadoACargo ?? "Sin asignar"}</td>
                  <td className="px-3.5 py-2.5">
                    <SemaforoPlazo fechaISO={c.fechaLimitePlazoPrudencial} />
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrir(c);
                      }}
                    >
                      Revisar
                    </Button>
                  </td>
                </tr>
              ))}
              {pendientes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3.5 py-6 text-center text-[var(--color-text-muted)]">
                    Sin expedientes pendientes para este rol.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </AppShell>
  );
}
