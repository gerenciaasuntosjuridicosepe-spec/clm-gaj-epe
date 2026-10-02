/**
 * RF-19 — Generación automática de hitos al crear un CONTRATO: una fila por
 * cada hito de `CFG_HITOS_TIPO` del tipo correspondiente, con
 * `fecha_prevista` calculada según R13. ADENDA y LEGITIMO_ABONO no generan
 * hitos (R14).
 *
 * El punto más delicado (no explícito en el PRD, resuelto por lectura
 * cuidadosa de R7'/R13): los hitos ANTES_FIN_CONTRATO (H-01, H-04) de una
 * actuación nueva se cuentan desde el vencimiento efectivo de la actuación
 * ANTERIOR en la cadena (R7': "el vencimiento efectivo del ÚLTIMO CONTRATO
 * de la cadena, se salta el LEGITIMO_ABONO") — no desde la actuación que se
 * está creando (que todavía no tiene fecha_fin: eso se carga al formalizar,
 * RF-12). Si la actuación nueva es la primera del inmueble (sin
 * `actuacion_anterior_id`), no hay nada que anticipar todavía: esos hitos
 * quedan sin `fecha_prevista` hasta que haya un predecesor con vencimiento
 * conocido (R13 ya devuelve `undefined` en ese caso, sin inventar una
 * fecha). Los hitos DESPUES_HITO (H-02, H-21, H-03) usan la fecha_prevista
 * de H-01 recién calculada (todavía no cumplido, por eso no su
 * fecha_cumplimiento) como referencia.
 */
import { calcularFechaPrevista } from "./r13-fecha-prevista";
import { vencimientoEfectivo } from "./r15-vencimiento-efectivo";
import type { Actuacion, ActuacionHito, CfgHitoTipo, Feriado } from "../tipos";

export type HitoAGenerar = Pick<
  ActuacionHito,
  "hitoId" | "estadoHito" | "fechaPrevista" | "reprogramada"
> & { observaciones?: string };

/**
 * Busca el CONTRATO predecesor de una actuación en la cadena, saltando un
 * LEGITIMO_ABONO intermedio si lo hay (R7': A -> LA -> B, el vencimiento
 * que importa para B es el de A, no el del LA).
 */
export function buscarContratoPredecesor(actuacion: Actuacion, todasLasActuaciones: Actuacion[]): Actuacion | undefined {
  if (!actuacion.actuacionAnteriorId) return undefined;
  const anterior = todasLasActuaciones.find((a) => a.actuacionId === actuacion.actuacionAnteriorId);
  if (!anterior) return undefined;
  if (anterior.tipoActuacion === "CONTRATO") return anterior;
  if (anterior.tipoActuacion === "LEGITIMO_ABONO") return buscarContratoPredecesor(anterior, todasLasActuaciones);
  return undefined; // una ADENDA no debería ser predecesora de otra actuación en la cadena (R3')
}

export interface ParametrosGenerarHitos {
  actuacion: Actuacion;
  todasLasActuaciones: Actuacion[];
  cfgHitosTipo: Pick<CfgHitoTipo, "hitoId" | "tipoActuacion" | "plazoValor" | "plazoUnidad" | "computoDias" | "referencia" | "hitoReferenciaId">[];
  feriados: Pick<Feriado, "fecha" | "activo">[];
}

export function generarHitosParaActuacion(params: ParametrosGenerarHitos): HitoAGenerar[] {
  const { actuacion, todasLasActuaciones, cfgHitosTipo, feriados } = params;

  // R14: solo CONTRATO genera hitos.
  if (actuacion.tipoActuacion !== "CONTRATO") return [];

  const cfgsDelTipo = cfgHitosTipo.filter((c) => c.tipoActuacion === actuacion.tipoActuacion);

  const predecesor = buscarContratoPredecesor(actuacion, todasLasActuaciones);
  const vencimientoEfectivoPredecesor = predecesor ? vencimientoEfectivo(predecesor, todasLasActuaciones) : undefined;

  const resultados = new Map<string, HitoAGenerar>();

  // Primera pasada: ANTES_FIN_CONTRATO (no dependen de otro hito).
  for (const cfg of cfgsDelTipo.filter((c) => c.referencia === "ANTES_FIN_CONTRATO" || !c.referencia)) {
    const { fecha } = calcularFechaPrevista(cfg, { vencimientoEfectivo: vencimientoEfectivoPredecesor }, feriados);
    resultados.set(cfg.hitoId, { hitoId: cfg.hitoId, estadoHito: "PENDIENTE", fechaPrevista: fecha, reprogramada: false });
  }

  // Segunda pasada: DESPUES_HITO, usando la fecha_prevista ya calculada del hito de referencia
  // (ninguno está cumplido todavía, recién se está creando la actuación).
  for (const cfg of cfgsDelTipo.filter((c) => c.referencia === "DESPUES_HITO")) {
    const referencia = cfg.hitoReferenciaId ? resultados.get(cfg.hitoReferenciaId) : undefined;
    const { fecha } = calcularFechaPrevista(cfg, { fechaHitoReferencia: referencia?.fechaPrevista }, feriados);
    resultados.set(cfg.hitoId, { hitoId: cfg.hitoId, estadoHito: "PENDIENTE", fechaPrevista: fecha, reprogramada: false });
  }

  // Hitos sin plazo configurado (H-05/H-15/H-20 en la semilla actual) también se crean, sin fecha prevista.
  for (const cfg of cfgsDelTipo) {
    if (!resultados.has(cfg.hitoId)) {
      resultados.set(cfg.hitoId, { hitoId: cfg.hitoId, estadoHito: "PENDIENTE", fechaPrevista: undefined, reprogramada: false });
    }
  }

  // Orden estable por el orden de aparición en cfgHitosTipo (ya viene ordenado por `orden` en la semilla).
  return cfgsDelTipo.map((cfg) => resultados.get(cfg.hitoId)!);
}
