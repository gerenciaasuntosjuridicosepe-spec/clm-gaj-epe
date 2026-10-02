/**
 * Dashboard (PRD v1, sección 8) — agregación pura de las reglas ya
 * implementadas (alertas A1-A8, campos calculados C1/C4, canon neto R16)
 * sobre un conjunto de actuaciones/hitos/documentos. La página solo lee
 * los datos y llama a esto; ninguna cuenta se calcula "a mano" en el JSX.
 *
 * Nota de alcance (Fase 2): varios indicadores dependen de que la
 * actuación tenga `fecha_fin` (situación de vigencia, semáforo, canon) —
 * eso recién se carga al formalizar (RF-12), que todavía no está
 * construido. Con los datos de la Fase 1/2 (altas rápidas, RF-11) estos
 * indicadores van a dar 0 hasta que exista RF-12 — es correcto, no un bug:
 * el PRD (tabla 8.1, "Las cifras de cada tarjeta coinciden con la
 * cantidad de filas de la lista") exige coherencia con los datos reales,
 * no un número inventado.
 */
import { diferenciaDias, nivelSemaforo, UMBRALES_SEMAFORO_DEFECTO, type UmbralesSemaforo } from "../fechas";
import type { Actuacion, ActuacionHito, DocumentoAlquiler } from "../tipos";
import { vencimientoEfectivo } from "./r15-vencimiento-efectivo";
import { situacionVigencia, tieneSucesoraActiva } from "./campos-calculados";
import { totalCanonNeto } from "./r16-canon-neto";
import {
  alertaA1IniciarAviso,
  alertaA4HitoAtrasado,
  alertaA5OcupacionSinContrato,
  alertaA6FormalizadaSinEscaneado,
} from "./alertas";

export interface ResumenDashboard {
  contratosVigentes: number;
  /** Por franja del semáforo (C3), sobre el vencimiento efectivo de los CONTRATO vigentes. */
  vencenVerde: number;
  vencenAmarillo: number;
  vencenNaranja: number;
  vencenRojo: number;
  ocupacionSinContrato: number; // A5
  avisosPorIniciar: number; // A1
  hitosAtrasados: number; // A4
  renovacionesEnCurso: number; // C4
  legitimoAbonoEnCurso: number;
  formalizadasSinEscaneado: number; // A6
  canonNetoTotal: number;
  contratosSinDatoIva: number;
}

export interface ItemColaTrabajo {
  actuacionId: string;
  inmuebleId: string;
  alerta: "A1" | "A4" | "A5" | "A6";
  descripcion: string;
}

export interface ParametrosDashboard {
  actuaciones: Actuacion[];
  hitos: ActuacionHito[];
  documentos: DocumentoAlquiler[];
  cfgHitosTipo: { hitoId: string; generaAlerta: boolean }[];
  hoy: string;
  alicuotaIva: number;
  umbrales?: UmbralesSemaforo;
}

export function calcularDashboard(params: ParametrosDashboard): { resumen: ResumenDashboard; colaDeTrabajo: ItemColaTrabajo[] } {
  const { actuaciones, hitos, documentos, cfgHitosTipo, hoy, alicuotaIva, umbrales = UMBRALES_SEMAFORO_DEFECTO } = params;
  const contratos = actuaciones.filter((a) => a.tipoActuacion === "CONTRATO" && a.activo);
  const colaDeTrabajo: ItemColaTrabajo[] = [];

  let contratosVigentes = 0;
  let vencenVerde = 0;
  let vencenAmarillo = 0;
  let vencenNaranja = 0;
  let vencenRojo = 0;
  let ocupacionSinContrato = 0;
  let avisosPorIniciar = 0;
  let renovacionesEnCurso = 0;
  let formalizadasSinEscaneado = 0;

  for (const contrato of contratos) {
    const vigencia = situacionVigencia(contrato, actuaciones, hoy);
    if (vigencia === "VIGENTE") {
      contratosVigentes++;
      const venc = vencimientoEfectivo(contrato, actuaciones);
      if (venc) {
        const dias = diferenciaDias(hoy, venc);
        const nivel = nivelSemaforo(dias, umbrales);
        if (nivel === "verde") vencenVerde++;
        else if (nivel === "amarillo") vencenAmarillo++;
        else if (nivel === "naranja") vencenNaranja++;
        else if (nivel === "rojo") vencenRojo++;
      }
    }

    if (tieneSucesoraActiva(contrato, actuaciones)) renovacionesEnCurso++;

    if (alertaA1IniciarAviso(contrato, actuaciones, hoy)) {
      avisosPorIniciar++;
      colaDeTrabajo.push({
        actuacionId: contrato.actuacionId,
        inmuebleId: contrato.inmuebleId,
        alerta: "A1",
        descripcion: "Iniciar aviso: faltan 4 meses o menos para el vencimiento efectivo y no hay sucesora.",
      });
    }

    if (alertaA5OcupacionSinContrato(contrato, actuaciones, hoy)) {
      ocupacionSinContrato++;
      colaDeTrabajo.push({
        actuacionId: contrato.actuacionId,
        inmuebleId: contrato.inmuebleId,
        alerta: "A5",
        descripcion: "Ocupación sin contrato: vencido, sin sucesora ni legítimo abono en curso.",
      });
    }

    const documentosDelContrato = documentos.filter((d) => d.actuacionId === contrato.actuacionId);
    if (alertaA6FormalizadaSinEscaneado(contrato, documentosDelContrato)) {
      formalizadasSinEscaneado++;
      colaDeTrabajo.push({
        actuacionId: contrato.actuacionId,
        inmuebleId: contrato.inmuebleId,
        alerta: "A6",
        descripcion: "Formalizada sin el escaneado firmado adjunto.",
      });
    }
  }

  const legitimoAbonoEnCurso = actuaciones.filter(
    (a) => a.tipoActuacion === "LEGITIMO_ABONO" && a.activo && (!a.fechaFin || a.fechaFin >= hoy)
  ).length;

  let hitosAtrasados = 0;
  for (const hito of hitos) {
    const cfg = cfgHitosTipo.find((c) => c.hitoId === hito.hitoId);
    if (!cfg) continue;
    if (alertaA4HitoAtrasado(hito, cfg.generaAlerta, hoy)) {
      hitosAtrasados++;
      const actuacion = actuaciones.find((a) => a.actuacionId === hito.actuacionId);
      colaDeTrabajo.push({
        actuacionId: hito.actuacionId,
        inmuebleId: actuacion?.inmuebleId ?? "",
        alerta: "A4",
        descripcion: `Hito ${hito.hitoId} atrasado (previsto ${hito.fechaPrevista}).`,
      });
    }
  }

  const { total: canonNetoTotal, sinDatoIva: contratosSinDatoIva } = totalCanonNeto(
    contratos.filter((c) => situacionVigencia(c, actuaciones, hoy) === "VIGENTE"),
    alicuotaIva
  );

  // Cola de trabajo ordenada por urgencia: A5 y A1 primero (PRD v1 sección 8: "A5, A1 en rojo, A4 y A2, A3, A6").
  const ORDEN_URGENCIA: Record<ItemColaTrabajo["alerta"], number> = { A5: 0, A1: 1, A4: 2, A6: 3 };
  colaDeTrabajo.sort((a, b) => ORDEN_URGENCIA[a.alerta] - ORDEN_URGENCIA[b.alerta]);

  return {
    resumen: {
      contratosVigentes,
      vencenVerde,
      vencenAmarillo,
      vencenNaranja,
      vencenRojo,
      ocupacionSinContrato,
      avisosPorIniciar,
      hitosAtrasados,
      renovacionesEnCurso,
      legitimoAbonoEnCurso,
      formalizadasSinEscaneado,
      canonNetoTotal,
      contratosSinDatoIva,
    },
    colaDeTrabajo,
  };
}
