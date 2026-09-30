"use client";
import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  EventoCalendario,
  MESES,
  TIPO_EVENTO_BADGE,
  TIPO_EVENTO_LABEL,
  aFechaISO,
  sumarMeses,
} from "@/lib/calendario";
import { formatearFecha, formatearMonto } from "@/lib/fechas";

const OPCIONES_MESES = [1, 2, 3, 6, 12];

/** Vista a futuro — todos los eventos entre hoy y hoy + N meses, agrupados por mes. */
export function CalendarioFuturo({ eventos }: { eventos: EventoCalendario[] }) {
  const [meses, setMeses] = React.useState(3);

  const hoy = new Date();
  const hoyISO = aFechaISO(hoy);
  const limiteISO = aFechaISO(sumarMeses(hoy, meses));

  const enRango = eventos.filter((ev) => ev.fecha >= hoyISO && ev.fecha < limiteISO);

  const porMes = new Map<string, EventoCalendario[]>();
  for (const ev of enRango) {
    const [anio, mes] = ev.fecha.split("-").map(Number);
    const clave = `${anio}-${String(mes).padStart(2, "0")}`;
    const lista = porMes.get(clave) ?? [];
    lista.push(ev);
    porMes.set(clave, lista);
  }
  const clavesOrdenadas = Array.from(porMes.keys()).sort();

  return (
    <div>
      <div className="mb-3.5 flex items-center gap-2.5">
        <label className="text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
          Ver los próximos
        </label>
        <Select value={meses} onChange={(e) => setMeses(Number(e.target.value))} className="w-auto">
          {OPCIONES_MESES.map((m) => (
            <option key={m} value={m}>
              {m} {m === 1 ? "mes" : "meses"}
            </option>
          ))}
        </Select>
        <span className="text-[var(--text-sm)] text-[var(--color-text-muted)]">
          ({enRango.length} evento{enRango.length !== 1 ? "s" : ""})
        </span>
      </div>

      {clavesOrdenadas.length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 text-center text-[var(--color-text-muted)] shadow-[var(--shadow-sm)]">
          Sin vencimientos ni hitos en este período.
        </div>
      )}

      {clavesOrdenadas.map((clave) => {
        const [anioStr, mesStr] = clave.split("-");
        const eventosDelMes = porMes.get(clave)!.slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
        return (
          <div key={clave} className="mb-4 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
            <div className="border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-2.5">
              <h3 className="font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">
                {MESES[Number(mesStr) - 1]} {anioStr} · {eventosDelMes.length} evento{eventosDelMes.length !== 1 ? "s" : ""}
              </h3>
            </div>
            <table className="w-full text-[var(--text-base)]">
              <tbody>
                {eventosDelMes.map((ev) => (
                  <tr key={ev.id} className="border-b border-[var(--color-border)] last:border-b-0">
                    <td className="w-[90px] whitespace-nowrap px-3.5 py-2.5 font-semibold">{formatearFecha(ev.fecha)}</td>
                    <td className="px-3.5 py-2.5">
                      <Link href={`/contratos/${ev.contratoId}`} className="font-semibold text-brand-blue-700 hover:underline">
                        {ev.contratoId} — {ev.objeto}
                      </Link>
                      <div className="text-[var(--text-sm)] text-[var(--color-text-muted)]">
                        {ev.gerenciaResponsable} · {ev.tipoContrato}
                        {ev.descripcion ? ` · ${ev.descripcion}` : ""}
                        {ev.monto ? ` · ${formatearMonto(ev.monto, ev.moneda)}` : ""}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <Badge variant={TIPO_EVENTO_BADGE[ev.tipoEvento]}>{TIPO_EVENTO_LABEL[ev.tipoEvento]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
