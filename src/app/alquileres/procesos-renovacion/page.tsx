import { AppShell } from "@/components/layout/app-shell";
import { AlquileresProcesosRenovacionClient } from "@/components/pages/alquileres-procesos-renovacion-client";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioInmuebles } from "@/lib/alquileres/datos/inmuebles";
import { getRepositorioExpedientes } from "@/lib/alquileres/datos/expedientes";
import { estaEnProcesoRenovacion } from "@/lib/alquileres/reglas/alertas";
import { vencimientoEfectivo } from "@/lib/alquileres/reglas/r15-vencimiento-efectivo";
import { nivelSemaforo, diferenciaDias, hoy } from "@/lib/alquileres/fechas";

export const dynamic = "force-dynamic";

/** Vista agregada (a pedido de Carlos, 2026-10-12): procesos de renovación en curso, desde que corresponde iniciar el aviso hasta la renovación efectiva. */
export default async function AlquileresProcesosRenovacionPage() {
  const [actuaciones, inmuebles, expedientes] = await Promise.all([
    getRepositorioActuaciones().listar(),
    getRepositorioInmuebles().listar(),
    getRepositorioExpedientes().listar(),
  ]);

  const h = hoy();
  const procesos = actuaciones
    .filter((a) => estaEnProcesoRenovacion(a, actuaciones, h))
    .map((a) => {
      const venc = vencimientoEfectivo(a, actuaciones);
      const inmueble = inmuebles.find((i) => i.inmuebleId === a.inmuebleId);
      const expediente = a.expedienteId ? expedientes.find((e) => e.expedienteId === a.expedienteId) : undefined;
      return {
        actuacion: a,
        inmuebleDomicilio: inmueble?.domicilio ?? a.inmuebleId,
        nroExpediente: expediente?.nroExpediente,
        vencimientoEfectivo: venc,
        nivel: venc ? nivelSemaforo(diferenciaDias(h, venc)) : undefined,
      };
    })
    .sort((a, b) => (a.vencimientoEfectivo ?? "9999").localeCompare(b.vencimientoEfectivo ?? "9999"));

  return (
    <AppShell titulo="Procesos de renovación">
      <div className="mb-1 font-[var(--font-display)] text-[var(--text-2xl)] font-bold">Procesos de renovación en curso</div>
      <p className="mb-5 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        Contratos desde que corresponde iniciar el aviso de renovación (4 meses o menos para el vencimiento) hasta la
        renovación efectiva. Los que todavía no se acercan al vencimiento no aparecen acá.
      </p>

      <AlquileresProcesosRenovacionClient procesos={procesos} />
    </AppShell>
  );
}
