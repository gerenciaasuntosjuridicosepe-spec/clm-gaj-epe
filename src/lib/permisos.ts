import { EtapaId, Rol, RolId } from "./types";

/**
 * Roles del sistema (sección 3 del PRD + correcciones acordadas con el usuario:
 * Gerencia de Asuntos Jurídicos y Jefatura de Área de Asesoramiento ven todos
 * los contratos en todas las etapas, y todos los dashboards/KPIs sin restricción).
 */
export const ROLES: Record<RolId, Rol> = {
  gerencia_asuntos_juridicos: {
    id: "gerencia_asuntos_juridicos",
    nombre: "Gerencia de Asuntos Jurídicos",
    descripcion: "Máxima autoridad de la Gerencia; supervisión general.",
    visibilidadTotal: true,
    dashboardsTotal: true,
  },
  jefatura_asesoramiento: {
    id: "jefatura_asesoramiento",
    nombre: "Jefatura de Área de Asesoramiento",
    descripcion: "Administra la asignación de abogados a expedientes.",
    visibilidadTotal: true,
    dashboardsTotal: true,
  },
  abogado: {
    id: "abogado",
    nombre: "Abogado/a (Asesoramiento General)",
    descripcion:
      "Redacta, negocia y elabora el dictamen legal de los expedientes asignados.",
    visibilidadTotal: true, // rol jurídico: ve todos los contratos (PRD, tabla de roles)
    dashboardsTotal: false,
  },
  area_solicitante: {
    id: "area_solicitante",
    nombre: "Área solicitante",
    descripcion: "Inicia solicitudes de contrato o adenda.",
    visibilidadTotal: false,
    dashboardsTotal: false,
  },
  gerencia_administracion: {
    id: "gerencia_administracion",
    nombre: "Gerencia de Administración",
    descripcion: "Realiza el análisis financiero/económico del contrato.",
    visibilidadTotal: false,
    dashboardsTotal: false,
  },
  aprobador_nivel: {
    id: "aprobador_nivel",
    nombre: "Aprobador de nivel jerárquico",
    descripcion: "Aprueba internamente según el flujo único y fijo.",
    visibilidadTotal: false,
    dashboardsTotal: false,
  },
  autoridad_firmante: {
    id: "autoridad_firmante",
    nombre: "Autoridad firmante",
    descripcion: "Firma el contrato en representación de EPE.",
    visibilidadTotal: false,
    dashboardsTotal: false,
  },
  responsable_seguimiento: {
    id: "responsable_seguimiento",
    nombre: "Responsable de seguimiento",
    descripcion: "Gestiona ejecución y cumplimiento post-firma.",
    visibilidadTotal: false,
    dashboardsTotal: false,
  },
  administrador_sistema: {
    id: "administrador_sistema",
    nombre: "Administrador del sistema",
    descripcion: "Gestiona usuarios, roles y catálogos de configuración.",
    visibilidadTotal: true,
    dashboardsTotal: true,
  },
};

export const ROLES_LISTA = Object.values(ROLES);

/**
 * Nivel de acceso de un rol en una etapa puntual: "R" responsable de la etapa,
 * "V" solo visibilidad, "-" sin acceso. Construido cruzando la sección 5/6
 * (flujo) con la sección 3 (roles) del PRD — no es una tabla literal del
 * documento, es una interpretación a validar con Jurídicos.
 */
type Acceso = "R" | "V" | "-";

const MATRIZ: Record<RolId, Partial<Record<EtapaId, Acceso>>> = {
  gerencia_asuntos_juridicos: {}, // visibilidadTotal cubre todo
  jefatura_asesoramiento: {
    aprobacion_solicitud: "R",
    cierre: "R",
  },
  abogado: {
    redaccion: "R",
    negociacion: "R",
    encuadre_legal: "R",
    cierre: "R",
  },
  area_solicitante: {
    solicitud: "R",
    aprobacion_solicitud: "V",
    redaccion: "R",
    negociacion: "V",
    repositorio: "V",
    ejecucion: "V",
    cumplimiento: "V",
    cierre: "V",
  },
  gerencia_administracion: {
    analisis_financiero: "R",
  },
  aprobador_nivel: {
    acto_administrativo: "R", // aproximación: el responsable real varía por sector (sección 4.3)
  },
  autoridad_firmante: {
    firma: "R",
    repositorio: "V",
  },
  responsable_seguimiento: {
    ejecucion: "R",
    cumplimiento: "R",
    cierre: "R",
  },
  administrador_sistema: {}, // acceso administrativo total, no operativo por etapa
};

/** Devuelve el nivel de acceso de un rol para una etapa dada. */
export function accesoEtapa(rolId: RolId, etapa: EtapaId): Acceso {
  const rol = ROLES[rolId];
  // La matriz manda primero: un rol con visibilidad total puede además ser
  // responsable ("R") en etapas puntuales (ej. abogado en Redacción). Antes
  // esta función devolvía "V" para cualquier rol con visibilidadTotal sin
  // mirar la matriz, lo que nunca dejaba distinguir quién es responsable.
  const explicito = MATRIZ[rolId]?.[etapa];
  if (explicito) return explicito;
  if (rol.visibilidadTotal) return "V"; // sin entrada explícita: como mínimo ve todo
  return "-";
}

/** true si el rol puede ver un contrato dado su etapa actual y (opcional) responsable. */
export function puedeVerContrato(rolId: RolId, etapaActual: EtapaId): boolean {
  const rol = ROLES[rolId];
  if (rol.visibilidadTotal) return true;
  return accesoEtapa(rolId, etapaActual) !== "-";
}

/** true si el rol tiene acceso a dashboards/KPIs generales sin restricción. */
export function puedeVerDashboardsCompletos(rolId: RolId): boolean {
  return ROLES[rolId].dashboardsTotal;
}

/**
 * Roles habilitados para acciones de workflow puntuales (no de visibilidad).
 * Gateo simple por lista, ya que la v1 no tiene un motor de permisos por
 * acción — alcanza con esto para las dos acciones que lo requieren hoy.
 */
export const ROLES_APRUEBAN_SOLICITUD: RolId[] = [
  "jefatura_asesoramiento",
  "gerencia_asuntos_juridicos",
  "administrador_sistema",
];

export const ROLES_AVANZAN_A_REPOSITORIO: RolId[] = [
  "autoridad_firmante",
  "jefatura_asesoramiento",
  "gerencia_asuntos_juridicos",
  "administrador_sistema",
];

export function puedeAccionar(rolId: RolId, permitidos: RolId[]): boolean {
  return permitidos.includes(rolId);
}
