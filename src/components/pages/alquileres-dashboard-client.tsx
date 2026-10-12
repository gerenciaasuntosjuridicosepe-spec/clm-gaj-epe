"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/domain/kpi-card";
import { Alert } from "@/components/domain/alert";
import { SemaforoBarraAlquileres } from "@/components/domain/semaforo-barra-alquileres";
import {
  ETIQUETA_ALERTA,
  SEVERIDAD_ALERTA,
  type ItemColaTrabajo,
  type ItemLegitimoAbono,
  type ItemProximoVencimiento,
  type ResumenDashboard,
} from "@/lib/alquileres/reglas/dashboard";
import { formatearFecha, formatearMonto } from "@/lib/alquileres/fechas";

type FiltroAlerta = "TODAS" | ItemColaTrabajo["alerta"];

export interface LegitimoAbonoConDomicilio extends ItemLegitimoAbono {
  inmuebleDomicilio: string;
}

export interface ProximoVencimientoConDatos extends ItemProximoVencimiento {
  inmuebleDomicilio: string;
  localidadNombre: string;
  sucursalNombre: string;
}

const CLASE_BORDE_SEVERIDAD = {
  danger: "border-l-[var(--color-danger)]",
  warning: "border-l-[var(--color-warning)]",
  info: "border-l-[var(--color-info)]",
} as const;

const BADGE_POR_NIVEL = {
  verde: "success",
  amarillo: "warning",
  naranja: "orange",
  rojo: "danger",
  gris: "info",
} as const;

/** A1 (iniciar aviso) lleva al seguimiento del trámite de renovación; el resto, a la actuación en el listado general (resaltada). */
function hrefParaAlerta(item: ItemColaTrabajo): string {
  if (item.alerta === "A1") return `/alquileres/procesos-renovacion/${encodeURIComponent(item.actuacionId)}`;
  return `/alquileres/actuaciones?id=${encodeURIComponent(item.actuacionId)}`;
}

/**
 * Dashboard (PRD v1 sección 8): tarjetas de indicadores + cola de trabajo.
 * Todo se calcula en el servidor (`calcularDashboard`, reglas puras ya
 * probadas) — este componente solo pinta lo que ya viene calculado, sin
 * repetir ninguna cuenta en el cliente.
 */
export function AlquileresDashboardClient({
  resumen,
  colaDeTrabajo,
  legitimosAbono,
  proximosVencimientos,
}: {
  resumen: ResumenDashboard;
  colaDeTrabajo: ItemColaTrabajo[];
  legitimosAbono: LegitimoAbonoConDomicilio[];
  proximosVencimientos: ProximoVencimientoConDatos[];
}) {
  const router = useRouter();
  const [filtro, setFiltro] = React.useState<FiltroAlerta>("TODAS");

  const porTipo = (tipo: ItemColaTrabajo["alerta"]) => colaDeTrabajo.filter((item) => item.alerta === tipo).length;
  const visibles = filtro === "TODAS" ? colaDeTrabajo : colaDeTrabajo.filter((item) => item.alerta === filtro);

  return (
    <>
      {resumen.ocupacionSinContrato > 0 && (
        <Alert variant="danger">
          {resumen.ocupacionSinContrato} inmueble(s) en ocupación sin contrato — riesgo alto.
        </Alert>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Contratos vigentes" value={resumen.contratosVigentes} color="blue" />
        <KpiCard label="Ocupación sin contrato" value={resumen.ocupacionSinContrato} color={resumen.ocupacionSinContrato > 0 ? "danger" : "blue"} />
        <Link href="/alquileres/procesos-renovacion" className="block">
          <KpiCard label="Avisos por iniciar" value={resumen.avisosPorIniciar} color="orange" />
        </Link>
        <KpiCard label="Hitos atrasados" value={resumen.hitosAtrasados} color="orange" />
        <Link href="/alquileres/procesos-renovacion" className="block">
          <KpiCard label="Renovaciones en curso" value={resumen.renovacionesEnCurso} color="blue" />
        </Link>
        <KpiCard label="Legítimo abono en curso" value={resumen.legitimoAbonoEnCurso} color="blue" />
        <KpiCard label="Formalizadas sin escaneado" value={resumen.formalizadasSinEscaneado} color="orange" />
        <KpiCard
          label="Canon mensual neto de IVA"
          value={formatearMonto(resumen.canonNetoTotal)}
          delta={`${resumen.contratosSinDatoIva} contrato(s) sin dato de IVA excluidos — no incluye actualizaciones`}
          color="success"
        />
      </div>

      <SemaforoBarraAlquileres
        segmentos={[
          { nivel: "verde", label: "Vence > 180 días", cantidad: resumen.vencenVerde },
          { nivel: "amarillo", label: "Vence 121-180 días", cantidad: resumen.vencenAmarillo },
          { nivel: "naranja", label: "Vence 61-120 días", cantidad: resumen.vencenNaranja },
          { nivel: "rojo", label: "Vence ≤ 60 días o vencido", cantidad: resumen.vencenRojo },
        ]}
      />

      <div className="mb-5 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-3.5">
          <h3 className="font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">Próximos vencimientos</h3>
        </div>
        {proximosVencimientos.length === 0 ? (
          <p className="p-4.5 text-[var(--color-text-muted)]">Sin contratos vigentes con vencimiento calculado.</p>
        ) : (
          <table className="w-full text-[var(--text-base)]">
            <thead>
              <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
                <th className="px-3.5 py-2.5">Actuación</th>
                <th className="px-3.5 py-2.5">Domicilio</th>
                <th className="px-3.5 py-2.5">Localidad</th>
                <th className="px-3.5 py-2.5">Sucursal / sector</th>
                <th className="px-3.5 py-2.5">Vence</th>
              </tr>
            </thead>
            <tbody>
              {proximosVencimientos.map((item) => (
                <tr
                  key={item.actuacionId}
                  onClick={() => router.push(`/alquileres/procesos-renovacion/${encodeURIComponent(item.actuacionId)}`)}
                  className="cursor-pointer border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--overlay-brand-04)]"
                >
                  <td className="px-3.5 py-2.5 font-mono text-[var(--text-sm)] text-brand-blue-700 underline">{item.actuacionId}</td>
                  <td className="px-3.5 py-2.5">{item.inmuebleDomicilio}</td>
                  <td className="px-3.5 py-2.5">{item.localidadNombre}</td>
                  <td className="px-3.5 py-2.5">{item.sucursalNombre}</td>
                  <td className="px-3.5 py-2.5">
                    <Badge variant={BADGE_POR_NIVEL[item.nivel]}>{formatearFecha(item.vencimiento)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mb-5 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-3.5">
          <h3 className="font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">Legítimo abono en curso</h3>
        </div>
        {legitimosAbono.length === 0 ? (
          <p className="p-4.5 text-[var(--color-text-muted)]">Sin legítimo abono en curso.</p>
        ) : (
          <table className="w-full text-[var(--text-base)]">
            <thead>
              <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
                <th className="px-3.5 py-2.5">Actuación</th>
                <th className="px-3.5 py-2.5">Inmueble</th>
                <th className="px-3.5 py-2.5">Período</th>
                <th className="px-3.5 py-2.5 text-right">Días</th>
              </tr>
            </thead>
            <tbody>
              {legitimosAbono.map((item) => (
                <tr
                  key={item.actuacionId}
                  onClick={() => router.push(`/alquileres/actuaciones?id=${encodeURIComponent(item.actuacionId)}`)}
                  className="cursor-pointer border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--overlay-brand-04)]"
                >
                  <td className="px-3.5 py-2.5 font-mono text-[var(--text-sm)] text-brand-blue-700 underline">{item.actuacionId}</td>
                  <td className="px-3.5 py-2.5">{item.inmuebleDomicilio}</td>
                  <td className="px-3.5 py-2.5 text-[var(--color-text-secondary)]">
                    {item.fechaInicio ? formatearFecha(item.fechaInicio) : "sin fecha de inicio"}
                    {item.tieneFechaFin ? ` – ${formatearFecha(item.fechaFin)}` : " – en curso"}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-semibold">
                    {item.dias === null ? "—" : `${item.dias} día${item.dias !== 1 ? "s" : ""}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-3.5">
          <h3 className="mb-2.5 font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">Cola de trabajo</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant={filtro === "TODAS" ? "primary" : "ghost"} size="sm" onClick={() => setFiltro("TODAS")}>
              Todas ({colaDeTrabajo.length})
            </Button>
            {(Object.keys(ETIQUETA_ALERTA) as ItemColaTrabajo["alerta"][]).map((tipo) => (
              <Button key={tipo} variant={filtro === tipo ? "primary" : "ghost"} size="sm" onClick={() => setFiltro(tipo)}>
                {ETIQUETA_ALERTA[tipo]} ({porTipo(tipo)})
              </Button>
            ))}
          </div>
        </div>
        {visibles.length === 0 ? (
          <p className="p-4.5 text-[var(--color-text-muted)]">
            {colaDeTrabajo.length === 0 ? "Sin alertas pendientes." : `Sin alertas de "${ETIQUETA_ALERTA[filtro as ItemColaTrabajo["alerta"]]}".`}
          </p>
        ) : (
          <table className="w-full text-[var(--text-base)]">
            <thead>
              <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
                <th className="px-3.5 py-2.5">Actuación</th>
                <th className="px-3.5 py-2.5">Inmueble</th>
                <th className="px-3.5 py-2.5">Alerta</th>
                <th className="px-3.5 py-2.5">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((item, i) => (
                <tr
                  key={`${item.actuacionId}-${item.alerta}-${i}`}
                  onClick={() => router.push(hrefParaAlerta(item))}
                  className={cn(
                    "cursor-pointer border-b border-b-[var(--color-border)] border-l-4 last:border-b-0 hover:bg-[var(--overlay-brand-04)]",
                    CLASE_BORDE_SEVERIDAD[SEVERIDAD_ALERTA[item.alerta]]
                  )}
                >
                  <td className="px-3.5 py-2.5 font-mono text-[var(--text-sm)] text-brand-blue-700 underline">{item.actuacionId}</td>
                  <td className="px-3.5 py-2.5">{item.inmuebleId}</td>
                  <td className="px-3.5 py-2.5 font-semibold">{ETIQUETA_ALERTA[item.alerta]}</td>
                  <td className="px-3.5 py-2.5 text-[var(--color-text-secondary)]">{item.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
