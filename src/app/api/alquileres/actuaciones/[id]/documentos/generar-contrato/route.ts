import { NextRequest, NextResponse } from "next/server";
import { esRespuestaError, requerirAccionAlquileres } from "@/lib/alquileres/auth-guard";
import { MATRIZ_DOCUMENTOS } from "@/lib/alquileres/permisos";
import { getRepositorioActuaciones } from "@/lib/alquileres/datos/actuaciones";
import { getRepositorioInmuebles } from "@/lib/alquileres/datos/inmuebles";
import { getRepositorioAreas } from "@/lib/alquileres/datos/areas";
import { getRepositorioActuacionPartes } from "@/lib/alquileres/datos/actuacion-partes";
import { getRepositorioPersonas } from "@/lib/alquileres/datos/personas";
import { getRepositorioContactosEpe } from "@/lib/alquileres/datos/contactos-epe";
import { generarContratoDocx } from "@/lib/alquileres/servicios/generar-contrato-docx";

/**
 * RF-25/26/27 (parcial, decisión 2026-10-03 — ver docs/DECISIONES.md): borrador
 * de contrato en .docx, generado de nuevo en cada pedido a partir de los
 * datos actuales. A propósito NO se persiste como fila de DOCUMENTOS: no hay
 * nada que guardar (ningún archivo queda en Drive ni en ningún otro lado),
 * así que no hay "origen: GENERADO" que registrar todavía — si en el futuro
 * se decide guardar un registro de que se generó un borrador, va acá, sin
 * tocar `generarContratoDocx`. Acción "leer" en `MATRIZ_DOCUMENTOS": ver/
 * descargar un borrador no persiste ni modifica nada.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await requerirAccionAlquileres("leer", MATRIZ_DOCUMENTOS);
  if (esRespuestaError(sesion)) return sesion;

  const { id } = await params;
  const actuacion = await getRepositorioActuaciones().obtener(id);
  if (!actuacion) {
    return NextResponse.json({ error: "Actuación no encontrada." }, { status: 404 });
  }

  const [inmueble, area, partesTodas, personasTodas] = await Promise.all([
    getRepositorioInmuebles().obtener(actuacion.inmuebleId),
    getRepositorioAreas().obtener(actuacion.sectorInteresadoAreaId),
    getRepositorioActuacionPartes().listar(),
    getRepositorioPersonas().listar(),
  ]);

  if (!inmueble || !area) {
    return NextResponse.json({ error: "Faltan datos del inmueble o del área para generar el borrador." }, { status: 400 });
  }

  const partes = partesTodas.filter((p) => p.actuacionId === id);
  const firmanteEpe = actuacion.firmanteEpeContactoId
    ? await getRepositorioContactosEpe().obtener(actuacion.firmanteEpeContactoId)
    : undefined;

  const buffer = await generarContratoDocx(
    { actuacion, area, inmueble, partes, personas: personasTodas, firmanteEpe },
    { actuacionId: actuacion.actuacionId, tipoActuacion: actuacion.tipoActuacion }
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="borrador-${actuacion.actuacionId}.docx"`,
    },
  });
}
