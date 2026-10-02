import { TipoContrato } from "../types";

/** 4.3 — Biblioteca de sectores emisores de Acto Administrativo (configurable por Jurídicos). */
export interface SectorEmisor {
  id: string;
  nombre: string;
}

export const MOCK_SECTORES: SectorEmisor[] = [
  { id: "sec-1", nombre: "Directorio" },
  { id: "sec-2", nombre: "Gerencia General" },
  { id: "sec-3", nombre: "Gerencia de Distribución" },
  { id: "sec-4", nombre: "Gerencia de Administración" },
];

/** Asignación Tipo de contrato → sector emisor (sección 4.3/4.1bis). */
export const MOCK_ASIGNACION_SECTOR: Record<TipoContrato, string | null> = {
  Contrato: "sec-2",
  "Convenio SAE": "sec-3",
  "Acuerdo Conciliatorio de Daños": null, // pendiente de configurar
  Mutuo: "sec-4",
  Convenio: "sec-2",
  "Reconocimiento de Mayores Costos": null,
  "Acuerdo Transaccional": null,
  Adenda: null, // pendiente confirmar si hereda el tipo del documento original (PRD, tabla 4)
};

export const MOCK_TIPOS_CONTRATO: TipoContrato[] = [
  "Contrato",
  "Convenio SAE",
  "Acuerdo Conciliatorio de Daños",
  "Mutuo",
  "Convenio",
  "Reconocimiento de Mayores Costos",
  "Acuerdo Transaccional",
  "Adenda",
];

/**
 * Catálogo configurable de tipos de anotación de seguimiento (Redacción /
 * Negociación) — administrable en Administración > Tipos de anotación.
 */
export const MOCK_TIPOS_ANOTACION: string[] = [
  "Reunión",
  "Llamado telefónico",
  "Email",
  "Propuesta enviada",
  "Contrapropuesta recibida",
  "Observación interna",
  "Otro",
];

/**
 * Catálogo configurable de tipos de garantía exigida (etapa Renovación /
 * Cierre) — administrable en Administración > Tipos de garantía. Antes era
 * texto libre; se convirtió en catálogo a pedido del usuario.
 */
export const MOCK_TIPOS_GARANTIA: string[] = [
  "Seguro de caución",
  "Fianza bancaria",
  "Pagaré",
  "Depósito en garantía",
  "Aval",
  "Otro",
];

export interface Usuario {
  id: string;
  nombre: string;
  /** Rol en el CLM. Puede quedar vacío para un usuario que solo tiene rol en Alquileres (D12, PRD v2.1 sección 4). */
  rolId: string;
  area?: string;
  /** Email de la cuenta de Google con la que inicia sesión (ver src/lib/data/usuarios-provider.ts). */
  email: string;
  /**
   * NUEVO (D3/D12, PRD v2.1 sección 4): rol en el módulo de Alquileres,
   * independiente del rol del CLM — "ADMINISTRADOR" | "GESTOR" |
   * "SUPERVISOR" | "LECTOR" | vacío (sin acceso al módulo). Se tipa como
   * `string` acá (no se importa el tipo del módulo de Alquileres en este
   * archivo del CLM a propósito — D12 dice que la hoja Usuarios del CLM es
   * la hoja central de accesos, no que el CLM dependa del modelo de
   * Alquileres); la validación de valores concretos vive en
   * `src/lib/alquileres/permisos.ts`.
   */
  rolAlquileres?: string;
  /** NUEVO (D12): baja lógica compartida por todos los módulos. Vacío/undefined se interpreta como activo, para no romper lo existente. */
  activo?: boolean;
}

export const MOCK_USUARIOS: Usuario[] = [
  { id: "u1", nombre: "M. Cardozo", rolId: "abogado", area: "Asesoramiento General", email: "m.cardozo@epe.com.ar" },
  { id: "u2", nombre: "R. Fassi", rolId: "abogado", area: "Asesoramiento General", email: "r.fassi@epe.com.ar" },
  { id: "u3", nombre: "J. Pérez", rolId: "area_solicitante", area: "Distribución", email: "j.perez@epe.com.ar" },
  { id: "u4", nombre: "Lic. P. Alonso", rolId: "responsable_seguimiento", area: "Grandes Clientes", email: "p.alonso@epe.com.ar" },
  { id: "u5", nombre: "Ing. L. Gómez", rolId: "responsable_seguimiento", area: "Distribución", email: "l.gomez@epe.com.ar" },
  // Cuenta real para probar el login de punta a punta (ver INSTRUCTIVO_CONFIGURACION.md).
  // También ADMINISTRADOR de Alquileres: mismo email, para poder probar ambos módulos de punta a punta sin agregar una segunda cuenta real.
  { id: "u6", nombre: "Administrador CLM", rolId: "administrador_sistema", area: "Sistemas", email: "paganinicg@gmail.com", rolAlquileres: "ADMINISTRADOR" },
  // Usuario ficticio de prueba, solo con rol en Alquileres (sin rolId del CLM) — para probar D12/T16'/T19: debe poder entrar a /alquileres y recibir "acceso no autorizado" en páginas del CLM.
  { id: "u7", nombre: "Gestora de Alquileres (prueba)", rolId: "", area: "GAJ", email: "gestora.alquileres@ejemplo.test", rolAlquileres: "GESTOR" },
  // Usuario ficticio de prueba con rol LECTOR de Alquileres — hasta esta tarea (Fase 4) no existía ningún usuario mock con este rol,
  // así que el caso LECTOR (oculta "Personas" del menú, enmascara datos personales en reportes, no puede exportar RP-02/RP-09) nunca
  // se había verificado en vivo contra `npm run dev`, solo por pruebas unitarias con sesión simulada — ver docs/TRAZABILIDAD.md.
  { id: "u8", nombre: "Lector de Alquileres (prueba)", rolId: "", area: "GAJ", email: "lector.alquileres@ejemplo.test", rolAlquileres: "LECTOR" },
];
