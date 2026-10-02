import { crearRepositorio } from "../repositorio";
import { COMUNICACIONES_COLUMNS, SEQ_SHEET_NAMES, SHEET_NAMES } from "../esquema";
import { PREFIJOS_ID, type Comunicacion } from "../tipos";
import type { RepositorioTabla } from "../repositorio/tipos-repositorio";

let instancia: RepositorioTabla<Comunicacion> | null = null;

/** Repositorio de COMUNICACIONES — único punto que el resto del código debe usar para leer/escribir comunicaciones (RF-22/23/24). */
export function getRepositorioComunicaciones(): RepositorioTabla<Comunicacion> {
  if (!instancia) {
    instancia = crearRepositorio<Comunicacion>({
      hojaDatos: SHEET_NAMES.comunicaciones,
      hojaSecuencia: SEQ_SHEET_NAMES[PREFIJOS_ID.comunicacion],
      prefijo: PREFIJOS_ID.comunicacion,
      campoId: "comunicacionId",
      columnas: COMUNICACIONES_COLUMNS,
      nombreTabla: "COMUNICACIONES",
    });
  }
  return instancia;
}
