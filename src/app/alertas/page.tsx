import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/domain/alert";
import { listarVisibles } from "@/lib/data/provider";
import { formatearFecha, formatearMonto, diasRestantes } from "@/lib/fechas";
import { auth } from "@/auth";
import { rolClmDeSesion } from "@/lib/auth-guard";

// Los datos vienen de Sheets/mock y cambian en cualquier momento (nuevas
// solicitudes, aprobaciones, vencimientos); no tiene sentido cachear esta
// página en build time ni servir una versión vieja.
export const dynamic = "force-dynamic";

/**
 * Alertas de vencimiento — sección 6.3 del PRD: calculadas al ingresar a la
 * aplicación (sin tareas de fondo programadas, ver 7.1/8.2), sin envío por
 * email. No necesita interactividad de cliente: es Server Component y lee
 * directamente del provider (mock o Google Sheets, según esté configurado).
 */
export default async function AlertasPage() {
  const session = await auth();
  const contratos = await listarVisibles(rolClmDeSesion(session));
  const alertas = contratos
    .flatMap((c) => c.hitos.map((h) => ({ contrato: c, hito: h, dias: diasRestantes(h.fecha) })))
    .sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0));

  return (
    <AppShell titulo="Alertas de vencimiento">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Alertas de vencimiento</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Calculadas al ingresar a la aplicación — sin envío por email (decisión de producto, PRD 6.3)
      </p>

      {alertas.map(({ contrato, hito, dias }, i) => {
        const variant = dias !== null && dias < 0 ? "danger" : dias !== null && dias <= 30 ? "warning" : "info";
        const texto =
          hito.tipo === "vencimiento_vigencia"
            ? `vigencia ${dias !== null && dias < 0 ? "venció" : "vence"} el ${formatearFecha(hito.fecha)}${dias !== null && dias < 0 ? `, hace ${Math.abs(dias)} días` : ""}.`
            : hito.tipo === "pago"
            ? `hito de pago de ${formatearMonto(hito.monto, contrato.moneda)} el ${formatearFecha(hito.fecha)}.`
            : `hito libre: "${hito.descripcion}" el ${formatearFecha(hito.fecha)}.`;
        return (
          <Alert key={i} variant={variant}>
            <strong>{contrato.id}</strong> — {contrato.objeto}: {texto}
          </Alert>
        );
      })}

      {alertas.length === 0 && (
        <p className="text-[var(--color-text-muted)]">No hay hitos cargados todavía.</p>
      )}
    </AppShell>
  );
}
