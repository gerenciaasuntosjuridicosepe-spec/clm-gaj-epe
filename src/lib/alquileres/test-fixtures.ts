/**
 * Fábricas de datos de prueba FICTICIOS para las pruebas de reglas de
 * negocio del módulo de Alquileres — nunca datos reales de personas ni de
 * expedientes (regla dura del encargo). Centraliza los campos de auditoría
 * repetitivos (CamposAuditoria) para que cada prueba solo tenga que indicar
 * lo que le importa a esa regla puntual.
 */
import type {
  Actuacion,
  ActuacionHito,
  ActuacionParte,
  CfgHitoTipo,
  Expediente,
  Hito,
  Inmueble,
  Persona,
} from "./tipos";

const AUDITORIA_BASE = {
  activo: true,
  creadoEn: "2026-01-01T12:00:00.000-03:00",
  creadoPor: "prueba@ejemplo.test",
  modificadoEn: "2026-01-01T12:00:00.000-03:00",
  modificadoPor: "prueba@ejemplo.test",
  version: 1,
};

export function crearActuacion(overrides: Partial<Actuacion> & Pick<Actuacion, "actuacionId">): Actuacion {
  return {
    ...AUDITORIA_BASE,
    codigoLegado: undefined,
    tipoActuacion: "CONTRATO",
    inmuebleId: "INM-0001",
    expedienteId: undefined,
    actuacionAnteriorId: undefined,
    estadoActuacion: "PENDIENTE_AVISO",
    motivoEstado: undefined,
    responsableEmail: undefined,
    sectorInteresadoAreaId: "AR-01",
    destinoCategoria: undefined,
    destinoDescripcion: undefined,
    fechaInicio: undefined,
    plazoMeses: undefined,
    fechaFin: undefined,
    canonInicial: undefined,
    montoTotalReconocido: undefined,
    condicionIvaCanon: undefined,
    reglaActualizacion: undefined,
    firmanteEpeContactoId: undefined,
    observaciones: undefined,
    ...overrides,
  };
}

export function crearInmueble(overrides: Partial<Inmueble> & Pick<Inmueble, "inmuebleId">): Inmueble {
  return {
    ...AUDITORIA_BASE,
    domicilio: "Calle Ficticia 123",
    localidadId: "LOC-0001",
    partidaInmobiliaria: undefined,
    observaciones: undefined,
    ...overrides,
  };
}

export function crearExpediente(overrides: Partial<Expediente> & Pick<Expediente, "expedienteId" | "inmuebleId">): Expediente {
  return {
    ...AUDITORIA_BASE,
    nroExpediente: "1-2026-000001",
    fechaApertura: undefined,
    observaciones: undefined,
    ...overrides,
  };
}

export function crearPersona(overrides: Partial<Persona> & Pick<Persona, "personaId">): Persona {
  return {
    ...AUDITORIA_BASE,
    tipoPersona: "FISICA",
    apellidoNombreRazonSocial: "Persona de Prueba",
    dni: undefined,
    cuitCuil: undefined,
    condicionFiscal: undefined,
    domicilioLegal: undefined,
    mail: undefined,
    telefono: undefined,
    ...overrides,
  };
}

export function crearParte(
  overrides: Partial<ActuacionParte> & Pick<ActuacionParte, "parteId" | "actuacionId" | "personaId" | "rolParte" | "orden">
): ActuacionParte {
  return {
    ...AUDITORIA_BASE,
    representaAPersonaId: undefined,
    caracter: undefined,
    domicilioVigente: undefined,
    mailVigente: undefined,
    ...overrides,
  };
}

export function crearHito(overrides: Partial<Hito> & Pick<Hito, "hitoId" | "codigo" | "nombre">): Hito {
  return {
    ...AUDITORIA_BASE,
    etapa: "PREVIA",
    orden: 1,
    ...overrides,
  };
}

export function crearCfgHitoTipo(
  overrides: Partial<CfgHitoTipo> & Pick<CfgHitoTipo, "cfgId" | "hitoId">
): CfgHitoTipo {
  return {
    ...AUDITORIA_BASE,
    tipoActuacion: "CONTRATO",
    plazoValor: undefined,
    plazoUnidad: undefined,
    computoDias: undefined,
    referencia: undefined,
    hitoReferenciaId: undefined,
    generaAlerta: false,
    orden: 1,
    ...overrides,
  };
}

export function crearActuacionHito(
  overrides: Partial<ActuacionHito> & Pick<ActuacionHito, "actuacionHitoId" | "actuacionId" | "hitoId">
): ActuacionHito {
  return {
    ...AUDITORIA_BASE,
    estadoHito: "PENDIENTE",
    fechaPrevista: undefined,
    fechaCumplimiento: undefined,
    reprogramada: false,
    referencia: undefined,
    observaciones: undefined,
    ...overrides,
  };
}
