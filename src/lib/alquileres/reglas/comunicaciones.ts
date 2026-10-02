/**
 * RF-22/RF-23/RF-24 [CAMBIO en v2.1] + M16.
 */
import type { Area, ContactoEpe } from "../tipos";

interface ResultadoValidacion {
  valida: boolean;
  error?: string;
}

/** T23: sin fecha, o con fecha futura, se rechaza — el hito que esa comunicación cumple sigue pendiente. */
export function validarMarcarComoEnviado(fechaEnvio: string | undefined, hoy: string): ResultadoValidacion {
  if (!fechaEnvio) {
    return { valida: false, error: "La fecha de envío es obligatoria para marcar como enviado." };
  }
  if (fechaEnvio > hoy) {
    return { valida: false, error: "La fecha de envío no puede ser futura." };
  }
  return { valida: true };
}

/**
 * RF-22 — Destinatarios del aviso/reiteración, armados desde CONTACTOS_EPE
 * vigentes: sector SUCURSAL -> jefe de sucursal y designado; cualquier otro
 * tipo de área (GERENCIA y lo que se agregue a futuro al catálogo
 * `tipo_area` — ver docs/PENDIENTES-HUMANOS.md) -> gerente y responsable
 * designado. "Vigente" (RF-33): sin `vigenteHasta`, o con `vigenteHasta`
 * en el futuro o igual a hoy.
 */
export function armarDestinatarios(
  area: Pick<Area, "tipoArea">,
  contactos: Pick<ContactoEpe, "cargo" | "mail" | "vigenteHasta">[],
  hoy: string
): string[] {
  const cargosBuscados = area.tipoArea === "SUCURSAL" ? ["JEFE_SUCURSAL", "DESIGNADO"] : ["GERENTE", "RESPONSABLE_DESIGNADO"];
  const vigente = (c: Pick<ContactoEpe, "vigenteHasta">) => !c.vigenteHasta || c.vigenteHasta >= hoy;

  return contactos.filter((c) => cargosBuscados.includes(c.cargo) && vigente(c)).map((c) => c.mail);
}
