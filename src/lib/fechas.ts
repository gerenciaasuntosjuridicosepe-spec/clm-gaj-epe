/** Utilidades de fecha/semáforo — sección 3.8 del design system. */

export type NivelSemaforo = "verde" | "amarillo" | "rojo" | "gris";

export function diasRestantes(fechaISO?: string): number | null {
  if (!fechaISO) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaISO);
  fecha.setHours(0, 0, 0, 0);
  const diffMs = fecha.getTime() - hoy.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Umbrales de semáforo (no definidos con precisión en el PRD ni en el design
 * system — son una estimación fundamentada, a validar con Jurídicos antes de
 * ir a producción, tal como el plazo prudencial de la sección 6.2 del PRD).
 */
export function nivelSemaforo(dias: number | null): NivelSemaforo {
  if (dias === null) return "gris";
  if (dias < 0) return "rojo";
  if (dias <= 7) return "rojo";
  if (dias <= 30) return "amarillo";
  return "verde";
}

export function formatearFecha(fechaISO?: string): string {
  if (!fechaISO) return "—";
  const f = new Date(fechaISO);
  return f.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatearMonto(monto?: number, moneda = "ARS"): string {
  if (monto === undefined) return "—";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: moneda === "ARS" ? "ARS" : moneda }).format(monto);
}
