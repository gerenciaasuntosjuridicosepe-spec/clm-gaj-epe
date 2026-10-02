import { AppShell } from "@/components/layout/app-shell";
import { AlquileresDashboardClient } from "@/components/pages/alquileres-dashboard-client";
import { RespaldoAdmin } from "@/components/pages/alquileres-respaldo-admin";
import { auth } from "@/auth";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioActuacionHitos } from "@/lib/alquileres/datos/actuacion-hitos";
import { getRepositorioDocumentos } from "@/lib/alquileres/datos/documentos";
import { obtenerParametro } from "@/lib/alquileres/datos/parametros";
import { calcularDashboard } from "@/lib/alquileres/reglas/dashboard";
import { alertaA8SinRespaldoReciente } from "@/lib/alquileres/reglas/alertas";
import { CFG_HITOS_TIPO_SEED } from "@/lib/alquileres/catalogos/hitos-seed";
import { numeroParametro, PARAMETROS_SEED } from "@/lib/alquileres/catalogos/parametros-seed";
import { diferenciaDias, hoy } from "@/lib/alquileres/fechas";

export const dynamic = "force-dynamic";

/**
 * Dashboard del módulo (RF-40/sección 8 del PRD v1) — página de inicio de
 * Alquileres. Nota de alcance: la situación de vigencia/semáforo/canon
 * dependen de `fecha_fin` (recién se carga al formalizar, RF-12) y A6
 * (formalizada sin escaneado) depende de que exista al menos un
 * DOCUMENTO con `tipoDocumento: "ESCANEADO"` y `firmado: true` (RF-28,
 * Fase 3) — con datos sin formalizar/sin documentos esos indicadores dan
 * 0 correctamente, no es un bug.
 */
export default async function AlquileresDashboardPage() {
  const session = await auth();
  const esAdministrador = session?.user?.rolAlquileres === "ADMINISTRADOR";

  const [actuaciones, hitos, documentos, parametroRespaldo] = await Promise.all([
    getRepositorioActuaciones().listar(),
    getRepositorioActuacionHitos().listar(),
    getRepositorioDocumentos().listar(),
    esAdministrador ? obtenerParametro("ultimo_respaldo_en") : Promise.resolve(undefined),
  ]);

  const { resumen, colaDeTrabajo } = calcularDashboard({
    actuaciones,
    hitos,
    documentos,
    cfgHitosTipo: CFG_HITOS_TIPO_SEED,
    hoy: hoy(),
    alicuotaIva: numeroParametro(PARAMETROS_SEED, "alicuota_iva", 21),
  });

  const ultimoRespaldoEn = parametroRespaldo?.valor;
  const diasDesdeUltimoRespaldo = ultimoRespaldoEn ? diferenciaDias(ultimoRespaldoEn, hoy()) : undefined;

  return (
    <AppShell titulo="Dashboard — Alquileres">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Dashboard</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Qué está en riesgo hoy, qué vence en los próximos meses y qué hay que hacer (PRD v1, sección 8).
      </p>

      {esAdministrador && (
        <RespaldoAdmin
          ultimoRespaldoEn={ultimoRespaldoEn}
          diasDesdeUltimoRespaldo={diasDesdeUltimoRespaldo}
          alertaA8={alertaA8SinRespaldoReciente(ultimoRespaldoEn, hoy(), numeroParametro(PARAMETROS_SEED, "dias_alerta_respaldo", 7))}
        />
      )}

      <AlquileresDashboardClient resumen={resumen} colaDeTrabajo={colaDeTrabajo} />
    </AppShell>
  );
}
