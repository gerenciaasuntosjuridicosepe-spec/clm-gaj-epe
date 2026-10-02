/**
 * RP-09 — Calidad de datos (V5): "Actuaciones sin firmante, sin partida,
 * sin mail del locador, sin condición de IVA, formalizadas sin escaneado,
 * personas duplicadas por documento." Agregación pura, mismo espíritu que
 * `dashboard.ts`/`calendario.ts` — reutiliza reglas ya probadas (A6,
 * `buscarGruposDuplicados`), no inventa ningún criterio nuevo.
 */
import type { Actuacion, ActuacionParte, DocumentoAlquiler, Inmueble, Persona } from "../tipos";
import { alertaA6FormalizadaSinEscaneado, esTerminal } from "./alertas";
import { buscarGruposDuplicados } from "./r9-persona-duplicada";

export type TipoHallazgoCalidad =
  | "SIN_FIRMANTE"
  | "SIN_PARTIDA"
  | "SIN_MAIL_LOCADOR"
  | "SIN_CONDICION_IVA"
  | "FORMALIZADA_SIN_ESCANEADO"
  | "PERSONA_DUPLICADA";

export interface HallazgoCalidad {
  tipo: TipoHallazgoCalidad;
  actuacionId?: string;
  inmuebleId?: string;
  personaId?: string;
  descripcion: string;
}

export interface ParametrosCalidadDatos {
  actuaciones: Actuacion[];
  inmuebles: Inmueble[];
  partes: ActuacionParte[];
  personas: Persona[];
  documentos: DocumentoAlquiler[];
}

/** Actuaciones CONTRATO/ADENDA no terminales (tiene sentido pedirles firmante/IVA solo mientras están en curso). */
function actuacionesEnCurso(actuaciones: Actuacion[]): Actuacion[] {
  return actuaciones.filter((a) => a.activo && (a.tipoActuacion === "CONTRATO" || a.tipoActuacion === "ADENDA") && !esTerminal(a.estadoActuacion));
}

export function calcularCalidadDatos(params: ParametrosCalidadDatos): HallazgoCalidad[] {
  const { actuaciones, inmuebles, partes, personas, documentos } = params;
  const hallazgos: HallazgoCalidad[] = [];

  for (const actuacion of actuacionesEnCurso(actuaciones)) {
    if (!actuacion.firmanteEpeContactoId) {
      hallazgos.push({
        tipo: "SIN_FIRMANTE",
        actuacionId: actuacion.actuacionId,
        inmuebleId: actuacion.inmuebleId,
        descripcion: `${actuacion.actuacionId}: sin firmante de EPE cargado.`,
      });
    }
    if (!actuacion.condicionIvaCanon) {
      hallazgos.push({
        tipo: "SIN_CONDICION_IVA",
        actuacionId: actuacion.actuacionId,
        inmuebleId: actuacion.inmuebleId,
        descripcion: `${actuacion.actuacionId}: sin condición de IVA del canon.`,
      });
    }

    const titularesDeEstaActuacion = partes.filter((p) => p.actuacionId === actuacion.actuacionId && p.rolParte === "TITULAR");
    for (const parte of titularesDeEstaActuacion) {
      const persona = personas.find((pe) => pe.personaId === parte.personaId);
      if (persona && !persona.mail) {
        hallazgos.push({
          tipo: "SIN_MAIL_LOCADOR",
          actuacionId: actuacion.actuacionId,
          inmuebleId: actuacion.inmuebleId,
          personaId: persona.personaId,
          descripcion: `${actuacion.actuacionId}: el locador ${persona.apellidoNombreRazonSocial} no tiene mail cargado.`,
        });
      }
    }

    if (alertaA6FormalizadaSinEscaneado(actuacion, documentos.filter((d) => d.actuacionId === actuacion.actuacionId))) {
      hallazgos.push({
        tipo: "FORMALIZADA_SIN_ESCANEADO",
        actuacionId: actuacion.actuacionId,
        inmuebleId: actuacion.inmuebleId,
        descripcion: `${actuacion.actuacionId}: FORMALIZADA sin el escaneado firmado adjunto.`,
      });
    }
  }

  for (const inmueble of inmuebles.filter((i) => i.activo)) {
    if (!inmueble.partidaInmobiliaria) {
      hallazgos.push({
        tipo: "SIN_PARTIDA",
        inmuebleId: inmueble.inmuebleId,
        descripcion: `${inmueble.inmuebleId} (${inmueble.domicilio}): sin partida inmobiliaria cargada.`,
      });
    }
  }

  for (const grupo of buscarGruposDuplicados(personas)) {
    hallazgos.push({
      tipo: "PERSONA_DUPLICADA",
      descripcion: `Documento ${grupo.documento} repetido en ${grupo.personas.length} personas: ${grupo.personas.map((p) => p.apellidoNombreRazonSocial).join(", ")}.`,
    });
  }

  return hallazgos;
}
