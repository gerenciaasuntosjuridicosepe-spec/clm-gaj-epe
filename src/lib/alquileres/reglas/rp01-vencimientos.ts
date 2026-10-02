/**
 * RP-01 — Vencimientos por horizonte: "Contratos que vencen en 30, 60, 90,
 * 120, 180 o 365 días, por gerencia, sucursal y localidad, con semáforo y
 * estado de la renovación." Agregación pura sobre reglas ya probadas (R15
 * vencimiento efectivo, C3 semáforo, C4 renovación en curso) — devuelve
 * una fila por CONTRATO vigente con sus dimensiones de agrupación como
 * columnas (sector/área e inmueble -> localidad), para que cualquier
 * pivot/filtro en la planilla exportada (CSV) agrupe "por gerencia,
 * sucursal y localidad" sin que el servidor tenga que decidir de antemano
 * cómo se va a mirar el reporte.
 */
import { diferenciaDias, nivelSemaforo, UMBRALES_SEMAFORO_DEFECTO, type NivelSemaforo, type UmbralesSemaforo } from "../fechas";
import type { Actuacion, Inmueble } from "../tipos";
import { vencimientoEfectivo } from "./r15-vencimiento-efectivo";
import { situacionVigencia, tieneSucesoraActiva } from "./campos-calculados";

/** Los 6 horizontes del PRD, de menor a mayor. */
export const HORIZONTES_DIAS = [30, 60, 90, 120, 180, 365] as const;
export type HorizonteDias = (typeof HORIZONTES_DIAS)[number];

export interface FilaVencimiento {
  actuacionId: string;
  inmuebleId: string;
  sectorInteresadoAreaId: string;
  localidadId?: string;
  vencimientoEfectivo: string;
  diasRestantes: number;
  nivel: NivelSemaforo;
  renovacionEnCurso: boolean; // C4
  /** El horizonte más chico del PRD en el que entra (null si vence en más de 365 días, o ya venció). */
  horizonte: HorizonteDias | null;
}

function horizonteDe(dias: number): HorizonteDias | null {
  if (dias < 0) return null; // ya venció — eso es A5 (ocupación sin contrato), no este reporte.
  return HORIZONTES_DIAS.find((h) => dias <= h) ?? null;
}

export function calcularVencimientosPorHorizonte(
  actuaciones: Actuacion[],
  inmuebles: Inmueble[],
  hoy: string,
  umbrales: UmbralesSemaforo = UMBRALES_SEMAFORO_DEFECTO
): FilaVencimiento[] {
  const filas: FilaVencimiento[] = [];

  for (const contrato of actuaciones) {
    if (contrato.tipoActuacion !== "CONTRATO" || !contrato.activo) continue;
    if (situacionVigencia(contrato, actuaciones, hoy) !== "VIGENTE") continue;

    const venc = vencimientoEfectivo(contrato, actuaciones);
    if (!venc) continue;

    const dias = diferenciaDias(hoy, venc);
    const inmueble = inmuebles.find((i) => i.inmuebleId === contrato.inmuebleId);

    filas.push({
      actuacionId: contrato.actuacionId,
      inmuebleId: contrato.inmuebleId,
      sectorInteresadoAreaId: contrato.sectorInteresadoAreaId,
      localidadId: inmueble?.localidadId,
      vencimientoEfectivo: venc,
      diasRestantes: dias,
      nivel: nivelSemaforo(dias, umbrales),
      renovacionEnCurso: tieneSucesoraActiva(contrato, actuaciones),
      horizonte: horizonteDe(dias),
    });
  }

  return filas.sort((a, b) => a.diasRestantes - b.diasRestantes);
}
