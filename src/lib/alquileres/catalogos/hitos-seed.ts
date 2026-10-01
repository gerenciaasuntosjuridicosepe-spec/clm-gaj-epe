/**
 * Semilla de HITOS (catálogo maestro) y CFG_HITOS_TIPO (plazos por tipo de
 * actuación) — fuente: xlsx reconstruido, hoja HITOS_SEMILLA, que a su vez
 * dice explícitamente: "RECONSTRUCCIÓN PARCIAL: solo constan en los PRD los
 * hitos listados [acá]". Los hitos H-06 a H-14 y H-16 a H-19 EXISTEN en el
 * libro original v0.1 (sección 6 del PRD v1 los da por conocidos: el
 * circuito completo de renovación) pero su nombre/plazo no consta en ningún
 * PRD — NO se inventan (regla del encargo). Quedan fuera de esta semilla;
 * ver docs/PENDIENTES-HUMANOS.md punto 1. Agregarlos cuando Carlos aporte
 * el original es: sumar una fila acá (HITOS_SEED) y, si generan hito en
 * CONTRATO, otra en CFG_HITOS_TIPO_SEED — no hace falta tocar ninguna regla
 * de negocio (R13/R14/R18 ya son genéricas sobre esta tabla).
 */
import type { CfgHitoTipo, Hito } from "../tipos";

export type SemillaHito = Pick<Hito, "hitoId" | "codigo" | "nombre" | "etapa" | "orden">;

/** "(a completar)" reproduce textualmente lo que dice el xlsx reconstruido — no es un valor inventado. */
const ETAPA_A_COMPLETAR = "(a completar)";

export const HITOS_SEED: SemillaHito[] = [
  { hitoId: "H-01", codigo: "AVISO_INICIO", nombre: "Aviso de inicio de GAJ al sector", etapa: "PREVIA", orden: 1 },
  { hitoId: "H-02", codigo: "RESPUESTA_SUCURSAL", nombre: "Respuesta de la sucursal", etapa: "PREVIA", orden: 2 },
  { hitoId: "H-21", codigo: "RESPUESTA_GERENCIA", nombre: "Respuesta de la gerencia", etapa: "PREVIA", orden: 3 },
  { hitoId: "H-03", codigo: "REITERACION", nombre: "Reiteración al sector", etapa: "PREVIA", orden: 4 },
  { hitoId: "H-04", codigo: "CARTA_DOCUMENTO", nombre: "Carta documento al locador", etapa: "PREVIA", orden: 5 },
  { hitoId: "H-05", codigo: "INICIO_EXPEDIENTE", nombre: "Inicio del expediente", etapa: ETAPA_A_COMPLETAR, orden: 6 },
  { hitoId: "H-15", codigo: "FIRMA", nombre: "Firma del contrato", etapa: ETAPA_A_COMPLETAR, orden: 7 },
  { hitoId: "H-20", codigo: "ARCHIVO", nombre: "Archivo del trámite", etapa: ETAPA_A_COMPLETAR, orden: 8 },
] as const satisfies SemillaHito[];

export type SemillaCfgHitoTipo = Pick<
  CfgHitoTipo,
  "cfgId" | "tipoActuacion" | "hitoId" | "plazoValor" | "plazoUnidad" | "computoDias" | "referencia" | "hitoReferenciaId" | "generaAlerta" | "orden"
>;

/**
 * Solo CONTRATO genera hitos (R14, DICCIONARIO de CFG_HITOS_TIPO). H-05,
 * H-15 y H-20 no tienen plazo_valor/plazo_unidad/referencia definidos en
 * ningún PRD (existen por RP-11, que mide duración de trámite, pero sin
 * plazo con el que alertar) — se modelan con `generaAlerta: false` y sin
 * plazo, en vez de inventar un número. Ver docs/PENDIENTES-HUMANOS.md.
 */
export const CFG_HITOS_TIPO_SEED: SemillaCfgHitoTipo[] = [
  {
    cfgId: "CFG-01",
    tipoActuacion: "CONTRATO",
    hitoId: "H-01",
    plazoValor: 4,
    plazoUnidad: "MESES",
    referencia: "ANTES_FIN_CONTRATO",
    generaAlerta: true,
    orden: 1,
  },
  {
    cfgId: "CFG-02",
    tipoActuacion: "CONTRATO",
    hitoId: "H-02",
    plazoValor: 5,
    plazoUnidad: "DIAS",
    computoDias: "HABILES",
    referencia: "DESPUES_HITO",
    hitoReferenciaId: "H-01",
    generaAlerta: true,
    orden: 2,
  },
  {
    cfgId: "CFG-21",
    tipoActuacion: "CONTRATO",
    hitoId: "H-21",
    plazoValor: 5,
    plazoUnidad: "DIAS",
    computoDias: "HABILES",
    referencia: "DESPUES_HITO",
    hitoReferenciaId: "H-01",
    generaAlerta: true,
    orden: 3,
  },
  {
    cfgId: "CFG-03",
    tipoActuacion: "CONTRATO",
    hitoId: "H-03",
    plazoValor: 7,
    plazoUnidad: "DIAS",
    computoDias: "HABILES",
    referencia: "DESPUES_HITO",
    hitoReferenciaId: "H-01", // D15: la reiteración se cuenta desde el mail inicial (H-01), no desde vencidos los 5 días
    generaAlerta: true,
    orden: 4,
  },
  {
    cfgId: "CFG-04",
    tipoActuacion: "CONTRATO",
    hitoId: "H-04",
    plazoValor: 3,
    plazoUnidad: "MESES",
    referencia: "ANTES_FIN_CONTRATO",
    generaAlerta: true,
    orden: 5,
  },
  {
    cfgId: "CFG-05",
    tipoActuacion: "CONTRATO",
    hitoId: "H-05",
    generaAlerta: false,
    orden: 6,
  },
  {
    cfgId: "CFG-15",
    tipoActuacion: "CONTRATO",
    hitoId: "H-15",
    generaAlerta: false,
    orden: 7,
  },
  {
    cfgId: "CFG-20",
    tipoActuacion: "CONTRATO",
    hitoId: "H-20",
    generaAlerta: false,
    orden: 8,
  },
] as const satisfies SemillaCfgHitoTipo[];

/** Hitos sin plazo configurado — se cumplen a mano, nunca disparan A4 (ver seed de arriba). */
export const HITOS_SIN_PLAZO = CFG_HITOS_TIPO_SEED.filter((c) => c.plazoValor === undefined).map((c) => c.hitoId);
