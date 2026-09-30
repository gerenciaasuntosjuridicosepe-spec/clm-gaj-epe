import { Contrato, EtapaId, TipoContrato } from "./types";

/**
 * Módulo de calendario — unifica en una sola lista de "eventos" todo lo que
 * el PRD trata como vencimiento o hito a lo largo del ciclo de vida de un
 * contrato (sección 6.3): vencimiento de vigencia, hitos de pago, hitos
 * libres, y además el plazo prudencial de aprobación de solicitud (sección
 * 6.2) — este último no es un "hito contractual" en sentido estricto del
 * modelo de datos, pero es un vencimiento real del proceso y el pedido fue
 * "visualizar los vencimientos e hitos de todos los procesos", no solo los
 * de ejecución. Si no querés que aparezca ahí, se saca fácil (ver
 * `construirEventosCalendario`).
 */
export type TipoEventoCalendario = "vencimiento_vigencia" | "pago" | "libre" | "plazo_aprobacion";

export interface EventoCalendario {
  id: string;
  contratoId: string;
  objeto: string;
  tipoContrato: TipoContrato;
  gerenciaResponsable: string;
  etapaActual: EtapaId;
  tipoEvento: TipoEventoCalendario;
  fecha: string; // ISO (yyyy-mm-dd)
  descripcion?: string;
  monto?: number;
  moneda?: string;
}

export const TIPO_EVENTO_LABEL: Record<TipoEventoCalendario, string> = {
  vencimiento_vigencia: "Vencimiento de vigencia",
  pago: "Hito de pago",
  libre: "Hito libre",
  plazo_aprobacion: "Plazo de aprobación",
};

export const TIPO_EVENTO_BADGE: Record<TipoEventoCalendario, "danger" | "warning" | "info" | "orange"> = {
  vencimiento_vigencia: "danger",
  pago: "warning",
  libre: "info",
  plazo_aprobacion: "orange",
};

export const TIPO_EVENTO_DOT: Record<TipoEventoCalendario, string> = {
  vencimiento_vigencia: "bg-[var(--color-danger)]",
  pago: "bg-[var(--color-warning)]",
  libre: "bg-[var(--color-info)]",
  plazo_aprobacion: "bg-brand-orange-500",
};

/** Arma la lista unificada de eventos de calendario a partir de los contratos. */
export function construirEventosCalendario(contratos: Contrato[]): EventoCalendario[] {
  const eventos: EventoCalendario[] = [];

  for (const c of contratos) {
    for (const h of c.hitos) {
      eventos.push({
        id: `${c.id}-${h.tipo}-${h.fecha}`,
        contratoId: c.id,
        objeto: c.objeto,
        tipoContrato: c.tipoContrato,
        gerenciaResponsable: c.gerenciaResponsable,
        etapaActual: c.etapaActual,
        tipoEvento: h.tipo,
        fecha: h.fecha,
        descripcion: h.descripcion,
        monto: h.monto,
        moneda: c.moneda,
      });
    }
    if (c.fechaLimitePlazoPrudencial) {
      eventos.push({
        id: `${c.id}-plazo_aprobacion-${c.fechaLimitePlazoPrudencial}`,
        contratoId: c.id,
        objeto: c.objeto,
        tipoContrato: c.tipoContrato,
        gerenciaResponsable: c.gerenciaResponsable,
        etapaActual: c.etapaActual,
        tipoEvento: "plazo_aprobacion",
        fecha: c.fechaLimitePlazoPrudencial,
      });
    }
  }

  return eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export { DIAS_SEMANA };

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
export { MESES };

/** yyyy-mm-dd en horario local, sin desfasajes de zona horaria (a diferencia de toISOString()). */
export function aFechaISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Arma la grilla de un mes: siempre semanas completas de lunes a domingo
 * (6 filas x 7 columnas = 42 celdas), incluyendo días de los meses
 * adyacentes para completar la primera y la última semana.
 */
export function construirGrillaMes(anio: number, mes: number): Date[] {
  const primerDiaMes = new Date(anio, mes, 1);
  // getDay(): 0=domingo..6=sábado → lo convertimos a offset lunes=0..domingo=6
  const offsetLunes = (primerDiaMes.getDay() + 6) % 7;
  const inicio = new Date(anio, mes, 1 - offsetLunes);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    return d;
  });
}

/** Primer día del mes que está `offset` meses adelante/atrás de `base`. */
export function sumarMeses(base: Date, offset: number): Date {
  return new Date(base.getFullYear(), base.getMonth() + offset, 1);
}
