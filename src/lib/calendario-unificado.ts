/**
 * Adaptador de presentación que unifica, solo para la vista de Calendario,
 * los eventos del CLM (`./calendario`, modelo `Contrato`) y los de
 * Alquileres (`./alquileres/reglas/calendario`, modelo `Actuacion`/`ActuacionHito`).
 *
 * D2/D5 sigue vigente: ninguno de los dos módulos de negocio se toca ni se
 * extiende para conocer al otro. Esto vive en una tercera capa, de UI
 * solamente, que sabe traducir ambos modelos a una forma común para
 * pintarlos juntos — mismo patrón que ya usa
 * `calendario-mes-alquileres.tsx` al reutilizar la matemática de grilla del
 * CLM sin tocar su modelo de datos.
 */
import type { Badge } from "@/components/ui/badge";
import type { ComponentProps } from "react";
import { EventoCalendario, TIPO_EVENTO_BADGE, TIPO_EVENTO_LABEL, TIPO_EVENTO_DOT } from "./calendario";
import type { EventoCalendarioAlquileres } from "./alquileres/reglas/calendario";

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

export interface EventoCalendarioUnificado {
  id: string;
  fecha: string; // yyyy-mm-dd
  origen: "clm" | "alquileres";
  /** Texto corto para la celda del día (ej. "C-0001" o "ACT-0001"). */
  codigo: string;
  /** Título del renglón en el panel/tabla de detalle. */
  titulo: string;
  subtitulo: string;
  href: string;
  badgeLabel: string;
  badgeVariant: BadgeVariant;
  dotClass: string;
}

const BADGE_VARIANT_ALQUILERES: Record<NonNullable<EventoCalendarioAlquileres["nivel"]> | "sin-nivel", BadgeVariant> = {
  verde: "success",
  amarillo: "warning",
  naranja: "orange",
  rojo: "danger",
  gris: "info",
  "sin-nivel": "info",
};

const DOT_ALQUILERES: Record<EventoCalendarioAlquileres["tipoEvento"], string> = {
  vencimiento: "bg-[var(--color-danger)]",
  hito: "bg-[var(--color-info)]",
};

export function mapearEventoClm(ev: EventoCalendario): EventoCalendarioUnificado {
  return {
    id: `clm-${ev.id}`,
    fecha: ev.fecha,
    origen: "clm",
    codigo: ev.contratoId,
    titulo: `${ev.contratoId} — ${ev.objeto}`,
    subtitulo: [ev.gerenciaResponsable, ev.tipoContrato, ev.descripcion].filter(Boolean).join(" · "),
    href: `/contratos/${ev.contratoId}`,
    badgeLabel: TIPO_EVENTO_LABEL[ev.tipoEvento],
    badgeVariant: TIPO_EVENTO_BADGE[ev.tipoEvento],
    dotClass: TIPO_EVENTO_DOT[ev.tipoEvento],
  };
}

export function mapearEventoAlquileres(ev: EventoCalendarioAlquileres): EventoCalendarioUnificado {
  return {
    id: `alq-${ev.id}`,
    fecha: ev.fecha,
    origen: "alquileres",
    codigo: ev.actuacionId,
    titulo: ev.actuacionId,
    subtitulo: [ev.inmuebleId, ev.descripcion].filter(Boolean).join(" · "),
    href: `/alquileres/actuaciones?id=${encodeURIComponent(ev.actuacionId)}`,
    badgeLabel: ev.tipoEvento === "vencimiento" ? "Vencimiento" : "Hito",
    badgeVariant: BADGE_VARIANT_ALQUILERES[ev.nivel ?? "sin-nivel"],
    dotClass: DOT_ALQUILERES[ev.tipoEvento],
  };
}

/** Junta ambas listas ya mapeadas y las ordena por fecha (y por código, a igual fecha). */
export function combinarEventosCalendario(
  eventosClm: EventoCalendario[],
  eventosAlquileres: EventoCalendarioAlquileres[]
): EventoCalendarioUnificado[] {
  const combinados = [...eventosClm.map(mapearEventoClm), ...eventosAlquileres.map(mapearEventoAlquileres)];
  return combinados.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.codigo.localeCompare(b.codigo));
}
