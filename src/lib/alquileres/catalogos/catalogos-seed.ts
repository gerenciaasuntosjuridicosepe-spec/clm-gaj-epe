/**
 * Semilla de CATALOGOS (valores de listas controladas) — una sola fuente de
 * verdad, editable desde Administración (R20), nunca hardcodeada en la
 * lógica de negocio. Fuente: xlsx reconstruido, hoja CATALOGOS_VALORES
 * (columna "Origen de la tabla" → PRD, salvo lo marcado INFERIDO abajo).
 *
 * `esSistema: true` = no se puede desactivar ni cambiar de código (M11, R20).
 * Los catálogos marcados "a completar con el original" en el xlsx NO se
 * inventan: quedan con un único valor placeholder desactivable/editable
 * (`esSistema: false`) para no romper los formularios, y están registrados
 * en docs/PENDIENTES-HUMANOS.md punto 1. Un ADMINISTRADOR puede agregar los
 * valores reales desde la UI de catálogos sin tocar código (R20/RF-32).
 */
import type { CatalogoValor } from "../tipos";

export type SemillaCatalogoValor = Pick<CatalogoValor, "catalogo" | "codigo" | "descripcion" | "orden" | "esSistema">;

export const CATALOGOS_SEED: SemillaCatalogoValor[] = [
  // estado_actuacion (R14, M11: agrega NO_RENOVADO)
  { catalogo: "estado_actuacion", codigo: "PENDIENTE_AVISO", descripcion: "Pendiente de aviso", orden: 1, esSistema: true },
  { catalogo: "estado_actuacion", codigo: "AVISO_ENVIADO", descripcion: "Aviso enviado", orden: 2, esSistema: true },
  { catalogo: "estado_actuacion", codigo: "EN_TRAMITE", descripcion: "En trámite", orden: 3, esSistema: true },
  { catalogo: "estado_actuacion", codigo: "FORMALIZADA", descripcion: "Formalizada", orden: 4, esSistema: true },
  { catalogo: "estado_actuacion", codigo: "CERRADA", descripcion: "Cerrada", orden: 5, esSistema: true },
  { catalogo: "estado_actuacion", codigo: "DESISTIDA", descripcion: "Desistida", orden: 6, esSistema: true },
  { catalogo: "estado_actuacion", codigo: "NO_RENOVADO", descripcion: "No renovado", orden: 7, esSistema: true },
  { catalogo: "estado_actuacion", codigo: "ANULADA", descripcion: "Anulada", orden: 8, esSistema: true },

  // tipo_actuacion
  { catalogo: "tipo_actuacion", codigo: "CONTRATO", descripcion: "Contrato (inicial o renovación)", orden: 1, esSistema: true },
  { catalogo: "tipo_actuacion", codigo: "ADENDA", descripcion: "Adenda", orden: 2, esSistema: true },
  { catalogo: "tipo_actuacion", codigo: "LEGITIMO_ABONO", descripcion: "Legítimo abono", orden: 3, esSistema: true },

  // condicion_iva_canon
  { catalogo: "condicion_iva_canon", codigo: "SIN_IVA", descripcion: "Sin IVA", orden: 1, esSistema: true },
  { catalogo: "condicion_iva_canon", codigo: "MAS_IVA", descripcion: "Más IVA", orden: 2, esSistema: true },
  { catalogo: "condicion_iva_canon", codigo: "IVA_INCLUIDO", descripcion: "IVA incluido", orden: 3, esSistema: true },

  // rol_usuario (rol por módulo de Alquileres, D3)
  { catalogo: "rol_usuario", codigo: "ADMINISTRADOR", descripcion: "Administrador", orden: 1, esSistema: true },
  { catalogo: "rol_usuario", codigo: "GESTOR", descripcion: "Gestor", orden: 2, esSistema: true },
  { catalogo: "rol_usuario", codigo: "SUPERVISOR", descripcion: "Supervisor", orden: 3, esSistema: true },
  { catalogo: "rol_usuario", codigo: "LECTOR", descripcion: "Lector", orden: 4, esSistema: true },

  // condicion_fiscal (M7, opcional, no de sistema)
  { catalogo: "condicion_fiscal", codigo: "RESPONSABLE_INSCRIPTO", descripcion: "Responsable inscripto", orden: 1, esSistema: false },
  { catalogo: "condicion_fiscal", codigo: "MONOTRIBUTO", descripcion: "Monotributo", orden: 2, esSistema: false },
  { catalogo: "condicion_fiscal", codigo: "EXENTO", descripcion: "Exento", orden: 3, esSistema: false },
  { catalogo: "condicion_fiscal", codigo: "OTRA", descripcion: "Otra", orden: 4, esSistema: false },

  // ambito_feriado
  { catalogo: "ambito_feriado", codigo: "NACIONAL", descripcion: "Nacional", orden: 1, esSistema: true },
  { catalogo: "ambito_feriado", codigo: "PROVINCIAL", descripcion: "Provincial", orden: 2, esSistema: true },
  { catalogo: "ambito_feriado", codigo: "OTRO", descripcion: "Otro", orden: 3, esSistema: true },

  // tipo_persona (INFERIDO: FISICA/JURIDICA; SUCESION consta en el PRD)
  { catalogo: "tipo_persona", codigo: "FISICA", descripcion: "Persona humana", orden: 1, esSistema: true },
  { catalogo: "tipo_persona", codigo: "JURIDICA", descripcion: "Persona jurídica", orden: 2, esSistema: true },
  { catalogo: "tipo_persona", codigo: "SUCESION", descripcion: "Sucesión", orden: 3, esSistema: true },

  // rol_parte
  { catalogo: "rol_parte", codigo: "TITULAR", descripcion: "Titular", orden: 1, esSistema: true },
  { catalogo: "rol_parte", codigo: "FIRMANTE", descripcion: "Firmante", orden: 2, esSistema: true },

  // estado_hito
  { catalogo: "estado_hito", codigo: "PENDIENTE", descripcion: "Pendiente", orden: 1, esSistema: true },
  { catalogo: "estado_hito", codigo: "CUMPLIDO", descripcion: "Cumplido", orden: 2, esSistema: true },
  { catalogo: "estado_hito", codigo: "NO_APLICA", descripcion: "No aplica", orden: 3, esSistema: true },

  // tipo_comunicacion
  { catalogo: "tipo_comunicacion", codigo: "AVISO", descripcion: "Aviso de inicio", orden: 1, esSistema: true },
  { catalogo: "tipo_comunicacion", codigo: "REITERACION", descripcion: "Reiteración", orden: 2, esSistema: true },
  { catalogo: "tipo_comunicacion", codigo: "CARTA_DOCUMENTO", descripcion: "Carta documento", orden: 3, esSistema: true },

  // estado_comunicacion (M16: sin ERROR)
  { catalogo: "estado_comunicacion", codigo: "BORRADOR", descripcion: "Borrador", orden: 1, esSistema: true },
  { catalogo: "estado_comunicacion", codigo: "ENVIADO", descripcion: "Enviado (declarado)", orden: 2, esSistema: true },

  // tipo_documento (lista abierta, "a confirmar" según DICCIONARIO — los 3 que sí constan, no de sistema)
  { catalogo: "tipo_documento", codigo: "CONTRATO_GENERADO", descripcion: "Contrato generado", orden: 1, esSistema: false },
  { catalogo: "tipo_documento", codigo: "ESCANEADO", descripcion: "Escaneado", orden: 2, esSistema: false },
  { catalogo: "tipo_documento", codigo: "PROPUESTA_LOCADOR", descripcion: "Propuesta del locador", orden: 3, esSistema: false },

  // tipo_plantilla
  { catalogo: "tipo_plantilla", codigo: "CONTRATO", descripcion: "Contrato", orden: 1, esSistema: true },
  { catalogo: "tipo_plantilla", codigo: "ADENDA", descripcion: "Adenda", orden: 2, esSistema: true },
  { catalogo: "tipo_plantilla", codigo: "MAIL_AVISO", descripcion: "Mail de aviso", orden: 3, esSistema: true },
  { catalogo: "tipo_plantilla", codigo: "MAIL_REITERACION", descripcion: "Mail de reiteración", orden: 4, esSistema: true },

  // cargo (CONTACTOS_EPE) — los 4 que constan en el PRD (RF-22), lista abierta
  { catalogo: "cargo", codigo: "JEFE_SUCURSAL", descripcion: "Jefe de sucursal", orden: 1, esSistema: false },
  { catalogo: "cargo", codigo: "DESIGNADO", descripcion: "Designado", orden: 2, esSistema: false },
  { catalogo: "cargo", codigo: "GERENTE", descripcion: "Gerente", orden: 3, esSistema: false },
  { catalogo: "cargo", codigo: "RESPONSABLE_DESIGNADO", descripcion: "Responsable designado", orden: 4, esSistema: false },

  // tipo_area — SUCURSAL y GERENCIA constan en el PRD (R18); resto "a completar con el original"
  { catalogo: "tipo_area", codigo: "SUCURSAL", descripcion: "Sucursal", orden: 1, esSistema: false },
  { catalogo: "tipo_area", codigo: "GERENCIA", descripcion: "Gerencia", orden: 2, esSistema: false },

  // destino_categoria — NINGÚN valor consta en los PRD ni en el xlsx reconstruido
  // (DICCIONARIO: "Valores del catálogo: a completar con el original"). Se deja
  // sin seed: el ADMINISTRADOR carga los valores reales desde Administración
  // (R20/RF-32) en cuanto Carlos aporte el libro original — ver
  // docs/PENDIENTES-HUMANOS.md punto 1. Un array vacío acá (no un valor
  // inventado) es la forma correcta de "no inventar, dejar configurable".
] as const satisfies SemillaCatalogoValor[];

/** Nombres de catálogo conocidos — para validar que un `catalogo` usado en el código existe en la semilla. */
export const NOMBRES_CATALOGO = Array.from(new Set(CATALOGOS_SEED.map((c) => c.catalogo)));

/** Catálogos documentados como "a completar con el original" (sin ningún valor semilla todavía). */
export const CATALOGOS_PENDIENTES_DE_ORIGINAL = ["destino_categoria"] as const;
