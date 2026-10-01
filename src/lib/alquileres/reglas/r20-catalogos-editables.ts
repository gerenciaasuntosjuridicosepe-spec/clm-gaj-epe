/**
 * R20 — Catálogos editables. El ADMINISTRADOR puede agregar valores,
 * cambiar descripción y orden, y desactivar los que no son de sistema
 * (`es_sistema = FALSE`). No puede cambiar el código de un valor en uso ni
 * desactivar uno de sistema.
 */
import type { CatalogoValor } from "../tipos";

interface ResultadoValidacion {
  valida: boolean;
  error?: string;
}

export function validarEdicionCatalogo(
  valorActual: Pick<CatalogoValor, "codigo" | "esSistema">,
  cambios: Partial<Pick<CatalogoValor, "codigo" | "descripcion" | "orden" | "activo">>,
  estaEnUso: boolean
): ResultadoValidacion {
  if (cambios.codigo !== undefined && cambios.codigo !== valorActual.codigo) {
    if (estaEnUso) {
      return { valida: false, error: "No se puede cambiar el código de un valor en uso (R20)." };
    }
    if (valorActual.esSistema) {
      return { valida: false, error: "No se puede cambiar el código de un valor de sistema (R20)." };
    }
  }

  if (cambios.activo === false && valorActual.esSistema) {
    return { valida: false, error: "No se puede desactivar un valor de sistema (R20)." };
  }

  return { valida: true };
}
