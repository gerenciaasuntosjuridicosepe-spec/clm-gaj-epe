import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { ROLES_LISTA, accesoEtapa, puedeVerDashboardsCompletos } from "@/lib/permisos";
import { ETAPAS_ORDEN } from "@/lib/types";
import {
  MATRIZ_GESTION,
  MATRIZ_PERSONAS,
  MATRIZ_HITOS,
  MATRIZ_ADMINISTRACION,
  MATRIZ_DOCUMENTOS,
  MATRIZ_COMUNICACIONES,
  MATRIZ_CONTACTOS_EPE,
  MATRIZ_REPORTES,
  ETIQUETAS_ROL_ALQUILERES,
  type AccionAlquileres,
  type CodigoReporte,
} from "@/lib/alquileres/permisos";
import type { RolAlquileresId } from "@/lib/alquileres/tipos";

const ROLES_ALQUILERES: RolAlquileresId[] = ["ADMINISTRADOR", "GESTOR", "SUPERVISOR", "LECTOR"];

const AREAS_ALQUILERES = [
  { label: "Inmuebles / Expedientes / Actuaciones", matriz: MATRIZ_GESTION },
  { label: "Personas (locadores)", matriz: MATRIZ_PERSONAS },
  { label: "Hitos", matriz: MATRIZ_HITOS },
  { label: "Comunicaciones", matriz: MATRIZ_COMUNICACIONES },
  { label: "Documentos y actos administrativos", matriz: MATRIZ_DOCUMENTOS },
  { label: "Contactos EPE / localidades", matriz: MATRIZ_CONTACTOS_EPE },
  { label: "Catálogos y configuración", matriz: MATRIZ_ADMINISTRACION },
];

const ABREVIATURA_ACCION: Record<AccionAlquileres, string> = {
  leer: "L",
  crear: "C",
  editar: "E",
  baja: "B",
};

const REPORTES: { codigo: CodigoReporte; nombre: string }[] = [
  { codigo: "RP-01", nombre: "Vencimientos por horizonte" },
  { codigo: "RP-02", nombre: "Cartera de contratos vigentes" },
  { codigo: "RP-09", nombre: "Calidad de datos" },
  { codigo: "RP-10", nombre: "Actividad y cambios" },
];

function celdaAcceso(valor: "R" | "V" | "-") {
  if (valor === "R") return <Badge variant="blue">Responsable</Badge>;
  if (valor === "V") return <Badge variant="gray">Visibilidad</Badge>;
  return <span className="text-[var(--color-text-muted)]">—</span>;
}

function celdaReporte(codigo: CodigoReporte, rol: RolAlquileresId) {
  const permiso = MATRIZ_REPORTES[codigo];
  const puedeVer = permiso.verPara.includes(rol);
  const puedeExportar = permiso.exportarPara.includes(rol);
  if (!puedeVer) return <span className="text-[var(--color-text-muted)]">—</span>;
  if (puedeExportar) return <Badge variant="success">Ver + exportar</Badge>;
  if (permiso.tieneDatosPersonales) return <Badge variant="gray">Ver (agregado)</Badge>;
  return <Badge variant="gray">Ver</Badge>;
}

/** Referencia de solo lectura: qué puede hacer cada rol del CLM y de Alquileres — no gestiona nada, los roles se asignan en Usuarios y roles. */
export default function RolesAccesosPage() {
  return (
    <AppShell titulo="Roles y accesos">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Roles y accesos</div>
      <p className="mb-6 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Referencia de qué puede hacer cada rol. Esto no asigna roles — eso se hace desde{" "}
        <span className="font-semibold">Usuarios y roles</span>.
      </p>

      <h2 className="mb-2 font-[var(--font-display)] text-[var(--text-lg)] font-bold">CLM — acceso por etapa del flujo</h2>
      <p className="mb-3 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        &quot;Responsable&quot; = ejecuta esa etapa. &quot;Visibilidad&quot; = puede ver, no accionar. &quot;—&quot; = sin acceso.
      </p>
      <div className="mb-8 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <table className="w-full text-[var(--text-sm)]">
          <thead>
            <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
              <th className="sticky left-0 bg-[var(--overlay-brand-04)] px-3.5 py-2.5">Rol</th>
              {ETAPAS_ORDEN.map((e) => (
                <th key={e.id} className="whitespace-nowrap px-3 py-2.5">{e.label}</th>
              ))}
              <th className="whitespace-nowrap px-3 py-2.5">Dashboards</th>
            </tr>
          </thead>
          <tbody>
            {ROLES_LISTA.map((rol) => (
              <tr key={rol.id} className="border-b border-[var(--color-border)] last:border-b-0">
                <td className="sticky left-0 bg-white px-3.5 py-2.5 font-semibold">{rol.nombre}</td>
                {ETAPAS_ORDEN.map((e) => (
                  <td key={e.id} className="whitespace-nowrap px-3 py-2.5">{celdaAcceso(accesoEtapa(rol.id, e.id))}</td>
                ))}
                <td className="whitespace-nowrap px-3 py-2.5">
                  {puedeVerDashboardsCompletos(rol.id) ? <Badge variant="success">Sí</Badge> : <span className="text-[var(--color-text-muted)]">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 font-[var(--font-display)] text-[var(--text-lg)] font-bold">Alquileres — acceso por área</h2>
      <p className="mb-3 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        L = leer, C = crear, E = editar, B = baja lógica/anulación. &quot;—&quot; = sin acceso.
      </p>
      <div className="mb-8 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <table className="w-full text-[var(--text-sm)]">
          <thead>
            <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
              <th className="px-3.5 py-2.5">Área</th>
              {ROLES_ALQUILERES.map((rol) => (
                <th key={rol} className="whitespace-nowrap px-3 py-2.5">{ETIQUETAS_ROL_ALQUILERES[rol]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AREAS_ALQUILERES.map((area) => (
              <tr key={area.label} className="border-b border-[var(--color-border)] last:border-b-0">
                <td className="px-3.5 py-2.5 font-semibold">{area.label}</td>
                {ROLES_ALQUILERES.map((rol) => {
                  const acciones = area.matriz[rol];
                  return (
                    <td key={rol} className="whitespace-nowrap px-3 py-2.5">
                      {acciones.length === 0 ? (
                        <span className="text-[var(--color-text-muted)]">—</span>
                      ) : (
                        acciones.map((a) => ABREVIATURA_ACCION[a]).join(" ")
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 font-[var(--font-display)] text-[var(--text-lg)] font-bold">Alquileres — reportes</h2>
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <table className="w-full text-[var(--text-sm)]">
          <thead>
            <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
              <th className="px-3.5 py-2.5">Reporte</th>
              {ROLES_ALQUILERES.map((rol) => (
                <th key={rol} className="whitespace-nowrap px-3 py-2.5">{ETIQUETAS_ROL_ALQUILERES[rol]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REPORTES.map((r) => (
              <tr key={r.codigo} className="border-b border-[var(--color-border)] last:border-b-0">
                <td className="px-3.5 py-2.5 font-semibold">{r.codigo} — {r.nombre}</td>
                {ROLES_ALQUILERES.map((rol) => (
                  <td key={rol} className="whitespace-nowrap px-3 py-2.5">{celdaReporte(r.codigo, rol)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
