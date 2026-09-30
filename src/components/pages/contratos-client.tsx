"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SemaforoPlazo } from "@/components/domain/semaforo-plazo";
import { MOCK_TIPOS_CONTRATO, MOCK_USUARIOS } from "@/lib/data/mock-catalogos";
import { Contrato, Documento, EstadoContrato } from "@/lib/types";
import { formatearMonto } from "@/lib/fechas";
import { useRol } from "@/lib/session";
import { puedeVerContrato } from "@/lib/permisos";

const DOCUMENTOS: Documento[] = ["Contrato", "Convenio", "Acta Acuerdo", "Adenda"];
const ESTADOS: EstadoContrato[] = ["Vigente", "Vencido", "Prórroga", "Rescindido"];
const ABOGADOS = Array.from(new Set(MOCK_USUARIOS.filter((u) => u.rolId === "abogado").map((u) => u.nombre)));

const ESTADO_BADGE: Record<EstadoContrato, "success" | "danger" | "warning" | "gray"> = {
  Vigente: "success",
  Vencido: "danger",
  Prórroga: "warning",
  Rescindido: "gray",
};

export function ContratosClient({ contratos }: { contratos: Contrato[] }) {
  const { rolId } = useRol();
  const router = useRouter();
  const [busqueda, setBusqueda] = React.useState("");
  const [documento, setDocumento] = React.useState("");
  const [estado, setEstado] = React.useState("");
  const [sector, setSector] = React.useState("");
  const [tipo, setTipo] = React.useState("");
  const [abogado, setAbogado] = React.useState("");

  const sectoresRequirentes = Array.from(new Set(contratos.map((c) => c.areaSolicitante)));

  const filtrados = contratos.filter((c) => {
    if (!puedeVerContrato(rolId, c.etapaActual)) return false;
    if (documento && c.documento !== documento) return false;
    if (estado && c.estadoContrato !== estado) return false;
    if (sector && c.areaSolicitante !== sector) return false;
    if (tipo && c.tipoContrato !== tipo) return false;
    if (abogado && c.abogadoACargo !== abogado) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      const enTexto = `${c.id} ${c.objeto} ${c.contraparteRazonSocial}`.toLowerCase();
      if (!enTexto.includes(q)) return false;
    }
    return true;
  });

  const filtrosActivos = [
    documento && { label: `Documento: ${documento}`, clear: () => setDocumento("") },
    estado && { label: `Estado: ${estado}`, clear: () => setEstado("") },
    sector && { label: `Sector requirente: ${sector}`, clear: () => setSector("") },
    tipo && { label: `Tipo: ${tipo}`, clear: () => setTipo("") },
    abogado && { label: `Abogado a cargo: ${abogado}`, clear: () => setAbogado("") },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  function limpiarFiltros() {
    setDocumento("");
    setEstado("");
    setSector("");
    setTipo("");
    setAbogado("");
  }

  function abrir(c: Contrato) {
    router.push(`/contratos/${c.id}`);
  }

  return (
    <AppShell titulo="Contratos">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Contratos</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Repositorio de contratos, convenios y actas acuerdo
      </p>

      <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4.5 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-[2]">
            <label className="mb-1 block text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Buscar
            </label>
            <Input placeholder="Nº de expediente, contraparte, objeto…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="min-w-[160px] flex-1">
            <label className="mb-1 block text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Documento
            </label>
            <Select value={documento} onChange={(e) => setDocumento(e.target.value)}>
              <option value="">Todos</option>
              {DOCUMENTOS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </div>
          <div className="min-w-[160px] flex-1">
            <label className="mb-1 block text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Tipo de contrato
            </label>
            <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Todos</option>
              {MOCK_TIPOS_CONTRATO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div className="min-w-[160px] flex-1">
            <label className="mb-1 block text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Sector requirente
            </label>
            <Select value={sector} onChange={(e) => setSector(e.target.value)}>
              <option value="">Todos</option>
              {sectoresRequirentes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div className="min-w-[160px] flex-1">
            <label className="mb-1 block text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Abogado a cargo
            </label>
            <Select value={abogado} onChange={(e) => setAbogado(e.target.value)}>
              <option value="">Todos</option>
              {ABOGADOS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
          </div>
          <div className="min-w-[160px] flex-1">
            <label className="mb-1 block text-[var(--text-sm)] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Estado
            </label>
            <Select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="">Todos</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </Select>
          </div>
        </div>

        {filtrosActivos.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {filtrosActivos.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-surface-2 px-2.5 py-1 text-[var(--text-xs)] text-[var(--color-text-secondary)]"
              >
                {f.label}
                <button onClick={f.clear} className="text-[var(--color-text-muted)]">×</button>
              </span>
            ))}
            <Button variant="ghost" size="xs" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--overlay-brand-04)] px-4.5 py-3.5">
          <h3 className="font-[var(--font-display)] text-[var(--text-md)] font-bold uppercase tracking-wide">
            {filtrados.length} contratos
          </h3>
          <Button variant="orange" size="sm" asChild>
            <a href="/nueva-solicitud">+ Nueva solicitud</a>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[var(--text-base)]">
            <thead>
              <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
                <th className="px-3.5 py-2.5">Expediente</th>
                <th className="px-3.5 py-2.5">Documento / Tipo</th>
                <th className="px-3.5 py-2.5">Contraparte</th>
                <th className="px-3.5 py-2.5">Abogado</th>
                <th className="px-3.5 py-2.5">Sector requirente</th>
                <th className="px-3.5 py-2.5">Monto</th>
                <th className="px-3.5 py-2.5">Vigencia</th>
                <th className="px-3.5 py-2.5">Estado</th>
                <th className="px-3.5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id} className="cursor-pointer border-b border-[var(--color-border)] last:border-b-0 hover:bg-surface" onClick={() => abrir(c)}>
                  <td className="px-3.5 py-2.5">
                    <div className="font-semibold">{c.id}</div>
                    <div className="text-[var(--text-sm)] text-[var(--color-text-muted)]">{c.objeto}</div>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <Badge variant="blue">{c.documento}</Badge>{" "}
                    {c.adendaDeId ? <Badge variant="gray">vinculada a {c.adendaDeId}</Badge> : <Badge variant="gray">{c.tipoContrato}</Badge>}
                  </td>
                  <td className="px-3.5 py-2.5">{c.contraparteRazonSocial}</td>
                  <td className="px-3.5 py-2.5">{c.abogadoACargo ?? "Sin asignar"}</td>
                  <td className="px-3.5 py-2.5">{c.areaSolicitante}</td>
                  <td className="px-3.5 py-2.5">{formatearMonto(c.montoTotal, c.moneda)}</td>
                  <td className="px-3.5 py-2.5">
                    <SemaforoPlazo fechaISO={c.fechaFinVigencia} sinPlazoLabel="—" />
                  </td>
                  <td className="px-3.5 py-2.5">
                    <Badge variant={ESTADO_BADGE[c.estadoContrato]}>{c.estadoContrato}</Badge>
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); abrir(c); }}>
                      Ver
                    </Button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3.5 py-6 text-center text-[var(--color-text-muted)]">
                    Sin resultados para estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </AppShell>
  );
}
