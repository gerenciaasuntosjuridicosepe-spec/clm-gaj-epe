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
  rolId: string;
  area?: string;
  /** Email de la cuenta de Google con la que inicia sesión (ver src/lib/data/usuarios-provider.ts). */
  email: string;
}

export const MOCK_USUARIOS: Usuario[] = [
  { id: "u1", nombre: "M. Cardozo", rolId: "abogado", area: "Asesoramiento General", email: "m.cardozo@epe.com.ar" },
  { id: "u2", nombre: "R. Fassi", rolId: "abogado", area: "Asesoramiento General", email: "r.fassi@epe.com.ar" },
  { id: "u3", nombre: "J. Pérez", rolId: "area_solicitante", area: "Distribución", email: "j.perez@epe.com.ar" },
  { id: "u4", nombre: "Lic. P. Alonso", rolId: "responsable_seguimiento", area: "Grandes Clientes", email: "p.alonso@epe.com.ar" },
  { id: "u5", nombre: "Ing. L. Gómez", rolId: "responsable_seguimiento", area: "Distribución", email: "l.gomez@epe.com.ar" },
  // Cuenta real para probar el login de punta a punta (ver INSTRUCTIVO_CONFIGURACION.md).
  { id: "u6", nombre: "Administrador CLM", rolId: "administrador_sistema", area: "Sistemas", email: "paganinicg@gmail.com" },
];
