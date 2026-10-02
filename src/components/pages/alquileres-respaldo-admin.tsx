"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/domain/alert";

/**
 * RF-39 [CAMBIO v2.1] — Tarjeta de respaldo, solo para ADMINISTRADOR. El
 * botón NO copia nada a Drive (necesitaría la API real de Google, fuera
 * de alcance) — registra que el ADMINISTRADOR ya hizo la copia manual por
 * fuera de la app, igual criterio que "Marcar como enviado" (RF-23).
 */
export function RespaldoAdmin({ ultimoRespaldoEn, diasDesdeUltimoRespaldo, alertaA8 }: { ultimoRespaldoEn?: string; diasDesdeUltimoRespaldo?: number; alertaA8: boolean }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function registrarRespaldo() {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/alquileres/administracion/respaldo", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo registrar el respaldo.");
        return;
      }
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4.5 shadow-[var(--shadow-sm)]">
      <h3 className="mb-2.5 font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">Respaldo (RF-39, solo ADMINISTRADOR)</h3>
      {alertaA8 && (
        <Alert variant="danger">
          {ultimoRespaldoEn ? `A8: sin respaldo hace ${diasDesdeUltimoRespaldo} día(s).` : "A8: nunca se registró un respaldo."}
        </Alert>
      )}
      <p className="mb-3 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        {ultimoRespaldoEn ? `Último respaldo: hace ${diasDesdeUltimoRespaldo} día(s) (${ultimoRespaldoEn}).` : "Todavía no se registró ningún respaldo."}
        {" "}
        La copia real a Drive se hace manualmente, por fuera de la app (D13) — este botón solo registra que ya se hizo.
      </p>
      {error && <Alert variant="danger">{error}</Alert>}
      <Button variant="primary" size="sm" onClick={registrarRespaldo} disabled={enviando}>
        {enviando ? "Registrando..." : "Registrar que hice el respaldo manual hoy"}
      </Button>
    </div>
  );
}
