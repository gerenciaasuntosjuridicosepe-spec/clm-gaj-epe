/**
 * RF-40 — Calendario propio del módulo: "vencimientos efectivos e hitos
 * previstos, con semáforo y filtros del dashboard" (PRD v2.1 sección 7).
 * Agregación pura, mismo espíritu que `dashboard.ts`: ninguna cuenta nueva,
 * solo arma una lista de eventos a partir de reglas ya probadas (R15,
 * nivelSemaforo) para que la UI solo pinte.
 *
 * No se reutiliza el tipo `EventoCalendario` del CLM (`src/lib/calendario.ts`)
 * porque está atado al modelo de `Contrato` (campos `tipoContrato`,
 * `gerenciaResponsable`, link fijo a `/contratos/...`) — D2/D5: Alquileres
 * tiene su propio modelo de datos, no extiende/reutiliza el de Contrato.
 * Sí se reutilizan, en el componente visual, las funciones de grilla de
 * `src/lib/calendario.ts` que son matemática de calendario pura y no tocan
 * el modelo de Contrato (`construirGrillaMes`, `aFechaISO`, `DIAS_SEMANA`,
 * `MESES`) — eso es "el componente visual con un adaptador" que permite el
 * PRD, no una dependencia del modelo de datos del CLM.
 */
import { diferenciaDias, nivelSemaforo, UMBRALES_SEMAFORO_DEFECTO, type NivelSemaforo, type UmbralesSemaforo } from "../fechas";
import type { Actuacion, ActuacionHito } from "../tipos";
import { vencimientoEfectivo } from "./r15-vencimiento-efectivo";
import { esTerminal } from "./alertas";

export type TipoEventoCalendarioAlquileres = "vencimiento" | "hito";

export interface EventoCalendarioAlquileres {
  id: string;
  fecha: string; // yyyy-mm-dd
  tipoEvento: TipoEventoCalendarioAlquileres;
  actuacionId: string;
  inmuebleId: string;
  descripcion: string;
  /** Solo para "vencimiento" (C3) — un evento "hito" no tiene semáforo propio, usa el de su actuación si hiciera falta en el futuro. */
  nivel?: NivelSemaforo;
}

/**
 * @param actuaciones Todas las actuaciones (se necesitan todas, no solo los CONTRATO, para que R15 pueda seguir la cadena de ADENDAs/LA).
 * @param hitos Todos los `ActuacionHito` — solo generan evento los PENDIENTE con `fechaPrevista` cargada.
 */
export function construirEventosCalendarioAlquileres(
  actuaciones: Actuacion[],
  hitos: ActuacionHito[],
  hoy: string,
  umbrales: UmbralesSemaforo = UMBRALES_SEMAFORO_DEFECTO
): EventoCalendarioAlquileres[] {
  const eventos: EventoCalendarioAlquileres[] = [];

  for (const contrato of actuaciones) {
    if (contrato.tipoActuacion !== "CONTRATO" || !contrato.activo) continue;
    if (esTerminal(contrato.estadoActuacion)) continue;
    const venc = vencimientoEfectivo(contrato, actuaciones);
    if (!venc) continue;
    eventos.push({
      id: `venc-${contrato.actuacionId}`,
      fecha: venc,
      tipoEvento: "vencimiento",
      actuacionId: contrato.actuacionId,
      inmuebleId: contrato.inmuebleId,
      descripcion: `Vencimiento efectivo de ${contrato.actuacionId}.`,
      nivel: nivelSemaforo(diferenciaDias(hoy, venc), umbrales),
    });
  }

  for (const hito of hitos) {
    if (hito.estadoHito !== "PENDIENTE" || !hito.fechaPrevista) continue;
    const actuacion = actuaciones.find((a) => a.actuacionId === hito.actuacionId);
    eventos.push({
      id: `hito-${hito.actuacionHitoId}`,
      fecha: hito.fechaPrevista,
      tipoEvento: "hito",
      actuacionId: hito.actuacionId,
      inmuebleId: actuacion?.inmuebleId ?? "",
      descripcion: `Hito ${hito.hitoId} previsto.`,
    });
  }

  return eventos.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id.localeCompare(b.id));
}
