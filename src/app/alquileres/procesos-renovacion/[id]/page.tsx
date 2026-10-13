import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AlquileresProcesoRenovacionDetalleClient } from "@/components/pages/alquileres-proceso-renovacion-detalle-client";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioActuacionHitos } from "@/lib/alquileres/datos/actuacion-hitos";
import { getRepositorioComunicaciones } from "@/lib/alquileres/datos/comunicaciones";
import { getRepositorioInmuebles } from "@/lib/alquileres/datos/inmuebles";
import { getRepositorioAreas } from "@/lib/alquileres/datos/areas";
import { getRepositorioContactosEpe } from "@/lib/alquileres/datos/contactos-epe";
import { getRepositorioExpedientes } from "@/lib/alquileres/datos/expedientes";
import { getRepositorioNovedades } from "@/lib/alquileres/datos/novedades";
import { listarUsuariosConAccesoAlquileres } from "@/lib/alquileres/usuarios-alquileres";
import { vencimientoEfectivo } from "@/lib/alquileres/reglas/r15-vencimiento-efectivo";
import { listarLogCambios } from "@/lib/alquileres/repositorio/log-cambios";
import { puedeAlquileres, MATRIZ_GESTION } from "@/lib/alquileres/permisos";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function AlquileresProcesoRenovacionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const rol = session?.user?.rolAlquileres;

  const [actuaciones, hitos, comunicaciones, inmuebles, areas, contactos, expedientes, novedades, logCambios, usuariosAlquileres] =
    await Promise.all([
      getRepositorioActuaciones().listar(),
      getRepositorioActuacionHitos().listar(),
      getRepositorioComunicaciones().listar(),
      getRepositorioInmuebles().listar(),
      getRepositorioAreas().listar(),
      getRepositorioContactosEpe().listar(),
      getRepositorioExpedientes().listar(),
      getRepositorioNovedades().listar(),
      listarLogCambios(),
      listarUsuariosConAccesoAlquileres(),
    ]);

  const gestoresDisponibles = usuariosAlquileres
    .filter((u) => (u.rolAlquileres === "GESTOR" || u.rolAlquileres === "ADMINISTRADOR") && u.activo !== false)
    .map((u) => ({ email: u.email, nombre: u.nombre }));

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
        expedientesDelInmueble={expedientes.filter((e) => e.inmuebleId === actuacion.inmuebleId)}
        novedadesIniciales={novedades.filter((n) => n.actuacionId === actuacion.actuacionId)}
        puedeCargarNovedad={puedeAlquileres(rol, "crear", MATRIZ_GESTION)}
        puedeVincularExpediente={puedeAlquileres(rol, "editar", MATRIZ_GESTION)}
        gestoresDisponibles={gestoresDisponibles}
        puedeAsignarResponsable={rol === "ADMINISTRADOR"}
      />
    </AppShell>
  );
}
