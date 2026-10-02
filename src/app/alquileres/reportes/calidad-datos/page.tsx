import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/domain/alert";
import { auth } from "@/auth";
import { puedeExportarReporte, puedeVerReporte } from "@/lib/alquileres/permisos";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioInmuebles } from "@/lib/alquileres/datos/inmuebles";
import { getRepositorioActuacionPartes } from "@/lib/alquileres/datos/actuacion-partes";
import { getRepositorioPersonas } from "@/lib/alquileres/datos/personas";
import { getRepositorioDocumentos } from "@/lib/alquileres/datos/documentos";
import { calcularCalidadDatos } from "@/lib/alquileres/reglas/rp09-calidad-datos";

export const dynamic = "force-dynamic";

const ETIQUETA_TIPO: Record<string, string> = {
  SIN_FIRMANTE: "Sin firmante",
  SIN_PARTIDA: "Sin partida",
  SIN_MAIL_LOCADOR: "Sin mail del locador",
  SIN_CONDICION_IVA: "Sin condición de IVA",
  FORMALIZADA_SIN_ESCANEADO: "Formalizada sin escaneado",
  PERSONA_DUPLICADA: "Persona duplicada",
};

/** RP-09 — Calidad de datos (V5). */
export default async function ReporteCalidadDatosPage() {
  const session = await auth();
  const rol = session?.user?.rolAlquileres;

  if (!puedeVerReporte(rol, "RP-09")) {
    return (
      <AppShell titulo="RP-09 — Calidad de datos">
        <Alert variant="warning">Tu rol no tiene acceso a este reporte.</Alert>
      </AppShell>
    );
  }

  const [actuaciones, inmuebles, partes, personas, documentos] = await Promise.all([
    getRepositorioActuaciones().listar(),
    getRepositorioInmuebles().listar(),
    getRepositorioActuacionPartes().listar(),
    getRepositorioPersonas().listar(),
    getRepositorioDocumentos().listar(),
  ]);

  const hallazgos = calcularCalidadDatos({ actuaciones, inmuebles, partes, personas, documentos });

  return (
    <AppShell titulo="RP-09 — Calidad de datos">
      <div className="mb-1 flex items-center justify-between">
        <div className="font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Calidad de datos</div>
        {puedeExportarReporte(rol, "RP-09") && (
          <a href="/api/alquileres/reportes/calidad-datos?formato=csv" className="text-[var(--text-sm)] font-semibold text-brand-blue-700 hover:underline">
            Exportar CSV
          </a>
        )}
      </div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">{hallazgos.length} hallazgo(s) pendiente(s) de corregir.</p>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        {hallazgos.length === 0 ? (
          <p className="p-4.5 text-[var(--color-text-muted)]">Sin hallazgos — los datos cargados pasan los chequeos de calidad.</p>
        ) : (
          <table className="w-full text-[var(--text-base)]">
            <thead>
              <tr className="border-b-2 border-[var(--color-border)] bg-[var(--overlay-brand-04)] text-left text-[var(--text-xs)] font-bold uppercase text-[var(--color-text-secondary)]">
                <th className="px-3.5 py-2.5">Tipo</th>
                <th className="px-3.5 py-2.5">Actuación</th>
                <th className="px-3.5 py-2.5">Inmueble</th>
                <th className="px-3.5 py-2.5">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {hallazgos.map((h, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-3.5 py-2.5 font-semibold">{ETIQUETA_TIPO[h.tipo]}</td>
                  <td className="px-3.5 py-2.5 font-mono text-[var(--text-sm)]">{h.actuacionId ?? "—"}</td>
                  <td className="px-3.5 py-2.5">{h.inmuebleId ?? "—"}</td>
                  <td className="px-3.5 py-2.5 text-[var(--color-text-secondary)]">{h.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
