/**
 * R4' — Para pasar una actuación a FORMALIZADA son obligatorios:
 * `fecha_inicio`, `plazo_meses`, `fecha_fin`, `canon_inicial`,
 * `condicion_iva_canon`, destino (categoría + descripción) y firmante de
 * EPE. Para LEGITIMO_ABONO: período (fecha_inicio/fecha_fin), monto
 * (canon_inicial) y al menos un acto administrativo (se valida aparte,
 * RF-29, porque ACTOS_ADMIN es otra tabla — ver servicios/).
 */
import type { Actuacion } from "../tipos";

export interface ResultadoValidacionFormalizacion {
  valida: boolean;
  camposFaltantes: string[];
}

const CAMPOS_COMUNES: { campo: keyof Actuacion; etiqueta: string }[] = [
  { campo: "fechaInicio", etiqueta: "fecha de inicio" },
  { campo: "fechaFin", etiqueta: "fecha de fin" },
  { campo: "canonInicial", etiqueta: "canon inicial" },
  { campo: "condicionIvaCanon", etiqueta: "condición de IVA del canon" },
];

/**
 * @param tieneActoAdministrativo Solo relevante para LEGITIMO_ABONO (RF-29): si tiene al menos un ACTOS_ADMIN asociado.
 */
export function validarObligatoriosFormalizacion(
  actuacion: Actuacion,
  tieneActoAdministrativo = false
): ResultadoValidacionFormalizacion {
  const faltantes: string[] = [];

  for (const { campo, etiqueta } of CAMPOS_COMUNES) {
    if (actuacion[campo] === undefined || actuacion[campo] === "") faltantes.push(etiqueta);
  }

  if (actuacion.tipoActuacion === "LEGITIMO_ABONO") {
    if (!tieneActoAdministrativo) faltantes.push("al menos un acto administrativo");
  } else {
    // CONTRATO y ADENDA: además, plazo_meses, destino y firmante de EPE.
    if (actuacion.plazoMeses === undefined) faltantes.push("plazo en meses");
    if (!actuacion.destinoCategoria) faltantes.push("categoría de destino");
    if (!actuacion.destinoDescripcion) faltantes.push("descripción del destino");
    if (!actuacion.firmanteEpeContactoId) faltantes.push("firmante de EPE");
  }

  return { valida: faltantes.length === 0, camposFaltantes: faltantes };
}
