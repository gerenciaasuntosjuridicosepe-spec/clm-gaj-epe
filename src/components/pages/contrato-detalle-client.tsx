"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/domain/alert";
import { EstadoFlow } from "@/components/domain/estado-flow";
import { SemaforoPlazo } from "@/components/domain/semaforo-plazo";
import { HistorialAuditoria } from "@/components/domain/historial-auditoria";
import { Contrato, EtapaId, ETAPAS_ORDEN, HitoContractual } from "@/lib/types";
import { formatearFecha, formatearMonto } from "@/lib/fechas";
import { MOCK_TIPOS_ANOTACION, MOCK_TIPOS_GARANTIA, MOCK_USUARIOS } from "@/lib/data/mock-catalogos";
import { TIPO_EVENTO_LABEL } from "@/lib/calendario";
import { useRol } from "@/lib/session";
import { puedeAccionar, ROLES_APRUEBAN_SOLICITUD, ROLES_AVANZAN_A_REPOSITORIO } from "@/lib/permisos";

const ABOGADOS = MOCK_USUARIOS.filter((u) => u.rolId === "abogado");

const ETAPAS_CON_SEGUIMIENTO: EtapaId[] = ["redaccion", "negociacion"];

export function ContratoDetalleClient({ contrato: contratoInicial }: { contrato: Contrato }) {
  const [contrato, setContrato] = React.useState(contratoInicial);
  const [etapaSel, setEtapaSel] = React.useState<EtapaId>(contratoInicial.etapaActual);

  return (
    <AppShell titulo="Detalle de contrato">
      <div className="mb-4">
        <Link href="/contratos" className="inline-flex items-center gap-1.5 text-[var(--text-sm)] text-brand-blue-700 hover:underline">
          <ArrowLeft size={13} /> Volver a Contratos
        </Link>
      </div>

      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="font-[var(--font-display)] text-[var(--text-2xl)] font-bold">{contrato.id}</span>
        <Badge variant="blue">{contrato.documento}</Badge>
        <Badge variant="gray">{contrato.tipoContrato}</Badge>
        <Badge variant={contrato.estadoContrato === "Vigente" ? "success" : contrato.estadoContrato === "Vencido" ? "danger" : "warning"}>
          {contrato.estadoContrato}
        </Badge>
      </div>
      <p className="mb-5 text-[var(--text-base)] text-[var(--color-text-secondary)]">
        {contrato.objeto} — {contrato.contraparteRazonSocial}
      </p>

      <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4.5 shadow-[var(--shadow-sm)]">
        <div className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
          Flujo del expediente — hacé click en una etapa para ver sus datos
        </div>
        <EstadoFlow actual={contrato.etapaActual} seleccionada={etapaSel} onSeleccionar={setEtapaSel} />
      </div>

      <PanelEtapa contrato={contrato} etapa={etapaSel} onCambio={setContrato} />

      <div className="mt-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4.5 shadow-[var(--shadow-sm)]">
        <h3 className="mb-2.5 font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">
          Historial de auditoría
        </h3>
        <HistorialAuditoria eventos={contrato.historial} />
      </div>
    </AppShell>
  );
}

function PanelEtapa({ contrato, etapa, onCambio }: { contrato: Contrato; etapa: EtapaId; onCambio: (c: Contrato) => void }) {
  const label = ETAPAS_ORDEN.find((e) => e.id === etapa)?.label ?? etapa;
  const esEtapaActual = etapa === contrato.etapaActual;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
      <div className="border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-3.5">
        <h3 className="font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">{label}</h3>
      </div>
      <div className="p-4.5">
        {etapa === "solicitud" && <DatosSolicitud contrato={contrato} />}
        {etapa === "aprobacion_solicitud" && <DatosAprobacionSolicitud contrato={contrato} esEtapaActual={esEtapaActual} onCambio={onCambio} />}
        {ETAPAS_CON_SEGUIMIENTO.includes(etapa) && <DatosSeguimiento contrato={contrato} onCambio={onCambio} />}
        {etapa === "encuadre_legal" && <DatosEncuadreLegal contrato={contrato} onCambio={onCambio} />}
        {etapa === "analisis_financiero" && <DatosAnalisisFinanciero contrato={contrato} />}
        {etapa === "acto_administrativo" && <DatosActoAdministrativo contrato={contrato} />}
        {etapa === "firma" && <DatosFirma contrato={contrato} esEtapaActual={esEtapaActual} onCambio={onCambio} />}
        {etapa === "repositorio" && <DatosRepositorio contrato={contrato} />}
        {etapa === "ejecucion" && <DatosEjecucion contrato={contrato} />}
        {etapa === "cumplimiento" && <DatosCumplimiento contrato={contrato} />}
        {etapa === "cierre" && <DatosCierre contrato={contrato} onCambio={onCambio} />}
      </div>
    </div>
  );
}

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

function DatosSolicitud({ contrato: c }: { contrato: Contrato }) {
  return (
    <Grilla>
      <Campo label="Área solicitante">{c.areaSolicitante}</Campo>
      <Campo label="Documento">{c.documento}</Campo>
      <Campo label="Tipo de contrato">{c.tipoContrato}</Campo>
      <Campo label="Objeto">{c.objeto}</Campo>
      <Campo label="Contraparte">{c.contraparteRazonSocial}</Campo>
      <Campo label="CUIT / DNI">{c.contraparteIdentificacion}</Campo>
      <Campo label="N° expediente vinculado">{c.numeroExpedienteVinculado ?? "Sin vincular todavía"}</Campo>
    </Grilla>
  );
}

/**
 * Aprobación de solicitud. Al aprobar se asigna el abogado responsable
 * (único, compartido por Redacción/Negociación/Encuadre legal — PRD tabla
 * 3) y el expediente avanza a Redacción. Bloqueado por rol: solo Jefatura
 * de Asesoramiento General, Gerencia de Asuntos Jurídicos o Administrador
 * pueden aprobar (`ROLES_APRUEBAN_SOLICITUD`).
 */
function DatosAprobacionSolicitud({ contrato, esEtapaActual, onCambio }: { contrato: Contrato; esEtapaActual: boolean; onCambio: (c: Contrato) => void }) {
  const { rolId } = useRol();
  const [aprobando, setAprobando] = React.useState(false);
  const [abogadoElegido, setAbogadoElegido] = React.useState(ABOGADOS[0]?.nombre ?? "");
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const puedeAprobar = esEtapaActual && contrato.estadoAprobacionSolicitud === "Pendiente" && puedeAccionar(rolId, ROLES_APRUEBAN_SOLICITUD);

  async function confirmarAprobacion() {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(`/api/contratos/${contrato.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estadoAprobacionSolicitud: "Aprobada",
          abogadoACargo: abogadoElegido,
          etapaActual: "redaccion",
        }),
      });
      if (!res.ok) throw new Error("No se pudo aprobar la solicitud.");
      onCambio(await res.json());
      setAprobando(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al aprobar la solicitud.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Grilla>
        <Campo label="Estado de aprobación">
          <Badge variant={contrato.estadoAprobacionSolicitud === "Aprobada" ? "success" : contrato.estadoAprobacionSolicitud === "Archivada" ? "gray" : "warning"}>
            {contrato.estadoAprobacionSolicitud}
          </Badge>
        </Campo>
        <Campo label="Plazo prudencial">
          {contrato.fechaLimitePlazoPrudencial ? (
            <>
              <SemaforoPlazo fechaISO={contrato.fechaLimitePlazoPrudencial} /> ({formatearFecha(contrato.fechaLimitePlazoPrudencial)})
            </>
          ) : (
            "Sin plazo configurado"
          )}
        </Campo>
        <Campo label="Respaldo en expediente">
          <Badge variant={contrato.respaldoEnExpediente ? "success" : "danger"}>{contrato.respaldoEnExpediente ? "Sí" : "No"}</Badge>
        </Campo>
        <Campo label="Abogado/a responsable">{contrato.abogadoACargo ?? "Sin asignar todavía"}</Campo>
      </Grilla>

      {!contrato.respaldoEnExpediente && contrato.estadoAprobacionSolicitud === "Pendiente" && (
        <Alert variant="warning" className="mt-4 mb-0">
          No se puede aprobar sin respaldo cargado en el expediente electrónico (PRD sección 6.2).
        </Alert>
      )}

      {puedeAprobar && (
        <div className="mt-4">
          {!aprobando ? (
            <Button variant="primary" size="sm" onClick={() => setAprobando(true)} disabled={!contrato.respaldoEnExpediente}>
              Aprobar solicitud
            </Button>
          ) : (
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-surface p-3.5">
              <div className="mb-2.5 text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                Asignar abogado/a responsable (Redacción, Negociación y Encuadre legal)
              </div>
              <div className="mb-3 max-w-[260px]">
                <Select value={abogadoElegido} onChange={(e) => setAbogadoElegido(e.target.value)}>
                  {ABOGADOS.map((a) => (
                    <option key={a.id} value={a.nombre}>{a.nombre}</option>
                  ))}
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setAprobando(false)}>Cancelar</Button>
                <Button variant="primary" size="sm" onClick={confirmarAprobacion} disabled={guardando}>
                  {guardando ? "Guardando…" : "Confirmar aprobación"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Encuadre legal — abogado ya asignado (viene de la aprobación de
 * solicitud), link del "Modelo final" en Word (se completa al emitir el
 * dictamen legal) y, a pedido del usuario, acá se dan de alta los hitos
 * contractuales y las garantías exigidas (tipo + descripción — la fecha de
 * presentación de cada garantía se completa después, en Firma).
 */
function DatosEncuadreLegal({ contrato, onCambio }: { contrato: Contrato; onCambio: (c: Contrato) => void }) {
  const [error, setError] = React.useState<string | null>(null);

  const [editandoModelo, setEditandoModelo] = React.useState(false);
  const [linkModelo, setLinkModelo] = React.useState(contrato.linkInstrumentoWord ?? "");
  const [guardandoModelo, setGuardandoModelo] = React.useState(false);

  const [nuevaFechaHito, setNuevaFechaHito] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [nuevoTipoHito, setNuevoTipoHito] = React.useState<HitoContractual["tipo"]>("vencimiento_vigencia");
  const [nuevaDescHito, setNuevaDescHito] = React.useState("");
  const [nuevoMontoHito, setNuevoMontoHito] = React.useState("");
  const [guardandoHito, setGuardandoHito] = React.useState(false);

  const [nuevoTipoGarantia, setNuevoTipoGarantia] = React.useState(MOCK_TIPOS_GARANTIA[0]);
  const [nuevaDescGarantia, setNuevaDescGarantia] = React.useState("");
  const [guardandoGarantia, setGuardandoGarantia] = React.useState(false);

  async function guardarModelo() {
    setGuardandoModelo(true);
    setError(null);
    try {
      const res = await fetch(`/api/contratos/${contrato.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkInstrumentoWord: linkModelo }),
      });
      if (!res.ok) throw new Error("No se pudo guardar el link del modelo final.");
      onCambio(await res.json());
      setEditandoModelo(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el link del modelo final.");
    } finally {
      setGuardandoModelo(false);
    }
  }

  async function agregarHito(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaFechaHito) return;
    if (nuevoTipoHito === "pago" && !nuevoMontoHito) return;
    setGuardandoHito(true);
    setError(null);
    try {
      const res = await fetch(`/api/contratos/${contrato.id}/hitos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: nuevoTipoHito,
          fecha: new Date(nuevaFechaHito).toISOString(),
          descripcion: nuevaDescHito || undefined,
          monto: nuevoMontoHito ? Number(nuevoMontoHito) : undefined,
        }),
      });
      if (!res.ok) throw new Error("No se pudo guardar el hito.");
      onCambio(await res.json());
      setNuevaDescHito("");
      setNuevoMontoHito("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el hito.");
    } finally {
      setGuardandoHito(false);
    }
  }

  async function agregarGarantia(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoTipoGarantia.trim() || !nuevaDescGarantia.trim()) return;
    setGuardandoGarantia(true);
    setError(null);
    try {
      const res = await fetch(`/api/contratos/${contrato.id}/garantias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: nuevoTipoGarantia, descripcion: nuevaDescGarantia }),
      });
      if (!res.ok) throw new Error("No se pudo guardar la garantía.");
      onCambio(await res.json());
      setNuevaDescGarantia("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la garantía.");
    } finally {
      setGuardandoGarantia(false);
    }
  }

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}

      <Grilla>
        <Campo label="Abogado/a responsable">{contrato.abogadoACargo ?? "Sin asignar"}</Campo>
        <Campo label="Fecha de dictamen legal">{formatearFecha(contrato.fechaDictamenLegal)}</Campo>
      </Grilla>

      <div className="my-5 border-t border-[var(--color-border)]" />

      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Modelo final (Word)</div>
        {!editandoModelo && (
          <Button size="xs" variant="ghost" onClick={() => setEditandoModelo(true)}>
            <Pencil size={11} /> Editar
          </Button>
        )}
      </div>
      {editandoModelo ? (
        <div className="mb-5 flex flex-col gap-3">
          <Input value={linkModelo} onChange={(e) => setLinkModelo(e.target.value)} placeholder="https://drive.google.com/..." />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditandoModelo(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={guardarModelo} disabled={guardandoModelo}>
              {guardandoModelo ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-5">
          <EnlaceODato href={contrato.linkInstrumentoWord} />
        </div>
      )}

      <div className="my-5 border-t border-[var(--color-border)]" />

      <div className="mb-2.5 text-[9px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        Hitos contractuales ({contrato.hitos.length})
      </div>
      {contrato.hitos.length === 0 && <p className="mb-3 text-[var(--text-sm)] text-[var(--color-text-muted)]">Sin hitos cargados.</p>}
      {contrato.hitos.map((h, i) => (
        <div key={i} className="flex items-center justify-between border-b border-[var(--color-border)] py-2 last:border-b-0">
          <div className="text-[var(--text-base)]">
            {formatearFecha(h.fecha)}
            {h.descripcion ? ` — ${h.descripcion}` : ""}
            {h.monto ? ` — ${formatearMonto(h.monto, contrato.moneda)}` : ""}
          </div>
          <Badge variant={h.tipo === "vencimiento_vigencia" ? "danger" : h.tipo === "pago" ? "warning" : "info"}>
            {TIPO_EVENTO_LABEL[h.tipo]}
          </Badge>
        </div>
      ))}

      <form onSubmit={agregarHito} className="mt-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-surface p-3.5">
        <div className="mb-2.5 text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
          + Agregar hito
        </div>
        <div className="mb-2.5 flex flex-wrap gap-3">
          <div className="min-w-[150px]">
            <label className="mb-1 block text-[var(--text-2xs)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Fecha
            </label>
            <Input type="date" value={nuevaFechaHito} onChange={(e) => setNuevaFechaHito(e.target.value)} />
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1 block text-[var(--text-2xs)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Tipo
            </label>
            <Select value={nuevoTipoHito} onChange={(e) => setNuevoTipoHito(e.target.value as HitoContractual["tipo"])}>
              <option value="vencimiento_vigencia">Vencimiento de vigencia</option>
              <option value="pago">Pago</option>
              <option value="libre">Libre</option>
            </Select>
          </div>
          {nuevoTipoHito === "pago" && (
            <div className="min-w-[140px]">
              <label className="mb-1 block text-[var(--text-2xs)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                Monto
              </label>
              <Input type="number" min={0} value={nuevoMontoHito} onChange={(e) => setNuevoMontoHito(e.target.value)} required />
            </div>
          )}
        </div>
        <div className="mb-2.5">
          <label className="mb-1 block text-[var(--text-2xs)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
            Descripción (opcional)
          </label>
          <Input value={nuevaDescHito} onChange={(e) => setNuevaDescHito(e.target.value)} placeholder="ej. Vencimiento del plazo original" />
        </div>
        <div className="text-right">
          <Button type="submit" variant="primary" size="sm" disabled={guardandoHito}>
            {guardandoHito ? "Guardando…" : "Agregar hito"}
          </Button>
        </div>
      </form>

      <div className="my-5 border-t border-[var(--color-border)]" />

      <div className="mb-2.5 text-[9px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        Garantías exigidas ({contrato.garantiasExigidas.length})
      </div>
      {contrato.garantiasExigidas.length === 0 && (
        <p className="mb-3 text-[var(--text-sm)] text-[var(--color-text-muted)]">Sin garantías cargadas todavía.</p>
      )}
      {contrato.garantiasExigidas.map((g) => (
        <div key={g.id} className="flex items-start gap-2 border-b border-[var(--color-border)] py-2 last:border-b-0">
          <Badge variant="blue">{g.tipo}</Badge>
          <span className="text-[var(--text-base)]">{g.descripcion}</span>
        </div>
      ))}

      <form onSubmit={agregarGarantia} className="mt-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-surface p-3.5">
        <div className="mb-2.5 text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
          + Agregar garantía
        </div>
        <div className="mb-2.5 flex flex-wrap gap-3">
          <div className="min-w-[180px] flex-1">
            <label className="mb-1 block text-[var(--text-2xs)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Tipo
            </label>
            <Select value={nuevoTipoGarantia} onChange={(e) => setNuevoTipoGarantia(e.target.value)}>
              {MOCK_TIPOS_GARANTIA.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div className="min-w-[240px] flex-[2]">
            <label className="mb-1 block text-[var(--text-2xs)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Descripción (monto, porcentaje, condiciones)
            </label>
            <Input value={nuevaDescGarantia} onChange={(e) => setNuevaDescGarantia(e.target.value)} placeholder="ej. 10% del monto total" required />
          </div>
        </div>
        <div className="text-right">
          <Button type="submit" variant="primary" size="sm" disabled={guardandoGarantia}>
            {guardandoGarantia ? "Guardando…" : "Agregar garantía"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function DatosAnalisisFinanciero({ contrato: c }: { contrato: Contrato }) {
  return (
    <div>
      <Grilla>
        <Campo label="Responsable">{c.responsableAnalisisFinanciero ?? "Sin asignar"}</Campo>
        <Campo label="Fecha de emisión">{formatearFecha(c.fechaAnalisisFinanciero)}</Campo>
      </Grilla>
      {!c.fechaDictamenLegal && (
        <Alert variant="warning" className="mt-4 mb-0">
          No hay dictamen legal cargado todavía. El PRD (sección 6.2) exige que el dictamen legal esté emitido antes de iniciar el análisis financiero.
        </Alert>
      )}
    </div>
  );
}

function DatosActoAdministrativo({ contrato: c }: { contrato: Contrato }) {
  return (
    <Grilla>
      <Campo label="N° de resolución">{c.numeroResolucion ?? "Sin cargar"}</Campo>
      <Campo label="Sector/Directorio emisor">{c.sectorEmisor ?? "Sin asignar (ver Biblioteca de sectores)"}</Campo>
    </Grilla>
  );
}

/**
 * Firma — se completa el link del "Contrato firmado" y, para cada garantía
 * exigida (dada de alta en Encuadre legal), la fecha en que se presentó.
 * Sin esa fecha en TODAS las garantías no se puede avanzar a Repositorio
 * (regla explícita del usuario). "Avanzar a Repositorio" está gateado por
 * rol (`ROLES_AVANZAN_A_REPOSITORIO`).
 */
function DatosFirma({ contrato, esEtapaActual, onCambio }: { contrato: Contrato; esEtapaActual: boolean; onCambio: (c: Contrato) => void }) {
  const { rolId } = useRol();
  const [error, setError] = React.useState<string | null>(null);

  const [editandoLink, setEditandoLink] = React.useState(false);
  const [linkFirmado, setLinkFirmado] = React.useState(contrato.linkContratoFirmadoEscaneado ?? "");
  const [guardandoLink, setGuardandoLink] = React.useState(false);

  const [fechasPorGarantia, setFechasPorGarantia] = React.useState<Record<string, string>>({});
  const [guardandoGarantiaId, setGuardandoGarantiaId] = React.useState<string | null>(null);

  const [avanzando, setAvanzando] = React.useState(false);

  const faltanFechas = contrato.garantiasExigidas.some((g) => !g.fechaPresentacion);
  const puedeAvanzar = esEtapaActual && puedeAccionar(rolId, ROLES_AVANZAN_A_REPOSITORIO);

  async function guardarLink() {
    setGuardandoLink(true);
    setError(null);
    try {
      const res = await fetch(`/api/contratos/${contrato.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkContratoFirmadoEscaneado: linkFirmado }),
      });
      if (!res.ok) throw new Error("No se pudo guardar el link del contrato firmado.");
      onCambio(await res.json());
      setEditandoLink(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el link del contrato firmado.");
    } finally {
      setGuardandoLink(false);
    }
  }

  async function guardarFechaGarantia(garantiaId: string) {
    const fecha = fechasPorGarantia[garantiaId];
    if (!fecha) return;
    setGuardandoGarantiaId(garantiaId);
    setError(null);
    try {
      const res = await fetch(`/api/contratos/${contrato.id}/garantias/${garantiaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fechaPresentacion: new Date(fecha).toISOString() }),
      });
      if (!res.ok) throw new Error("No se pudo guardar la fecha de presentación.");
      onCambio(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la fecha de presentación.");
    } finally {
      setGuardandoGarantiaId(null);
    }
  }

  async function avanzarARepositorio() {
    if (faltanFechas) return;
    setAvanzando(true);
    setError(null);
    try {
      const res = await fetch(`/api/contratos/${contrato.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapaActual: "repositorio" }),
      });
      if (!res.ok) throw new Error("No se pudo avanzar a Repositorio.");
      onCambio(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al avanzar a Repositorio.");
    } finally {
      setAvanzando(false);
    }
  }

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}

      <Grilla>
        <Campo label="Fecha de firma">{formatearFecha(contrato.fechaFirma)}</Campo>
      </Grilla>

      <div className="my-5 border-t border-[var(--color-border)]" />

      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Contrato firmado</div>
        {!editandoLink && (
          <Button size="xs" variant="ghost" onClick={() => setEditandoLink(true)}>
            <Pencil size={11} /> Editar
          </Button>
        )}
      </div>
      {editandoLink ? (
        <div className="mb-5 flex flex-col gap-3">
          <Input value={linkFirmado} onChange={(e) => setLinkFirmado(e.target.value)} placeholder="https://drive.google.com/..." />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditandoLink(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={guardarLink} disabled={guardandoLink}>
              {guardandoLink ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-5">
          <EnlaceODato href={contrato.linkContratoFirmadoEscaneado} />
        </div>
      )}

      <div className="my-5 border-t border-[var(--color-border)]" />

      <div className="mb-2.5 text-[9px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        Fecha de presentación de garantías ({contrato.garantiasExigidas.length})
      </div>
      {contrato.garantiasExigidas.length === 0 && (
        <p className="mb-3 text-[var(--text-sm)] text-[var(--color-text-muted)]">Este contrato no tiene garantías exigidas cargadas.</p>
      )}
      {contrato.garantiasExigidas.map((g) => (
        <div key={g.id} className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] py-2.5 last:border-b-0">
          <Badge variant="blue">{g.tipo}</Badge>
          <span className="flex-1 text-[var(--text-base)]">{g.descripcion}</span>
          {g.fechaPresentacion ? (
            <Badge variant="success">Presentada el {formatearFecha(g.fechaPresentacion)}</Badge>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={fechasPorGarantia[g.id] ?? ""}
                onChange={(e) => setFechasPorGarantia({ ...fechasPorGarantia, [g.id]: e.target.value })}
              />
              <Button
                size="xs"
                variant="primary"
                onClick={() => guardarFechaGarantia(g.id)}
                disabled={!fechasPorGarantia[g.id] || guardandoGarantiaId === g.id}
              >
                {guardandoGarantiaId === g.id ? "Guardando…" : "Guardar fecha"}
              </Button>
            </div>
          )}
        </div>
      ))}

      {faltanFechas && contrato.garantiasExigidas.length > 0 && (
        <Alert variant="warning" className="mt-4 mb-0">
          Faltan fechas de presentación en al menos una garantía. No se puede avanzar a Repositorio hasta completarlas.
        </Alert>
      )}

      {puedeAvanzar && (
        <div className="mt-4 text-right">
          <Button variant="primary" size="sm" onClick={avanzarARepositorio} disabled={faltanFechas || avanzando}>
            {avanzando ? "Avanzando…" : "Avanzar a Repositorio"}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Repositorio — solo lectura; ambos links se cargan antes (Modelo final en Encuadre legal, Contrato firmado en Firma). */
function DatosRepositorio({ contrato: c }: { contrato: Contrato }) {
  return (
    <Grilla>
      <Campo label="Modelo final (Word)">
        <EnlaceODato href={c.linkInstrumentoWord} />
      </Campo>
      <Campo label="Contrato firmado">
        <EnlaceODato href={c.linkContratoFirmadoEscaneado} />
      </Campo>
    </Grilla>
  );
}

function DatosEjecucion({ contrato: c }: { contrato: Contrato }) {
  return (
    <div>
      <Grilla>
        <Campo label="Inicio de vigencia">{formatearFecha(c.fechaInicioVigencia)}</Campo>
        <Campo label="Fin de vigencia">{formatearFecha(c.fechaFinVigencia)}</Campo>
        <Campo label="Monto total">{formatearMonto(c.montoTotal, c.moneda)}</Campo>
        <Campo label="Responsable de seguimiento">{c.responsableSeguimiento ?? "Sin asignar"}</Campo>
      </Grilla>

      <div className="mt-4">
        <div className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
          Hitos contractuales ({c.hitos.length})
        </div>
        {c.hitos.length === 0 && <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">Sin hitos cargados.</p>}
        {c.hitos.map((h, i) => (
          <div key={i} className="flex items-center justify-between border-b border-[var(--color-border)] py-2 last:border-b-0">
            <div className="text-[var(--text-base)]">
              {formatearFecha(h.fecha)}
              {h.descripcion ? ` — ${h.descripcion}` : ""}
              {h.monto ? ` — ${formatearMonto(h.monto, c.moneda)}` : ""}
            </div>
            <Badge variant={h.tipo === "vencimiento_vigencia" ? "danger" : h.tipo === "pago" ? "warning" : "info"}>
              {TIPO_EVENTO_LABEL[h.tipo]}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function DatosCumplimiento({ contrato: c }: { contrato: Contrato }) {
  return (
    <Grilla>
      <Campo label="Estado del contrato">
        <Badge variant={c.estadoContrato === "Vigente" ? "success" : "warning"}>{c.estadoContrato}</Badge>
      </Campo>
    </Grilla>
  );
}

/**
 * Renovación / Cierre — cláusulas (prórroga, rescisión + plazo de preaviso
 * en días, penalidad) y garantías exigidas (PRD sección 4.2). Antes de esto
 * el panel no tenía estos campos modelados; se agregaron a pedido del
 * usuario, con "plazo de rescisión" como cantidad de días (numérico), no
 * texto libre ni fecha.
 */
function DatosCierre({ contrato: c, onCambio }: { contrato: Contrato; onCambio: (c: Contrato) => void }) {
  const [error, setError] = React.useState<string | null>(null);

  const [editandoClausulas, setEditandoClausulas] = React.useState(false);
  const [clausulas, setClausulas] = React.useState({
    clausulaProrroga: c.clausulaProrroga,
    clausulaRescision: c.clausulaRescision,
    plazoRescisionDias: c.plazoRescisionDias?.toString() ?? "",
    clausulaPenalidad: c.clausulaPenalidad,
  });
  const [guardandoClausulas, setGuardandoClausulas] = React.useState(false);

  async function guardarClausulas() {
    setGuardandoClausulas(true);
    setError(null);
    try {
      const res = await fetch(`/api/contratos/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clausulaProrroga: clausulas.clausulaProrroga,
          clausulaRescision: clausulas.clausulaRescision,
          plazoRescisionDias: clausulas.clausulaRescision && clausulas.plazoRescisionDias ? Number(clausulas.plazoRescisionDias) : undefined,
          clausulaPenalidad: clausulas.clausulaPenalidad,
        }),
      });
      if (!res.ok) throw new Error("No se pudieron guardar las cláusulas.");
      onCambio(await res.json());
      setEditandoClausulas(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar las cláusulas.");
    } finally {
      setGuardandoClausulas(false);
    }
  }

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}

      <Grilla>
        <Campo label="Estado del contrato">
          <Badge variant={c.estadoContrato === "Vigente" ? "success" : c.estadoContrato === "Vencido" ? "danger" : "warning"}>
            {c.estadoContrato}
          </Badge>
        </Campo>
      </Grilla>

      <div className="my-5 border-t border-[var(--color-border)]" />

      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Cláusulas</div>
        {!editandoClausulas && (
          <Button size="xs" variant="ghost" onClick={() => setEditandoClausulas(true)}>
            <Pencil size={11} /> Editar
          </Button>
        )}
      </div>

      {editandoClausulas ? (
        <div className="mb-5 flex flex-col gap-3">
          <label className="flex items-center gap-2 text-[var(--text-base)]">
            <input
              type="checkbox"
              checked={clausulas.clausulaProrroga}
              onChange={(e) => setClausulas({ ...clausulas, clausulaProrroga: e.target.checked })}
            />
            Tiene cláusula de prórroga
          </label>
          <label className="flex items-center gap-2 text-[var(--text-base)]">
            <input
              type="checkbox"
              checked={clausulas.clausulaRescision}
              onChange={(e) => setClausulas({ ...clausulas, clausulaRescision: e.target.checked })}
            />
            Tiene cláusula de rescisión
          </label>
          {clausulas.clausulaRescision && (
            <div className="ml-6 max-w-[220px]">
              <label className="mb-1 block text-[var(--text-2xs)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                Plazo de preaviso (días)
              </label>
              <Input
                type="number"
                min={0}
                value={clausulas.plazoRescisionDias}
                onChange={(e) => setClausulas({ ...clausulas, plazoRescisionDias: e.target.value })}
                placeholder="ej. 30"
              />
            </div>
          )}
          <label className="flex items-center gap-2 text-[var(--text-base)]">
            <input
              type="checkbox"
              checked={clausulas.clausulaPenalidad}
              onChange={(e) => setClausulas({ ...clausulas, clausulaPenalidad: e.target.checked })}
            />
            Tiene cláusula de penalidad
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditandoClausulas(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={guardarClausulas} disabled={guardandoClausulas}>
              {guardandoClausulas ? "Guardando…" : "Guardar cláusulas"}
            </Button>
          </div>
        </div>
      ) : (
        <Grilla>
          <Campo label="Prórroga">
            <Badge variant={c.clausulaProrroga ? "success" : "gray"}>{c.clausulaProrroga ? "Sí" : "No"}</Badge>
          </Campo>
          <Campo label="Rescisión">
            <Badge variant={c.clausulaRescision ? "success" : "gray"}>{c.clausulaRescision ? "Sí" : "No"}</Badge>
            {c.clausulaRescision && c.plazoRescisionDias !== undefined && (
              <span className="ml-1.5 text-[var(--text-sm)] text-[var(--color-text-muted)]">
                ({c.plazoRescisionDias} días de preaviso)
              </span>
            )}
          </Campo>
          <Campo label="Penalidad">
            <Badge variant={c.clausulaPenalidad ? "success" : "gray"}>{c.clausulaPenalidad ? "Sí" : "No"}</Badge>
          </Campo>
        </Grilla>
      )}

      <div className="my-5 border-t border-[var(--color-border)]" />

      <div className="mb-2.5 text-[9px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        Garantías exigidas ({c.garantiasExigidas.length})
      </div>
      <p className="mb-2.5 text-[var(--text-sm)] text-[var(--color-text-muted)]">
        Se dan de alta en Encuadre legal; la fecha de presentación se completa en Firma.
      </p>
      {c.garantiasExigidas.length === 0 && (
        <p className="mb-3 text-[var(--text-sm)] text-[var(--color-text-muted)]">Sin garantías cargadas todavía.</p>
      )}
      {c.garantiasExigidas.map((g) => (
        <div key={g.id} className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] py-2 last:border-b-0">
          <Badge variant="blue">{g.tipo}</Badge>
          <span className="flex-1 text-[var(--text-base)]">{g.descripcion}</span>
          {g.fechaPresentacion ? (
            <Badge variant="success">Presentada el {formatearFecha(g.fechaPresentacion)}</Badge>
          ) : (
            <Badge variant="warning">Sin fecha de presentación</Badge>
          )}
        </div>
      ))}
    </div>
  );
}

function EnlaceODato({ href }: { href?: string }) {
  if (!href) return <span className="text-[var(--color-text-muted)]">Sin cargar</span>;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-brand-blue-700 hover:underline">
      Abrir enlace
    </a>
  );
}

/**
 * Panel de Redacción/Negociación: links de seguimiento del documento +
 * anotaciones de seguimiento. Es contenido a nivel contrato (no por etapa
 * puntual), por eso se muestra igual desde el nodo "Redacción" o
 * "Negociación" — el PRD dice explícitamente que estas dos etapas pueden
 * alternar y no son estrictamente secuenciales (sección 5, ítem 3.b).
 */
function DatosSeguimiento({ contrato: c, onCambio }: { contrato: Contrato; onCambio: (c: Contrato) => void }) {
  const [editandoLink, setEditandoLink] = React.useState(false);
  const [linkProyecto, setLinkProyecto] = React.useState(c.linkBorradorDrive ?? "");
  const [guardandoLink, setGuardandoLink] = React.useState(false);

  const [nuevaFecha, setNuevaFecha] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [nuevoTipo, setNuevoTipo] = React.useState(MOCK_TIPOS_ANOTACION[0]);
  const [nuevaObs, setNuevaObs] = React.useState("");
  const [guardandoAnotacion, setGuardandoAnotacion] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function guardarLink() {
    setGuardandoLink(true);
    setError(null);
    try {
      const res = await fetch(`/api/contratos/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkBorradorDrive: linkProyecto }),
      });
      if (!res.ok) throw new Error("No se pudo guardar el link del proyecto de contrato.");
      onCambio(await res.json());
      setEditandoLink(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el link del proyecto de contrato.");
    } finally {
      setGuardandoLink(false);
    }
  }

  async function agregarAnotacion(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaObs.trim()) return;
    setGuardandoAnotacion(true);
    setError(null);
    try {
      const res = await fetch(`/api/contratos/${c.id}/anotaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha: new Date(nuevaFecha).toISOString(), tipo: nuevoTipo, observaciones: nuevaObs }),
      });
      if (!res.ok) throw new Error("No se pudo guardar la anotación.");
      onCambio(await res.json());
      setNuevaObs("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la anotación.");
    } finally {
      setGuardandoAnotacion(false);
    }
  }

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}

      <Grilla>
        <Campo label="Abogado/a responsable">{c.abogadoACargo ?? "Sin asignar"}</Campo>
      </Grilla>

      <div className="my-5 border-t border-[var(--color-border)]" />

      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
          Proyecto de contrato
        </div>
        {!editandoLink && (
          <Button size="xs" variant="ghost" onClick={() => setEditandoLink(true)}>
            <Pencil size={11} /> Editar
          </Button>
        )}
      </div>

      {editandoLink ? (
        <div className="mb-5 flex flex-col gap-3">
          <Input value={linkProyecto} onChange={(e) => setLinkProyecto(e.target.value)} placeholder="https://drive.google.com/..." />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditandoLink(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={guardarLink} disabled={guardandoLink}>
              {guardandoLink ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-5">
          <EnlaceODato href={c.linkBorradorDrive} />
        </div>
      )}

      <div className="my-5 border-t border-[var(--color-border)]" />

      <div className="mb-2.5 text-[9px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        Anotaciones de seguimiento ({c.anotacionesSeguimiento.length})
      </div>

      {c.anotacionesSeguimiento.length === 0 && (
        <p className="mb-3 text-[var(--text-sm)] text-[var(--color-text-muted)]">Sin anotaciones cargadas todavía.</p>
      )}
      {c.anotacionesSeguimiento
        .slice()
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .map((a, i) => (
          <div key={i} className="border-b border-[var(--color-border)] py-2.5 last:border-b-0">
            <div className="mb-0.5 flex items-center gap-2">
              <Badge variant="blue">{a.tipo}</Badge>
              <span className="text-[var(--text-sm)] text-[var(--color-text-muted)]">
                {formatearFecha(a.fecha)}{a.usuario ? ` · ${a.usuario}` : ""}
              </span>
            </div>
            <div className="text-[var(--text-base)]">{a.observaciones}</div>
          </div>
        ))}

      <form onSubmit={agregarAnotacion} className="mt-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-surface p-3.5">
        <div className="mb-2.5 text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
          + Agregar anotación
        </div>
        <div className="mb-2.5 flex flex-wrap gap-3">
          <div className="min-w-[150px]">
            <label className="mb-1 block text-[var(--text-2xs)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Fecha
            </label>
            <Input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} />
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1 block text-[var(--text-2xs)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Tipo de ingreso
            </label>
            <Select value={nuevoTipo} onChange={(e) => setNuevoTipo(e.target.value)}>
              {MOCK_TIPOS_ANOTACION.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mb-2.5">
          <label className="mb-1 block text-[var(--text-2xs)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
            Observaciones
          </label>
          <textarea
            value={nuevaObs}
            onChange={(e) => setNuevaObs(e.target.value)}
            required
            rows={3}
            placeholder="Detalle de la reunión, propuesta, llamado, etc."
            className="w-full rounded-[var(--radius-sm)] border-[1.5px] border-[var(--color-border)] bg-white px-[11px] py-[7px] text-[var(--text-base)] focus:outline-none focus:border-brand-blue-500 focus:ring-[3px] focus:ring-[rgba(0,102,192,0.1)]"
          />
        </div>
        <div className="text-right">
          <Button type="submit" variant="primary" size="sm" disabled={guardandoAnotacion}>
            {guardandoAnotacion ? "Guardando…" : "Agregar anotación"}
          </Button>
        </div>
      </form>
    </div>
  );
}
