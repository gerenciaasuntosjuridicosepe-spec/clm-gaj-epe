"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/domain/alert";
import { EstadoFlowAlquileres } from "@/components/domain/estado-flow-alquileres";
import { formatearFecha, formatearMonto, diferenciaDias, nivelSemaforo, hoy } from "@/lib/alquileres/fechas";
import { nombreHito } from "@/lib/alquileres/catalogos/hitos-seed";
import type { Actuacion, ActuacionHito, Comunicacion, EstadoActuacion, Expediente, LogCambio, Novedad } from "@/lib/alquileres/tipos";

const LABELS_ESTADO: Record<EstadoActuacion, string> = {
  PENDIENTE_AVISO: "Aviso pendiente",
  AVISO_ENVIADO: "Aviso enviado",
  EN_TRAMITE: "En trámite",
  FORMALIZADA: "Formalizada",
  CERRADA: "Cerrada",
  DESISTIDA: "Desistida",
  NO_RENOVADO: "No renovado",
  ANULADA: "Anulada",
};

const BADGE_POR_NIVEL = {
  verde: "success",
  amarillo: "warning",
  naranja: "orange",
  rojo: "danger",
  gris: "info",
} as const;

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
        {label}
      </div>
      <div className="text-[var(--text-base)]">{children}</div>
    </div>
  );
}

function Grilla({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">{children}</div>;
}

export function AlquileresProcesoRenovacionDetalleClient({
  actuacion: actuacionInicial,
  inmuebleDomicilio,
  areaNombre,
  firmanteNombre,
  vencimientoEfectivo,
  hitos,
  comunicaciones,
  historialEstados,
  expedientesDelInmueble,
  novedadesIniciales,
  puedeCargarNovedad,
  puedeVincularExpediente,
  gestoresDisponibles,
  puedeAsignarResponsable,
}: {
  actuacion: Actuacion;
  inmuebleDomicilio: string;
  areaNombre?: string;
  firmanteNombre?: string;
  vencimientoEfectivo?: string;
  hitos: ActuacionHito[];
  comunicaciones: Comunicacion[];
  historialEstados: Pick<LogCambio, "fechaHora" | "usuarioEmail" | "valorAnterior" | "valorNuevo">[];
  expedientesDelInmueble: Expediente[];
  novedadesIniciales: Novedad[];
  puedeCargarNovedad: boolean;
  puedeVincularExpediente: boolean;
  gestoresDisponibles: { email: string; nombre: string }[];
  puedeAsignarResponsable: boolean;
}) {
  const [actuacion, setActuacion] = React.useState(actuacionInicial);
  const [novedades, setNovedades] = React.useState(novedadesIniciales);
  const [estadoSel, setEstadoSel] = React.useState<EstadoActuacion>(actuacionInicial.estadoActuacion);

  const expedienteVinculado = expedientesDelInmueble.find((e) => e.expedienteId === actuacion.expedienteId);

  return (
    <>
      <div className="mb-4">
        <Link
          href="/alquileres/procesos-renovacion"
          className="inline-flex items-center gap-1.5 text-[var(--text-sm)] text-brand-blue-700 hover:underline"
        >
          <ArrowLeft size={13} /> Volver a Procesos de renovación
        </Link>
      </div>

      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="font-[var(--font-display)] text-[var(--text-2xl)] font-bold">{actuacion.actuacionId}</span>
        <Badge variant="gray">{actuacion.tipoActuacion}</Badge>
        {vencimientoEfectivo && <Badge variant="blue">Vence {formatearFecha(vencimientoEfectivo)}</Badge>}
      </div>
      <p className="mb-2 text-[var(--text-base)] text-[var(--color-text-secondary)]">{inmuebleDomicilio}</p>

      <ExpedienteVinculo
        actuacion={actuacion}
        expedienteVinculado={expedienteVinculado}
        expedientesDelInmueble={expedientesDelInmueble}
        puedeVincular={puedeVincularExpediente}
        onVinculado={setActuacion}
      />

      <ResponsableVinculo
        actuacion={actuacion}
        gestoresDisponibles={gestoresDisponibles}
        puedeAsignar={puedeAsignarResponsable}
        onAsignado={setActuacion}
      />

      <div className="mb-5 mt-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4.5 shadow-[var(--shadow-sm)]">
        <div className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
          Trámite de renovación — hacé click en una etapa para ver sus datos
        </div>
        <EstadoFlowAlquileres actual={actuacion.estadoActuacion} seleccionada={estadoSel} onSeleccionar={setEstadoSel} />
      </div>

      <PanelEtapa
        estado={estadoSel}
        actuacion={actuacion}
        areaNombre={areaNombre}
        firmanteNombre={firmanteNombre}
        vencimientoEfectivo={vencimientoEfectivo}
        hitos={hitos}
        comunicaciones={comunicaciones}
      />

      <NovedadesEtapa
        actuacionId={actuacion.actuacionId}
        estado={estadoSel}
        hitos={hitos}
        novedades={novedades}
        puedeCargar={puedeCargarNovedad}
        onNovedadCreada={(n) => setNovedades((prev) => [...prev, n])}
      />

      <div className="mt-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4.5 shadow-[var(--shadow-sm)]">
        <h3 className="mb-2.5 font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">
          Historial de etapas
        </h3>
        <HistorialEstados historial={historialEstados} />
      </div>

      <div className="mt-5 flex justify-end">
        <Link
          href={`/alquileres/actuaciones?id=${encodeURIComponent(actuacion.actuacionId)}`}
          className="text-[var(--text-sm)] text-brand-blue-700 hover:underline"
        >
          Ver / editar esta actuación en Actuaciones →
        </Link>
      </div>
    </>
  );
}

/** Vínculo con EXPEDIENTES (agregado 2026-10-13): el modelo lo permitía desde siempre, pero no había dónde verlo ni editarlo. */
function ExpedienteVinculo({
  actuacion,
  expedienteVinculado,
  expedientesDelInmueble,
  puedeVincular,
  onVinculado,
}: {
  actuacion: Actuacion;
  expedienteVinculado?: Expediente;
  expedientesDelInmueble: Expediente[];
  puedeVincular: boolean;
  onVinculado: (a: Actuacion) => void;
}) {
  const [editando, setEditando] = React.useState(false);
  const [seleccion, setSeleccion] = React.useState(actuacion.expedienteId ?? "");
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(`/api/alquileres/actuaciones/${actuacion.actuacionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expedienteId: seleccion || undefined, version: actuacion.version }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo vincular el expediente.");
      onVinculado(data as Actuacion);
      setEditando(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al vincular el expediente.");
    } finally {
      setGuardando(false);
    }
  }

  if (!editando) {
    return (
      <div className="flex items-center gap-2 text-[var(--text-sm)]">
        <span className="text-[var(--color-text-secondary)]">
          Expediente: <span className="font-semibold text-[var(--color-text-primary)]">{expedienteVinculado?.nroExpediente ?? "sin vincular todavía"}</span>
        </span>
        {puedeVincular && (
          <button onClick={() => setEditando(true)} className="text-brand-blue-700 hover:underline">
            {expedienteVinculado ? "cambiar" : "vincular"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <Alert variant="danger">{error}</Alert>}
      <select
        value={seleccion}
        onChange={(e) => setSeleccion(e.target.value)}
        className="h-9 w-[240px] rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 text-[var(--text-sm)]"
      >
        <option value="">Sin expediente</option>
        {expedientesDelInmueble.map((ex) => (
          <option key={ex.expedienteId} value={ex.expedienteId}>
            {ex.nroExpediente}
          </option>
        ))}
      </select>
      <Button size="xs" variant="primary" onClick={guardar} disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar"}
      </Button>
      <Button size="xs" variant="ghost" onClick={() => setEditando(false)} disabled={guardando}>
        Cancelar
      </Button>
      {expedientesDelInmueble.length === 0 && (
        <span className="text-[var(--text-xs)] text-[var(--color-text-muted)]">
          No hay expedientes cargados para este inmueble — creá uno en Expedientes.
        </span>
      )}
    </div>
  );
}

/**
 * Responsable asignado (agregado 2026-10-13): quién es el GESTOR a cargo de
 * esta actuación — ahora que un GESTOR distinto no puede editarla, hace
 * falta un lugar para asignarlo/reasignarlo. Solo ADMINISTRADOR puede
 * tocarlo (el PATCH lo vuelve a validar del lado del servidor).
 */
function ResponsableVinculo({
  actuacion,
  gestoresDisponibles,
  puedeAsignar,
  onAsignado,
}: {
  actuacion: Actuacion;
  gestoresDisponibles: { email: string; nombre: string }[];
  puedeAsignar: boolean;
  onAsignado: (a: Actuacion) => void;
}) {
  const [editando, setEditando] = React.useState(false);
  const [seleccion, setSeleccion] = React.useState(actuacion.responsableEmail ?? "");
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const responsable = gestoresDisponibles.find((g) => g.email === actuacion.responsableEmail);

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(`/api/alquileres/actuaciones/${actuacion.actuacionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responsableEmail: seleccion || undefined, version: actuacion.version }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo asignar el responsable.");
      onAsignado(data as Actuacion);
      setEditando(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al asignar el responsable.");
    } finally {
      setGuardando(false);
    }
  }

  if (!editando) {
    return (
      <div className="mt-1 flex items-center gap-2 text-[var(--text-sm)]">
        <span className="text-[var(--color-text-secondary)]">
          Responsable: <span className="font-semibold text-[var(--color-text-primary)]">{responsable?.nombre ?? "sin asignar"}</span>
        </span>
        {puedeAsignar && (
          <button onClick={() => setEditando(true)} className="text-brand-blue-700 hover:underline">
            {responsable ? "reasignar" : "asignar"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      {error && <Alert variant="danger">{error}</Alert>}
      <select
        value={seleccion}
        onChange={(e) => setSeleccion(e.target.value)}
        className="h-9 w-[240px] rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 text-[var(--text-sm)]"
      >
        <option value="">Sin asignar</option>
        {gestoresDisponibles.map((g) => (
          <option key={g.email} value={g.email}>
            {g.nombre}
          </option>
        ))}
      </select>
      <Button size="xs" variant="primary" onClick={guardar} disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar"}
      </Button>
      <Button size="xs" variant="ghost" onClick={() => setEditando(false)} disabled={guardando}>
        Cancelar
      </Button>
    </div>
  );
}

/** RF-38/M9: cada cambio de estadoActuacion ya queda en LOG_CAMBIOS automáticamente — esto solo lo muestra. */
function HistorialEstados({
  historial,
}: {
  historial: Pick<LogCambio, "fechaHora" | "usuarioEmail" | "valorAnterior" | "valorNuevo">[];
}) {
  if (historial.length === 0) {
    return <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">Sin cambios de estado registrados todavía.</p>;
  }
  return (
    <div>
      {historial.map((h, i) => {
        const anterior = LABELS_ESTADO[h.valorAnterior as EstadoActuacion] ?? h.valorAnterior;
        const nuevo = LABELS_ESTADO[h.valorNuevo as EstadoActuacion] ?? h.valorNuevo;
        return (
          <div key={i} className="flex gap-2.5 border-b border-[var(--color-border)] py-2 last:border-b-0">
            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand-blue-500" />
            <div>
              <div className="text-[var(--text-base)]">
                {anterior} → {nuevo}
              </div>
              <div className="text-[var(--text-2xs)] text-[var(--color-text-muted)]">
                {formatearFecha(h.fechaHora)} · {h.usuarioEmail}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Novedades de texto libre por etapa (y, si corresponde, por hito dentro de
 * esa etapa) — agregado 2026-10-13 a pedido de Carlos. Se filtran por la
 * etapa seleccionada en el stepper de arriba, no por la etapa actual real
 * de la actuación: así se puede ver (y seguir cargando, si todavía
 * corresponde) el historial de cualquier etapa ya pasada.
 */
function NovedadesEtapa({
  actuacionId,
  estado,
  hitos,
  novedades,
  puedeCargar,
  onNovedadCreada,
}: {
  actuacionId: string;
  estado: EstadoActuacion;
  hitos: ActuacionHito[];
  novedades: Novedad[];
  puedeCargar: boolean;
  onNovedadCreada: (n: Novedad) => void;
}) {
  const [texto, setTexto] = React.useState("");
  const [hitoId, setHitoId] = React.useState("");
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const deEstaEtapa = novedades.filter((n) => n.estadoActuacion === estado).sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));

  async function cargar() {
    if (!texto.trim()) return;
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(`/api/alquileres/actuaciones/${actuacionId}/novedades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: texto.trim(), hitoId: hitoId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo cargar la novedad.");
      onNovedadCreada(data as Novedad);
      setTexto("");
      setHitoId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la novedad.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mt-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
      <div className="border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-3.5">
        <h3 className="font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">
          Novedades — {LABELS_ESTADO[estado]}
        </h3>
      </div>
      <div className="p-4.5">
        {deEstaEtapa.length === 0 ? (
          <p className="mb-3 text-[var(--text-sm)] text-[var(--color-text-muted)]">Sin novedades cargadas en esta etapa todavía.</p>
        ) : (
          <div className="mb-3 flex flex-col gap-2">
            {deEstaEtapa.map((n) => (
              <div key={n.novedadId} className="border-b border-[var(--color-border)] pb-2 last:border-b-0">
                {n.hitoId && (
                  <Badge variant="gray" className="mb-1">
                    {nombreHito(n.hitoId)}
                  </Badge>
                )}
                <div className="text-[var(--text-base)]">{n.texto}</div>
                <div className="text-[var(--text-2xs)] text-[var(--color-text-muted)]">
                  {formatearFecha(n.creadoEn)} · {n.creadoPor}
                </div>
              </div>
            ))}
          </div>
        )}

        {puedeCargar && (
          <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
            {error && <Alert variant="danger">{error}</Alert>}
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Cargar una novedad para esta etapa…"
              rows={2}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2.5 py-2 text-[var(--text-sm)]"
            />
            <div className="flex items-center gap-2">
              {hitos.length > 0 && (
                <select
                  value={hitoId}
                  onChange={(e) => setHitoId(e.target.value)}
                  className="h-9 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 text-[var(--text-sm)]"
                >
                  <option value="">Sin hito específico</option>
                  {hitos.map((h) => (
                    <option key={h.actuacionHitoId} value={h.hitoId}>
                      {nombreHito(h.hitoId)}
                    </option>
                  ))}
                </select>
              )}
              <Button size="sm" variant="primary" onClick={cargar} disabled={guardando || !texto.trim()}>
                {guardando ? "Guardando…" : "Cargar novedad"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PanelEtapa({
  estado,
  actuacion,
  areaNombre,
  firmanteNombre,
  vencimientoEfectivo,
  hitos,
  comunicaciones,
}: {
  estado: EstadoActuacion;
  actuacion: Actuacion;
  areaNombre?: string;
  firmanteNombre?: string;
  vencimientoEfectivo?: string;
  hitos: ActuacionHito[];
  comunicaciones: Comunicacion[];
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
      <div className="border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-3.5">
        <h3 className="font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">{LABELS_ESTADO[estado]}</h3>
      </div>
      <div className="p-4.5">
        {estado === "PENDIENTE_AVISO" && <DatosAvisoPendiente vencimientoEfectivo={vencimientoEfectivo} areaNombre={areaNombre} />}
        {estado === "AVISO_ENVIADO" && <DatosComunicaciones comunicaciones={comunicaciones} />}
        {estado === "EN_TRAMITE" && <DatosHitos hitos={hitos} />}
        {estado === "FORMALIZADA" && <DatosFormalizada actuacion={actuacion} firmanteNombre={firmanteNombre} />}
        {estado === "CERRADA" && <DatosCerrada actuacion={actuacion} />}
        {(estado === "DESISTIDA" || estado === "NO_RENOVADO" || estado === "ANULADA") && (
          <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">
            {actuacion.motivoEstado ?? "Sin motivo registrado."}
          </p>
        )}
      </div>
    </div>
  );
}

function DatosAvisoPendiente({ vencimientoEfectivo, areaNombre }: { vencimientoEfectivo?: string; areaNombre?: string }) {
  if (!vencimientoEfectivo) {
    return <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">Sin vencimiento efectivo calculado.</p>;
  }
  const dias = diferenciaDias(hoy(), vencimientoEfectivo);
  const nivel = nivelSemaforo(dias);
  return (
    <Grilla>
      <Campo label="Vencimiento efectivo">{formatearFecha(vencimientoEfectivo)}</Campo>
      <Campo label="Días restantes">
        <Badge variant={BADGE_POR_NIVEL[nivel]}>{dias} día{dias !== 1 ? "s" : ""}</Badge>
      </Campo>
      <Campo label="Sector interesado">{areaNombre ?? "—"}</Campo>
    </Grilla>
  );
}

function DatosComunicaciones({ comunicaciones }: { comunicaciones: Comunicacion[] }) {
  const relevantes = comunicaciones.filter((c) => c.tipoComunicacion === "AVISO" || c.tipoComunicacion === "REITERACION");
  if (relevantes.length === 0) {
    return <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">Sin avisos ni reiteraciones registrados todavía.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {relevantes.map((c) => (
        <div key={c.comunicacionId} className="flex items-center justify-between border-b border-[var(--color-border)] py-1.5 last:border-b-0">
          <span className="text-[var(--text-sm)]">{c.asunto}</span>
          <div className="flex items-center gap-2">
            {c.fechaEnvio && <span className="text-[var(--text-sm)] text-[var(--color-text-muted)]">{formatearFecha(c.fechaEnvio)}</span>}
            <Badge variant={c.estadoComunicacion === "ENVIADO" ? "success" : "warning"}>{c.estadoComunicacion}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function DatosHitos({ hitos }: { hitos: ActuacionHito[] }) {
  if (hitos.length === 0) {
    return <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">Sin hitos cargados.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {hitos
        .slice()
        .sort((a, b) => (a.fechaPrevista ?? "").localeCompare(b.fechaPrevista ?? ""))
        .map((h) => (
          <div key={h.actuacionHitoId} className="flex items-center justify-between border-b border-[var(--color-border)] py-1.5 last:border-b-0">
            <span className="text-[var(--text-sm)]">{nombreHito(h.hitoId)}{h.fechaPrevista ? ` — prevista ${formatearFecha(h.fechaPrevista)}` : ""}</span>
            <Badge variant={h.estadoHito === "CUMPLIDO" ? "success" : h.estadoHito === "NO_APLICA" ? "gray" : "warning"}>
              {h.estadoHito}
            </Badge>
          </div>
        ))}
    </div>
  );
}

function DatosFormalizada({ actuacion, firmanteNombre }: { actuacion: Actuacion; firmanteNombre?: string }) {
  return (
    <Grilla>
      <Campo label="Fecha de inicio">{actuacion.fechaInicio ? formatearFecha(actuacion.fechaInicio) : "—"}</Campo>
      <Campo label="Plazo">{actuacion.plazoMeses !== undefined ? `${actuacion.plazoMeses} meses` : "—"}</Campo>
      <Campo label="Fecha de fin">{actuacion.fechaFin ? formatearFecha(actuacion.fechaFin) : "—"}</Campo>
      <Campo label="Canon inicial">{actuacion.canonInicial !== undefined ? formatearMonto(actuacion.canonInicial) : "—"}</Campo>
      <Campo label="Destino">{actuacion.destinoDescripcion ?? "—"}</Campo>
      <Campo label="Firmante EPE">{firmanteNombre ?? "—"}</Campo>
    </Grilla>
  );
}

function DatosCerrada({ actuacion }: { actuacion: Actuacion }) {
  return (
    <Grilla>
      <Campo label="Fecha de fin">{actuacion.fechaFin ? formatearFecha(actuacion.fechaFin) : "—"}</Campo>
      <Campo label="Observaciones">{actuacion.observaciones ?? "—"}</Campo>
    </Grilla>
  );
}
