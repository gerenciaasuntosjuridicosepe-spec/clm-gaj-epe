/** Utilidades de fecha/semáforo — sección 3.8 del design system. */

export type NivelSemaforo = "verde" | "amarillo" | "rojo" | "gris";

/**
 * F0-7 (hallazgo del PRD v2.1, sección 3): antes esta función hacía
 * `new Date(fechaISO)` sobre un string `yyyy-mm-dd` — el motor de JS
 * interpreta eso como medianoche UTC, que en el huso de Argentina (UTC-3)
 * cae en el día anterior. Con `new Date()` para "hoy" el bug se duplicaba
 * (hora local del proceso, que en Vercel corre en UTC). Resultado: un
 * contrato podía mostrarse vencido un día antes de lo real, o "hoy" podía
 * saltar de fecha después de las 21:00 hora Argentina.
 *
 * La corrección no usa `Date` para interpretar fechas de calendario en
 * absoluto: extrae año/mes/día como texto y los ancla a UTC solo como una
 * unidad de cuenta neutral para restar días — nunca para representar un
 * instante real. "Hoy" se calcula con `Intl.DateTimeFormat` en la zona
 * America/Argentina/Buenos_Aires, nunca con la hora local del proceso.
 */
function soloFecha(fechaISO: string): string {
  // Admite tanto "yyyy-mm-dd" como un ISO completo ("yyyy-mm-ddTHH:mm:ss...");
  // en ambos casos el calendario que importa son los primeros 10 caracteres.
  return fechaISO.slice(0, 10);
}

function parsearComponentes(fechaYMD: string): { anio: number; mes: number; dia: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaYMD);
  if (!m) return null;
  return { anio: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) };
}

/** Día de calendario (yyyy-mm-dd) de "hoy" en America/Argentina/Buenos_Aires, sin pasar por `Date` local. */
export function hoyEnArgentina(): string {
  // en-CA formatea como yyyy-mm-dd directamente — evita tener que reordenar
  // componentes de dd/mm/yyyy a mano.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function diferenciaDias(desdeYMD: string, hastaYMD: string): number | null {
  const desde = parsearComponentes(desdeYMD);
  const hasta = parsearComponentes(hastaYMD);
  if (!desde || !hasta) return null;
  // Date.UTC con componentes explícitos es una unidad de cuenta (no un
  // instante real): como las dos fechas se anclan igual, la resta da la
  // diferencia de días de calendario sin importar la zona horaria del
  // proceso que ejecuta esto.
  const msDesde = Date.UTC(desde.anio, desde.mes - 1, desde.dia);
  const msHasta = Date.UTC(hasta.anio, hasta.mes - 1, hasta.dia);
  return Math.round((msHasta - msDesde) / (1000 * 60 * 60 * 24));
}

export function diasRestantes(fechaISO?: string): number | null {
  if (!fechaISO) return null;
  const hoy = hoyEnArgentina();
  return diferenciaDias(hoy, soloFecha(fechaISO));
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
  const componentes = parsearComponentes(soloFecha(fechaISO));
  if (!componentes) return "—";
  const { anio, mes, dia } = componentes;
  const dd = String(dia).padStart(2, "0");
  const mm = String(mes).padStart(2, "0");
  return `${dd}/${mm}/${anio}`;
}

export function formatearMonto(monto?: number, moneda = "ARS"): string {
  if (monto === undefined) return "—";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: moneda === "ARS" ? "ARS" : moneda }).format(monto);
}
