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
import { diferenciaDias, nivelSemaforo, UMBRALES_SEMAFORO_DEFECTO, type NivelSemaforo, type UmbralesSemaforo } from "../fechas";
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
// Excepción puntual: las `reglas/*` no suelen importar `catalogos/*-seed`
// directamente (los catálogos se pasan como parámetro, para poder probar
// con datos ficticios — ver `cfgHitosTipo` más abajo). `nombreHito` es la
// excepción: no participa de ningún cálculo, solo mejora la lectura de un
// texto (en vez de "Hito H-02 atrasado", "Hito Respuesta de la sucursal
// atrasado") — a pedido de Carlos, 2026-10-12, para no mostrar códigos
// crudos en ninguna pantalla.
import { nombreHito } from "../catalogos/hitos-seed";

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
  sectorInteresadoAreaId: string;
  alerta: "A1" | "A4" | "A5" | "A6";
  descripcion: string;
}

export interface ItemAlertasPorSector {
  sectorInteresadoAreaId: string;
  cantidad: number;
}

/** Nombre legible de cada alerta — un solo lugar, usado por el dashboard y la pantalla de Alertas (antes duplicado en ambos). */
export const ETIQUETA_ALERTA: Record<ItemColaTrabajo["alerta"], string> = {
  A1: "Iniciar aviso",
  A4: "Hito atrasado",
  A5: "Ocupación sin contrato",
  A6: "Formalizada sin escaneado",
};

/** Severidad visual de cada alerta — PRD v1 sección 8: "A5, A1 en rojo, A4 ... A6" (menor). */
export const SEVERIDAD_ALERTA: Record<ItemColaTrabajo["alerta"], "danger" | "warning" | "info"> = {
  A5: "danger",
  A1: "danger",
  A4: "warning",
  A6: "info",
};

export interface ItemLegitimoAbono {
  actuacionId: string;
  inmuebleId: string;
  fechaInicio?: string;
  fechaFin?: string;
  /** Días desde fecha_inicio hasta fecha_fin (si ya está definida) o hasta hoy (si sigue abierto) — null si no hay fecha_inicio cargada. */
  dias: number | null;
  /** true si `dias` cuenta hasta fecha_fin; false si sigue abierto (sin fecha_fin) y cuenta hasta hoy. */
  tieneFechaFin: boolean;
}

export interface ItemProximoVencimiento {
  actuacionId: string;
  inmuebleId: string;
  sectorInteresadoAreaId: string;
  vencimiento: string;
  nivel: NivelSemaforo;
}

export interface ItemVencimientoPorMes {
  /** yyyy-mm */
  mes: string;
  cantidad: number;
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

export function calcularDashboard(params: ParametrosDashboard): {
  resumen: ResumenDashboard;
  colaDeTrabajo: ItemColaTrabajo[];
  legitimosAbonoEnCurso: ItemLegitimoAbono[];
  proximosVencimientos: ItemProximoVencimiento[];
  alertasPorSector: ItemAlertasPorSector[];
  vencimientosPorMes: ItemVencimientoPorMes[];
} {
  const { actuaciones, hitos, documentos, cfgHitosTipo, hoy, alicuotaIva, umbrales = UMBRALES_SEMAFORO_DEFECTO } = params;
  const contratos = actuaciones.filter((a) => a.tipoActuacion === "CONTRATO" && a.activo);
  const colaDeTrabajo: ItemColaTrabajo[] = [];
  const proximosVencimientos: ItemProximoVencimiento[] = [];

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
        proximosVencimientos.push({
          actuacionId: contrato.actuacionId,
          inmuebleId: contrato.inmuebleId,
          sectorInteresadoAreaId: contrato.sectorInteresadoAreaId,
          vencimiento: venc,
          nivel,
        });
      }
    }

    if (tieneSucesoraActiva(contrato, actuaciones)) renovacionesEnCurso++;

    if (alertaA1IniciarAviso(contrato, actuaciones, hoy)) {
      avisosPorIniciar++;
      colaDeTrabajo.push({
        actuacionId: contrato.actuacionId,
        inmuebleId: contrato.inmuebleId,
        sectorInteresadoAreaId: contrato.sectorInteresadoAreaId,
        alerta: "A1",
        descripcion: "Iniciar aviso: faltan 4 meses o menos para el vencimiento efectivo y no hay sucesora.",
      });
    }

    if (alertaA5OcupacionSinContrato(contrato, actuaciones, hoy)) {
      ocupacionSinContrato++;
      colaDeTrabajo.push({
        actuacionId: contrato.actuacionId,
        inmuebleId: contrato.inmuebleId,
        sectorInteresadoAreaId: contrato.sectorInteresadoAreaId,
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
        sectorInteresadoAreaId: contrato.sectorInteresadoAreaId,
        alerta: "A6",
        descripcion: "Formalizada sin el escaneado firmado adjunto.",
      });
    }
  }

  const legitimosAbonoEnCurso: ItemLegitimoAbono[] = actuaciones
    .filter((a) => a.tipoActuacion === "LEGITIMO_ABONO" && a.activo && (!a.fechaFin || a.fechaFin >= hoy))
    .map((a) => {
      const tieneFechaFin = Boolean(a.fechaFin);
      const dias = a.fechaInicio ? diferenciaDias(a.fechaInicio, tieneFechaFin ? a.fechaFin! : hoy) : null;
      return { actuacionId: a.actuacionId, inmuebleId: a.inmuebleId, fechaInicio: a.fechaInicio, fechaFin: a.fechaFin, dias, tieneFechaFin };
    });
  const legitimoAbonoEnCurso = legitimosAbonoEnCurso.length;

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
        sectorInteresadoAreaId: actuacion?.sectorInteresadoAreaId ?? "",
        alerta: "A4",
        descripcion: `Hito "${nombreHito(hito.hitoId)}" atrasado (previsto ${hito.fechaPrevista}).`,
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

  // Vista agregada (a pedido de Carlos, 2026-10-12): los 5 vencimientos más próximos, para verlos sin salir del dashboard.
  const top5ProximosVencimientos = proximosVencimientos.sort((a, b) => a.vencimiento.localeCompare(b.vencimiento)).slice(0, 5);

  // Ranking de alertas por sucursal/sector (a pedido de Carlos, 2026-10-12): para ver de un vistazo si los problemas se concentran en alguno.
  const conteoPorSector = new Map<string, number>();
  for (const item of colaDeTrabajo) {
    conteoPorSector.set(item.sectorInteresadoAreaId, (conteoPorSector.get(item.sectorInteresadoAreaId) ?? 0) + 1);
  }
  const alertasPorSector: ItemAlertasPorSector[] = Array.from(conteoPorSector, ([sectorInteresadoAreaId, cantidad]) => ({
    sectorInteresadoAreaId,
    cantidad,
  })).sort((a, b) => b.cantidad - a.cantidad);

  // Vencimientos por mes, próximos 12 meses (a pedido de Carlos, 2026-10-12) — carga de trabajo de renovación mes a mes, no solo 4 franjas gruesas.
  const anioHoy = Number(hoy.slice(0, 4));
  const mesHoy = Number(hoy.slice(5, 7)); // 1-12
  const vencimientosPorMes: ItemVencimientoPorMes[] = Array.from({ length: 12 }, (_, i) => {
    const total = mesHoy - 1 + i;
    const anio = anioHoy + Math.floor(total / 12);
    const mes = (total % 12) + 1;
    const clave = `${anio}-${String(mes).padStart(2, "0")}`;
    const cantidad = proximosVencimientos.filter((v) => v.vencimiento.slice(0, 7) === clave).length;
    return { mes: clave, cantidad };
  });

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
    legitimosAbonoEnCurso,
    proximosVencimientos: top5ProximosVencimientos,
    alertasPorSector,
    vencimientosPorMes,
  };
}
