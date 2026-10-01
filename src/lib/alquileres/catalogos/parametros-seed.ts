/**
 * Semilla de PARAMETROS — una sola fuente de verdad para los valores que el
 * PRD fija por defecto (sección 10/12 del v1, M14, D13). Editable desde
 * Administración (RF-37): esto es el valor inicial con el que se aprovisiona
 * la planilla, no una constante hardcodeada que el código lea directo —
 * el código siempre lee PARAMETROS (vía el repositorio), nunca esta lista.
 *
 * Los valores marcados "(a definir)" en el xlsx reconstruido (remitente de
 * mail, carpetas de Drive) no se inventan: quedan vacíos hasta que un humano
 * los complete (ver docs/PENDIENTES-HUMANOS.md) — con valor vacío el código
 * debe tratarlos como "no configurado", nunca asumir un valor por defecto
 * propio para esto (son datos de infraestructura real, no de dominio).
 */
import type { Parametro } from "../tipos";

export type SemillaParametro = Pick<Parametro, "clave" | "valor" | "descripcion">;

export const PARAMETROS_SEED: SemillaParametro[] = [
  { clave: "alicuota_iva", valor: "21", descripcion: "Alícuota de IVA para el canon neto (R16)." },
  { clave: "semaforo_umbral_1_dias", valor: "180", descripcion: "Verde hasta este valor; amarillo entre 121 y 180." },
  { clave: "semaforo_umbral_2_dias", valor: "120", descripcion: "Naranja entre 61 y 120." },
  { clave: "semaforo_umbral_3_dias", valor: "60", descripcion: "Rojo hasta 60 días o vencido." },
  { clave: "retencion_backups_dias", valor: "30", descripcion: "Días de retención de respaldos." },
  { clave: "dias_alerta_respaldo", valor: "7", descripcion: "Días sin respaldo para la alerta A8 (v2.1)." },
  { clave: "remitente_mail_gaj", valor: "", descripcion: "Casilla de GAJ usada como remitente sugerido en borradores. (a definir por un humano)" },
  { clave: "carpeta_drive_documentos", valor: "", descripcion: "Carpeta de Drive para documentos generados. (a definir por un humano)" },
  { clave: "carpeta_drive_respaldos", valor: "", descripcion: "Carpeta de Drive para respaldos. (a definir por un humano)" },
  { clave: "hora_resumen_diario", valor: "07:00", descripcion: "Reservado para el resumen diario (fase posterior)." },
] as const satisfies SemillaParametro[];

/** Claves de parámetro conocidas, para validar lecturas (evita typos silenciosos). */
export const CLAVES_PARAMETRO = PARAMETROS_SEED.map((p) => p.clave);

export type ClaveParametro = (typeof PARAMETROS_SEED)[number]["clave"];

/** Busca un valor numérico de PARAMETROS_SEED (uso en pruebas/valores por defecto; en runtime real se lee del repositorio). */
export function numeroParametro(claves: SemillaParametro[], clave: string, porDefecto: number): number {
  const p = claves.find((x) => x.clave === clave);
  if (!p || p.valor === "") return porDefecto;
  const n = Number(p.valor);
  return Number.isFinite(n) ? n : porDefecto;
}
