import { crearRepositorio } from "../repositorio";
import { ACTUACION_HITOS_COLUMNS, SEQ_SHEET_NAMES, SHEET_NAMES } from "../esquema";
import { PREFIJOS_ID, type ActuacionHito } from "../tipos";
import type { RepositorioTabla } from "../repositorio/tipos-repositorio";

let instancia: RepositorioTabla<ActuacionHito> | null = null;

/** Repositorio de ACTUACION_HITOS — único punto que el resto del código debe usar para leer/escribir hitos de actuaciones. */
export function getRepositorioActuacionHitos(): RepositorioTabla<ActuacionHito> {
  if (!instancia) {
    instancia = crearRepositorio<ActuacionHito>({
      hojaDatos: SHEET_NAMES.actuacionHitos,
      hojaSecuencia: SEQ_SHEET_NAMES[PREFIJOS_ID.actuacionHito],
      prefijo: PREFIJOS_ID.actuacionHito,
      campoId: "actuacionHitoId",
      columnas: ACTUACION_HITOS_COLUMNS,
      nombreTabla: "ACTUACION_HITOS",
    });
  }
  return instancia;
}
