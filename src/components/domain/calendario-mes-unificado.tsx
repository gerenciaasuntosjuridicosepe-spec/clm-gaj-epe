"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DIAS_SEMANA, MESES, aFechaISO, construirGrillaMes } from "@/lib/calendario";
import { formatearFecha } from "@/lib/fechas";
import type { EventoCalendarioUnificado } from "@/lib/calendario-unificado";

/** Vista mensual unificada (CLM + Alquileres) — misma grilla de siempre, eventos de ambos módulos ya traducidos a una forma común. */
export function CalendarioMesUnificado({ eventos }: { eventos: EventoCalendarioUnificado[] }) {
  const hoy = new Date();
  const [cursor, setCursor] = React.useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [diaSeleccionado, setDiaSeleccionado] = React.useState<string>(aFechaISO(hoy));

  const eventosPorDia = React.useMemo(() => {
    const mapa = new Map<string, EventoCalendarioUnificado[]>();
    for (const ev of eventos) {
      const lista = mapa.get(ev.fecha) ?? [];
      lista.push(ev);
      mapa.set(ev.fecha, lista);
    }
    return mapa;
  }, [eventos]);

  const dias = React.useMemo(() => construirGrillaMes(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const eventosDelDia = eventosPorDia.get(diaSeleccionado) ?? [];

  return (
    <div>
      <div className="mb-3.5 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}>
          <ChevronLeft size={13} />
        </Button>
        <div className="min-w-[180px] text-center font-[var(--font-display)] text-[var(--text-xl)] font-bold">
          {MESES[cursor.getMonth()]} {cursor.getFullYear()}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}>
          <ChevronRight size={13} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCursor(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
            setDiaSeleccionado(aFechaISO(hoy));
          }}
        >
          Hoy
        </Button>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="grid grid-cols-7 border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)]">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dias.map((d) => {
            const fechaISO = aFechaISO(d);
            const delMes = d.getMonth() === cursor.getMonth();
            const esHoy = fechaISO === aFechaISO(hoy);
            const esSeleccionado = fechaISO === diaSeleccionado;
            const eventosDia = eventosPorDia.get(fechaISO) ?? [];

            return (
              <button
                key={fechaISO}
                onClick={() => setDiaSeleccionado(fechaISO)}
                className={cn(
                  "flex min-h-[84px] flex-col items-stretch gap-1 border-b border-r border-[var(--color-border)] p-1.5 text-left last:border-r-0",
                  !delMes && "bg-surface text-[var(--color-text-muted)]",
                  esSeleccionado && "bg-[var(--overlay-brand-08)]"
                )}
              >
                <span
                  className={cn(
                    "self-end text-[var(--text-sm)]",
                    esHoy && "flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue-700 font-bold text-white"
                  )}
                >
                  {d.getDate()}
                </span>
                <div className="flex flex-col gap-0.5">
                  {eventosDia.slice(0, 3).map((ev) => (
                    <span key={ev.id} className="flex items-center gap-1 truncate text-[9px] text-[var(--color-text-secondary)]">
                      <span className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", ev.dotClass)} />
                      <span className="truncate">{ev.codigo}</span>
                    </span>
                  ))}
                  {eventosDia.length > 3 && (
                    <span className="text-[9px] text-[var(--color-text-muted)]">+{eventosDia.length - 3} más</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)]">
        <h3 className="mb-2.5 font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">
          {formatearFecha(diaSeleccionado)} — {eventosDelDia.length} evento{eventosDelDia.length !== 1 ? "s" : ""}
        </h3>
        {eventosDelDia.length === 0 && (
          <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">Sin vencimientos ni hitos este día.</p>
        )}
        {eventosDelDia.map((ev) => (
          <div key={ev.id} className="flex items-center justify-between border-b border-[var(--color-border)] py-2 last:border-b-0">
            <div>
              <Link href={ev.href} className="text-[var(--text-base)] font-semibold text-brand-blue-700 hover:underline">
                {ev.titulo}
              </Link>
              <div className="text-[var(--text-sm)] text-[var(--color-text-muted)]">{ev.subtitulo}</div>
            </div>
            <Badge variant={ev.badgeVariant}>{ev.badgeLabel}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
