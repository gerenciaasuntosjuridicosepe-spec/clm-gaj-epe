/**
 * Fechas y días hábiles del módulo de Alquileres — módulo propio,
 * independiente de `src/lib/fechas.ts` del CLM (sección 5 del PRD v2.1: "El
 * módulo tiene su propio fechas.ts"; no se toca el semáforo del CLM).
 *
 * Reglas duras (sección 5 del encargo, NF-11 del PRD):
 *  - Las fechas de calendario son SIEMPRE texto "yyyy-mm-dd". Prohibido
 *    `new Date("yyyy-mm-dd")` (interpreta en UTC, desfasa en Argentina) y
 *    `toISOString().slice(0,10)` (usa UTC, no la zona de Argentina).
 *  - "Hoy" se calcula siempre en America/Argentina/Buenos_Aires, nunca con
 *    la hora local del proceso (que en Vercel es UTC).
 *  - `Date.UTC(...)` se usa acá únicamente como unidad de cuenta neutral
 *    para aritmética de calendario (sumar días/meses, día de la semana) —
 *    nunca para representar un instante real ni para parsear un string con
 *    el constructor `Date`.
 */
import type { Feriado } from "./tipos";

export type NivelSemaforo = "verde" | "amarillo" | "naranja" | "rojo" | "gris";

export interface UmbralesSemaforo {
  /** Más de este valor: verde. PARAMETROS.semaforo_umbral_1_dias (180 por defecto). */
  u1: number;
  /** Más de este valor (y hasta u1): amarillo. PARAMETROS.semaforo_umbral_2_dias (120). */
  u2: number;
  /** Más de este valor (y hasta u2): naranja. Hasta este valor o vencido: rojo. PARAMETROS.semaforo_umbral_3_dias (60). */
  u3: number;
}

export const UMBRALES_SEMAFORO_DEFECTO: UmbralesSemaforo = { u1: 180, u2: 120, u3: 60 };

interface ComponentesFecha {
  anio: number;
  mes: number; // 1-based
  dia: number;
}

const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Valida el formato "yyyy-mm-dd" (sin validar que la fecha exista realmente — ver parsearFecha). */
export function esFechaValida(fechaYMD: string): boolean {
  return parsearFecha(fechaYMD) !== null;
}

/**
 * Parsea "yyyy-mm-dd" a componentes, validando que la fecha exista
 * realmente (ej. rechaza "2026-02-30"). Nunca usa el constructor `Date`.
 */
export function parsearFecha(fechaYMD: string): ComponentesFecha | null {
  const m = PATRON_FECHA.exec(fechaYMD);
  if (!m) return null;
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (mes < 1 || mes > 12) return null;
  if (dia < 1 || dia > diasEnMes(anio, mes)) return null;
  return { anio, mes, dia };
}

function formatear(c: ComponentesFecha): string {
  const mm = String(c.mes).padStart(2, "0");
  const dd = String(c.dia).padStart(2, "0");
  return `${c.anio}-${mm}-${dd}`;
}

/** Cantidad de días del mes dado (usa Date.UTC como calculadora pura, no como instante). */
export function diasEnMes(anio: number, mes1based: number): number {
  // Día 0 del mes siguiente = último día del mes pedido.
  return new Date(Date.UTC(anio, mes1based, 0)).getUTCDate();
}

/** "Hoy" en America/Argentina/Buenos_Aires, como "yyyy-mm-dd" — nunca hora local del proceso. */
export function hoy(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * "Ahora" en America/Argentina/Buenos_Aires, con hora, como ISO 8601 con el
 * offset `-03:00` explícito (nunca `toISOString()`, que da UTC) — para
 * campos de auditoría con hora (`creadoEn`/`modificadoEn`/`envioDeclaradoEn`),
 * no para fechas de calendario (esas son siempre "yyyy-mm-dd", ver `hoy()`).
 * Extraída acá desde `repositorio-mock.ts`/`repositorio-sheets.ts` (que
 * tenían cada uno su propia copia idéntica) para no triplicarla al agregar
 * un tercer lugar que necesita "ahora con hora" (RF-23, `envioDeclaradoEn`).
 */
export function ahoraIso(): string {
  return new Date().toLocaleString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" }).replace(" ", "T") + "-03:00";
}

/** Día de la semana (0 = domingo … 6 = sábado) de una fecha "yyyy-mm-dd", sin desfase horario. */
export function diaDeSemana(fechaYMD: string): number {
  const c = parsearFecha(fechaYMD);
  if (!c) throw new Error(`Fecha inválida: "${fechaYMD}"`);
  return new Date(Date.UTC(c.anio, c.mes - 1, c.dia)).getUTCDay();
}

export function esFinDeSemana(fechaYMD: string): boolean {
  const dow = diaDeSemana(fechaYMD);
  return dow === 0 || dow === 6;
}

/** Feriado ACTIVO en esa fecha exacta (R13: "no estén en FERIADOS activos"). */
export function esFeriado(fechaYMD: string, feriados: Pick<Feriado, "fecha" | "activo">[]): boolean {
  return feriados.some((f) => f.activo && f.fecha === fechaYMD);
}

/** Día hábil = ni fin de semana ni feriado activo (R13). */
export function esDiaHabil(fechaYMD: string, feriados: Pick<Feriado, "fecha" | "activo">[]): boolean {
  return !esFinDeSemana(fechaYMD) && !esFeriado(fechaYMD, feriados);
}

/** true si hay al menos un feriado CARGADO (activo o no) para ese año — base del "cómputo aproximado" (R13/T5). */
export function anioTieneFeriadosCargados(anio: number, feriados: Pick<Feriado, "fecha" | "activo">[]): boolean {
  const prefijo = String(anio);
  return feriados.some((f) => f.fecha.startsWith(prefijo));
}

/** Suma (o resta, con n negativo) días de calendario corridos — aritmética pura, sin huso horario. */
export function sumarDiasCorridos(fechaYMD: string, n: number): string {
  const c = parsearFecha(fechaYMD);
  if (!c) throw new Error(`Fecha inválida: "${fechaYMD}"`);
  const ms = Date.UTC(c.anio, c.mes - 1, c.dia + n);
  const d = new Date(ms);
  return formatear({ anio: d.getUTCFullYear(), mes: d.getUTCMonth() + 1, dia: d.getUTCDate() });
}

/**
 * Suma (o resta) meses de calendario, al estilo EDATE de Sheets: conserva el
 * día cuando existe en el mes destino, si no, usa el último día de ese mes
 * (ej. 31/01 + 1 mes = 28/02, no 03/03 — nunca "rebalsa" al mes siguiente).
 */
export function sumarMeses(fechaYMD: string, n: number): string {
  const c = parsearFecha(fechaYMD);
  if (!c) throw new Error(`Fecha inválida: "${fechaYMD}"`);
  const totalMeses = c.mes - 1 + n;
  const anioDestino = c.anio + Math.floor(totalMeses / 12);
  const mesDestino = ((totalMeses % 12) + 12) % 12; // 0-based
  const diaDestino = Math.min(c.dia, diasEnMes(anioDestino, mesDestino + 1));
  return formatear({ anio: anioDestino, mes: mesDestino + 1, dia: diaDestino });
}

/** Diferencia en días de calendario entre dos fechas (hasta - desde). Positivo = "hasta" es posterior. */
export function diferenciaDias(desdeYMD: string, hastaYMD: string): number {
  const desde = parsearFecha(desdeYMD);
  const hasta = parsearFecha(hastaYMD);
  if (!desde || !hasta) throw new Error("Fecha inválida en diferenciaDias");
  const msDesde = Date.UTC(desde.anio, desde.mes - 1, desde.dia);
  const msHasta = Date.UTC(hasta.anio, hasta.mes - 1, hasta.dia);
  return Math.round((msHasta - msDesde) / (1000 * 60 * 60 * 24));
}

/** Días restantes hasta `fechaYMD` contados desde "hoy" (en Argentina). Negativo = ya venció. */
export function diasRestantesDesdeHoy(fechaYMD: string): number {
  return diferenciaDias(hoy(), fechaYMD);
}

export interface ResultadoDiasHabiles {
  fecha: string;
  /** true si algún año recorrido por el cómputo no tiene ningún feriado cargado (R13: "cómputo aproximado"). */
  aproximado: boolean;
}

/**
 * Suma `cantidad` días HÁBILES a partir de `fechaBaseYMD`, que actúa como
 * "día 0" (R13: "el día de referencia es el día 0" — no cuenta como uno de
 * los días hábiles sumados, se empieza a contar desde el día siguiente).
 * Solo admite `cantidad > 0` (uso: DESPUES_HITO hacia adelante).
 */
export function sumarDiasHabiles(
  fechaBaseYMD: string,
  cantidad: number,
  feriados: Pick<Feriado, "fecha" | "activo">[]
): ResultadoDiasHabiles {
  if (cantidad <= 0) throw new Error("sumarDiasHabiles espera una cantidad positiva de días hábiles");
  let cursor = fechaBaseYMD;
  let contados = 0;
  let aproximado = false;
  while (contados < cantidad) {
    cursor = sumarDiasCorridos(cursor, 1);
    const anio = Number(cursor.slice(0, 4));
    if (!anioTieneFeriadosCargados(anio, feriados)) aproximado = true;
    if (esDiaHabil(cursor, feriados)) contados++;
  }
  return { fecha: cursor, aproximado };
}

/** Clasifica días restantes según los umbrales del semáforo (C3 del PRD v1, sección 6). */
export function nivelSemaforo(dias: number | null, umbrales: UmbralesSemaforo = UMBRALES_SEMAFORO_DEFECTO): NivelSemaforo {
  if (dias === null) return "gris";
  if (dias > umbrales.u1) return "verde";
  if (dias > umbrales.u2) return "amarillo";
  if (dias > umbrales.u3) return "naranja";
  return "rojo";
}

/** Formato visible dd/mm/aaaa (sección 5.4 del PRD v2.1) — reordena el string, nunca construye un Date. */
export function formatearFecha(fechaYMD?: string): string {
  if (!fechaYMD) return "—";
  const c = parsearFecha(fechaYMD.slice(0, 10));
  if (!c) return "—";
  return `${String(c.dia).padStart(2, "0")}/${String(c.mes).padStart(2, "0")}/${c.anio}`;
}

/** Pesos con separador de miles y coma decimal (sección 5.4 del PRD v2.1). */
export function formatearMonto(monto?: number): string {
  if (monto === undefined || monto === null) return "—";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(monto);
}
