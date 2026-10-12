import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AlquileresProcesoRenovacionDetalleClient } from "@/components/pages/alquileres-proceso-renovacion-detalle-client";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioActuacionHitos } from "@/lib/alquileres/datos/actuacion-hitos";
import { getRepositorioComunicaciones } from "@/lib/alquileres/datos/comunicaciones";
import { getRepositorioInmuebles } from "@/lib/alquileres/datos/inmuebles";
import { getRepositorioAreas } from "@/lib/alquileres/datos/areas";
import { getRepositorioContactosEpe } from "@/lib/alquileres/datos/contactos-epe";
import { vencimientoEfectivo } from "@/lib/alquileres/reglas/r15-vencimiento-efectivo";
import { listarLogCambios } from "@/lib/alquileres/repositorio/log-cambios";

export const dynamic = "force-dynamic";

export default async function AlquileresProcesoRenovacionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [actuaciones, hitos, comunicaciones, inmuebles, areas, contactos, logCambios] = await Promise.all([
    getRepositorioActuaciones().listar(),
    getRepositorioActuacionHitos().listar(),
    getRepositorioComunicaciones().listar(),
    getRepositorioInmuebles().listar(),
    getRepositorioAreas().listar(),
    getRepositorioContactosEpe().listar(),
    listarLogCambios(),
  ]);

  const actuacion = actuaciones.find((a) => a.actuacionId === id);
  if (!actuacion || actuacion.tipoActuacion !== "CONTRATO") notFound();

  const inmueble = inmuebles.find((i) => i.inmuebleId === actuacion.inmuebleId);
  const area = areas.find((a) => a.areaId === actuacion.sectorInteresadoAreaId);
  const firmante = contactos.find((c) => c.contactoId === actuacion.firmanteEpeContactoId);
  const venc = vencimientoEfectivo(actuacion, actuaciones);
  const historialEstados = logCambios
    .filter((l) => l.hoja === "ACTUACIONES" && l.registroId === actuacion.actuacionId && l.campo === "estadoActuacion")
    .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));

  return (
    <AppShell titulo={`Proceso de renovación — ${actuacion.actuacionId}`}>
      <AlquileresProcesoRenovacionDetalleClient
        actuacion={actuacion}
        inmuebleDomicilio={inmueble?.domicilio ?? actuacion.inmuebleId}
        areaNombre={area?.nombre}
        firmanteNombre={firmante?.nombre}
        vencimientoEfectivo={venc}
        hitos={hitos.filter((h) => h.actuacionId === actuacion.actuacionId)}
        comunicaciones={comunicaciones.filter((c) => c.actuacionId === actuacion.actuacionId)}
        historialEstados={historialEstados}
      />
    </AppShell>
  );
}
