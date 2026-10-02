"use client";
import { CalendarioMesAlquileres } from "@/components/domain/calendario-mes-alquileres";
import type { EventoCalendarioAlquileres } from "@/lib/alquileres/reglas/calendario";

/** RF-40 — página de calendario del módulo: solo pinta los eventos ya calculados en el servidor. */
export function AlquileresCalendarioClient({ eventos }: { eventos: EventoCalendarioAlquileres[] }) {
  return <CalendarioMesAlquileres eventos={eventos} />;
}
