/**
 * RP-02 — Cartera de contratos vigentes: "Inmueble, locadores, sector,
 * destino, plazo, fechas, canon inicial informado, condición de IVA,
 * canon neto (R16), regla de actualización, expediente. Totales en neto y
 * cantidad sin dato de IVA." LECTOR no ve datos personales (los locadores
 * quedan vacíos para ese rol) ni puede exportar — eso lo decide la ruta
 * que llama a esto, no esta función (igual criterio que el resto del
 * módulo: la regla pura no sabe de sesiones ni roles).
 */
import type { Actuacion, ActuacionParte, Inmueble, Persona } from "../tipos";
import { armarBloqueLocadores } from "./datos-plantilla";
import { situacionVigencia } from "./campos-calculados";
import { canonNeto } from "./r16-canon-neto";

export interface FilaCartera {
  actuacionId: string;
  inmuebleId: string;
  inmuebleDomicilio: string;
  locadores: string;
  sectorInteresadoAreaId: string;
  destinoCategoria?: string;
  destinoDescripcion?: string;
  plazoMeses?: number;
  fechaInicio?: string;
  fechaFin?: string;
  canonInicial?: number;
  condicionIvaCanon?: string;
  canonNeto?: number;
  reglaActualizacion?: string;
  expedienteId?: string;
}

export interface ParametrosCartera {
  actuaciones: Actuacion[];
  inmuebles: Inmueble[];
  partes: ActuacionParte[];
  personas: Persona[];
  hoy: string;
  alicuotaIva: number;
}

export interface ResultadoCartera {
  filas: FilaCartera[];
  totalNeto: number;
  cantidadSinDatoIva: number;
}

export function calcularCarteraVigente(params: ParametrosCartera): ResultadoCartera {
  const { actuaciones, inmuebles, partes, personas, hoy, alicuotaIva } = params;
  const filas: FilaCartera[] = [];
  let totalNeto = 0;
  let cantidadSinDatoIva = 0;

  for (const contrato of actuaciones) {
    if (contrato.tipoActuacion !== "CONTRATO" || !contrato.activo) continue;
    if (situacionVigencia(contrato, actuaciones, hoy) !== "VIGENTE") continue;

    const inmueble = inmuebles.find((i) => i.inmuebleId === contrato.inmuebleId);
    const partesDeEsta = partes.filter((p) => p.actuacionId === contrato.actuacionId);
    const resultadoNeto = canonNeto(contrato.canonInicial, contrato.condicionIvaCanon, alicuotaIva);

    if (resultadoNeto.incluido) totalNeto += resultadoNeto.neto;
    else cantidadSinDatoIva += 1;

    filas.push({
      actuacionId: contrato.actuacionId,
      inmuebleId: contrato.inmuebleId,
      inmuebleDomicilio: inmueble?.domicilio ?? "",
      locadores: armarBloqueLocadores(partesDeEsta, personas),
      sectorInteresadoAreaId: contrato.sectorInteresadoAreaId,
      destinoCategoria: contrato.destinoCategoria,
      destinoDescripcion: contrato.destinoDescripcion,
      plazoMeses: contrato.plazoMeses,
      fechaInicio: contrato.fechaInicio,
      fechaFin: contrato.fechaFin,
      canonInicial: contrato.canonInicial,
      condicionIvaCanon: contrato.condicionIvaCanon,
      canonNeto: resultadoNeto.incluido ? resultadoNeto.neto : undefined,
      reglaActualizacion: contrato.reglaActualizacion,
      expedienteId: contrato.expedienteId,
    });
  }

  return { filas, totalNeto, cantidadSinDatoIva };
}
