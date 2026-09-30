"use client";
import { Contrato } from "@/lib/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EstadoFlow } from "./estado-flow";
import { SemaforoPlazo } from "./semaforo-plazo";
import { HistorialAuditoria } from "./historial-auditoria";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatearFecha } from "@/lib/fechas";

/**
 * Drawer de detalle rápido de contrato — sección 3.13 / 10.3 del design
 * system: mejora explícita sobre la referencia (que resuelve todo con modal
 * centrado), pensada para que un aprobador revise un expediente sin perder
 * el listado de fondo.
 */
export function DetalleContratoSheet({
  contrato,
  open,
  onOpenChange,
}: {
  contrato: Contrato | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!contrato) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div>
            <SheetTitle className="font-[var(--font-display)] text-[var(--text-xl)] font-bold">
              {contrato.id}
            </SheetTitle>
            <div className="mt-0.5 text-[var(--text-sm)] text-white/85">
              {contrato.objeto} — {contrato.contraparteRazonSocial}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4.5">
          <div className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            Flujo del expediente
          </div>
          <div className="mb-5">
            <EstadoFlow actual={contrato.etapaActual} />
          </div>

          <dl className="mb-3.5 grid grid-cols-[120px_1fr] gap-x-2.5 gap-y-1.5 text-[var(--text-base)]">
            <dt className="font-semibold text-[var(--color-text-secondary)]">Documento</dt>
            <dd>{contrato.documento}</dd>
            <dt className="font-semibold text-[var(--color-text-secondary)]">Tipo</dt>
            <dd>{contrato.tipoContrato}</dd>
            <dt className="font-semibold text-[var(--color-text-secondary)]">Área solicitante</dt>
            <dd>{contrato.areaSolicitante}</dd>
            <dt className="font-semibold text-[var(--color-text-secondary)]">Contraparte</dt>
            <dd>
              {contrato.contraparteRazonSocial} · {contrato.contraparteIdentificacion}
            </dd>
            <dt className="font-semibold text-[var(--color-text-secondary)]">Abogado a cargo</dt>
            <dd>{contrato.abogadoACargo ?? "Sin asignar"}</dd>
            {contrato.numeroExpedienteVinculado && (
              <>
                <dt className="font-semibold text-[var(--color-text-secondary)]">N° expediente</dt>
                <dd>{contrato.numeroExpedienteVinculado}</dd>
              </>
            )}
            <dt className="font-semibold text-[var(--color-text-secondary)]">Respaldo exped.</dt>
            <dd>
              <Badge variant={contrato.respaldoEnExpediente ? "success" : "danger"}>
                {contrato.respaldoEnExpediente ? "Sí" : "No"}
              </Badge>
            </dd>
            {contrato.fechaLimitePlazoPrudencial && (
              <>
                <dt className="font-semibold text-[var(--color-text-secondary)]">Plazo prudencial</dt>
                <dd>
                  <SemaforoPlazo fechaISO={contrato.fechaLimitePlazoPrudencial} /> ({formatearFecha(contrato.fechaLimitePlazoPrudencial)})
                </dd>
              </>
            )}
          </dl>

          <div className="mb-2 mt-5 text-[9px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            Historial reciente
          </div>
          <HistorialAuditoria eventos={contrato.historial} />

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" size="sm">
              Archivar
            </Button>
            <Button variant="primary" size="sm">
              Aprobar y avanzar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
