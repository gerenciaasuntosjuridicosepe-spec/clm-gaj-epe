"use client";
import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarioMes } from "@/components/domain/calendario-mes";
import { CalendarioFuturo } from "@/components/domain/calendario-futuro";
import { EventoCalendario, TIPO_EVENTO_LABEL, TipoEventoCalendario } from "@/lib/calendario";
import { MOCK_TIPOS_CONTRATO } from "@/lib/data/mock-catalogos";
import { useRol } from "@/lib/session";
import { puedeVerContrato } from "@/lib/permisos";
import { TipoContrato } from "@/lib/types";

const TIPOS_EVENTO: TipoEventoCalendario[] = ["vencimiento_vigencia", "pago", "libre", "plazo_aprobacion"];

/**
 * Calendario de vencimientos e hitos — módulo agregado a pedido, cruza en
 * una sola vista todo lo que hoy vive repartido entre "Alertas de
 * vencimiento" (PRD 6.3) y el plazo prudencial de aprobación (PRD 6.2), con
 * filtros y una proyección a futuro configurable.
 */
export function CalendarioClient({ eventos }: { eventos: EventoCalendario[] }) {
  const { rolId } = useRol();
  const [tipoContrato, setTipoContrato] = React.useState<TipoContrato | "">("");
  const [tipoEvento, setTipoEvento] = React.useState<TipoEventoCalendario | "">("");
  const [sector, setSector] = React.useState("");

  const sectoresResponsables = Array.from(new Set(eventos.map((e) => e.gerenciaResponsable))).sort();

  const filtrados = eventos.filter((ev) => {
    if (!puedeVerContrato(rolId, ev.etapaActual)) return false;
    if (tipoContrato && ev.tipoContrato !== tipoContrato) return false;
    if (tipoEvento && ev.tipoEvento !== tipoEvento) return false;
    if (sector && ev.gerenciaResponsable !== sector) return false;
    return true;
  });

  const filtrosActivos = [
    tipoContrato && { label: `Tipo de contrato: ${tipoContrato}`, clear: () => setTipoContrato("") },
    tipoEvento && { label: `Vencimiento: ${TIPO_EVENTO_LABEL[tipoEvento]}`, clear: () => setTipoEvento("") },
    sector && { label: `Sector responsable: ${sector}`, clear: () => setSector("") },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  function limpiarFiltros() {
    setTipoContrato("");
    setTipoEvento("");
    setSector("");
  }

  return (
    <AppShell titulo="Calendario">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Calendario</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Vencimientos e hitos de todos los procesos — vigencia, pagos, hitos libres y plazos de aprobación
      </p>

      <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4.5 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1">
            <label className="mb-1 block text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Tipo de contrato
            </label>
            <Select value={tipoContrato} onChange={(e) => setTipoContrato(e.target.value as TipoContrato | "")}>
              <option value="">Todos</option>
              {MOCK_TIPOS_CONTRATO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-1 block text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Tipo de vencimiento
            </label>
            <Select value={tipoEvento} onChange={(e) => setTipoEvento(e.target.value as TipoEventoCalendario | "")}>
              <option value="">Todos</option>
              {TIPOS_EVENTO.map((t) => (
                <option key={t} value={t}>{TIPO_EVENTO_LABEL[t]}</option>
              ))}
            </Select>
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-1 block text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Sector responsable
            </label>
            <Select value={sector} onChange={(e) => setSector(e.target.value)}>
              <option value="">Todos</option>
              {sectoresResponsables.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
        </div>

        {filtrosActivos.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {filtrosActivos.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-surface-2 px-2.5 py-1 text-[var(--text-xs)] text-[var(--color-text-secondary)]"
              >
                {f.label}
                <button onClick={f.clear} className="text-[var(--color-text-muted)]">×</button>
              </span>
            ))}
            <Button variant="ghost" size="xs" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="mes">
        <TabsList className="mb-4">
          <TabsTrigger value="mes">Vista mensual</TabsTrigger>
          <TabsTrigger value="futuro">Vista a futuro</TabsTrigger>
        </TabsList>
        <TabsContent value="mes">
          <CalendarioMes eventos={filtrados} />
        </TabsContent>
        <TabsContent value="futuro">
          <CalendarioFuturo eventos={filtrados} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
