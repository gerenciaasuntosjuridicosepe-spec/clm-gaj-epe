import { auth } from "@/auth";
import { getContratosProvider } from "@/lib/data/provider";
import { construirEventosCalendario } from "@/lib/calendario";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioActuacionHitos } from "@/lib/alquileres/datos/actuacion-hitos";
import { construirEventosCalendarioAlquileres } from "@/lib/alquileres/reglas/calendario";
import { hoy } from "@/lib/alquileres/fechas";
import { CalendarioClient } from "@/components/pages/calendario-client";

// Los datos vienen de Sheets/mock y cambian en cualquier momento; no tiene
// sentido cachear esta página en build time.
export const dynamic = "force-dynamic";

/** Calendario unificado (CLM + Alquileres) — cada usuario solo recibe los eventos del módulo al que tiene acceso. */
export default async function CalendarioPage() {
  const session = await auth();
  const tieneClm = Boolean(session?.user?.rolId);
  const tieneAlquileres = Boolean(session?.user?.rolAlquileres);

  const [contratos, actuaciones, hitos] = await Promise.all([
    tieneClm ? getContratosProvider().listar() : Promise.resolve([]),
    tieneAlquileres ? getRepositorioActuaciones().listar() : Promise.resolve([]),
    tieneAlquileres ? getRepositorioActuacionHitos().listar() : Promise.resolve([]),
  ]);

  const eventosClm = tieneClm ? construirEventosCalendario(contratos) : [];
  const eventosAlquileres = tieneAlquileres ? construirEventosCalendarioAlquileres(actuaciones, hitos, hoy()) : [];

  return <CalendarioClient eventosClm={eventosClm} eventosAlquileres={eventosAlquileres} />;
}
